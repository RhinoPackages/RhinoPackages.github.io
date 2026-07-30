using System.IO.Compression;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace RhinoPackages.Api;

public record EntryYak(string Authors, int DownloadCount, string Name, string Version);
public record PackageYak(string CreatedAt, string? Description, DistributionYak[] Distributions, string? HomepageUrl, string[]? Keywords, bool Prerelease, string? IconUrl = null);
public record DistributionYak(string Filename, string Platform, string RhinoVersion, string Url, string? CreatedAt = null);
public record OwnerYak(int Id, string Name);
public record DownloadsYak(int LastDay, int LastWeek, int LastMonth);
public record YakVersionHistoryItem(string CreatedAt, string Version, DistributionYak[] Distributions, bool Prerelease, int DownloadCount = 0, DownloadsYak? Downloads = null);

public record HistoryStats(
    int Week,
    int Month,
    DateTime? FirstReleased,
    int VersionCount,
    DateTime? LastReleased = null,
    double? CadenceDays = null)
{
    public static readonly HistoryStats Empty = new(0, 0, null, 0);

    public static HistoryStats From(YakVersionHistoryItem[] history)
    {
        if (history.Length == 0)
            return Empty;

        var week = 0;
        var month = 0;
        DateTime? first = null;
        DateTime? last = null;

        foreach (var item in history)
        {
            week += item.Downloads?.LastWeek ?? 0;
            month += item.Downloads?.LastMonth ?? 0;

            if (!DateTime.TryParse(item.CreatedAt, out var created))
                continue;

            if (first is null || created < first)
                first = created;

            if (last is null || created > last)
                last = created;
        }

        // Average gap between releases. Measured across the same set that
        // VersionCount reports, since the package's own `updated` date can
        // predate later pre-releases.
        double? cadence = null;

        if (history.Length > 1 && first is not null && last is not null)
        {
            var span = (last.Value - first.Value).TotalDays;
            if (span > 0)
                cadence = span / (history.Length - 1);
        }

        return new(week, month, first, history.Length, last, cadence);
    }
}

/// <summary>Details read from a distribution's .yak archive.</summary>
public record DistributionInfo(Filters Type, long? SizeBytes, string? License)
{
    public static readonly DistributionInfo Empty = new(Filters.None, null, null);
}

public enum Update { None, New, Update, Remove }

public class Seeder
{
    readonly static JsonSerializerOptions _options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    /// <summary>How many archives to read per run purely to backfill size and license.</summary>
    const int BackfillLimit = 200;

    /// <summary>Attempts per API request, including the first.</summary>
    const int MaxAttempts = 3;

    /// <summary>Base delay before a retry; doubles per attempt.</summary>
    const int RetryDelayMs = 500;

    readonly HttpClient _client;
    readonly ILogger _logger;
    readonly IEnumerable<Package> _packages;

    int _backfilled;

    public Seeder(ILogger logger, IEnumerable<Package> packages, HttpClient? client = null)
    {
        _logger = logger;
        _packages = packages;
        _client = client ?? new HttpClient();
    }

    public async Task<IList<(Update Update, Package Package)>> Run()
    {
        _logger.LogInformation("Processing packages:");

        var entries = await Get<EntryYak[]>("packages");
        var packagesMap = _packages.ToDictionary(package => package.Id);

        var updates = new (Update Update, Package Package)[entries.Length];

        ParallelOptions parallelOptions = new()
        {
            MaxDegreeOfParallelism = 16
        };

        await Parallel.ForEachAsync(
            entries.Select((e, i) => (Entry: e, Index: i)),
            parallelOptions,
            async (item, token) =>
        {
            var (entry, index) = item;

            try
            {
                // The version history doubles as the source for rolling download
                // windows, first release date and version count, so fetch it up
                // front and reuse it below.
                YakVersionHistoryItem[] history = [];
                var historyFetched = false;

                try
                {
                    history = await Get<YakVersionHistoryItem[]>($"versions/{entry.Name}");
                    historyFetched = true;
                    await SaveVersionHistory(entry.Name, history);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to fetch version history for {Name}: {Message}", entry.Name, ex.Message);
                }

                var stats = HistoryStats.From(history);

                if (packagesMap.TryGetValue(entry.Name, out var package))
                {
                    if (package.Version == entry.Version)
                    {
                        var refreshed = package with
                        {
                            Downloads = entry.DownloadCount,
                            // A failed history fetch means "unknown", not zero.
                            // Publishing zeros here would differ from the stored
                            // record, so it would be saved and SaveSnapshots would
                            // chart a dip that never happened — and the point stays
                            // in the history after the next successful run.
                            DownloadsWeek = historyFetched ? stats.Week : package.DownloadsWeek,
                            DownloadsMonth = historyFetched ? stats.Month : package.DownloadsMonth,
                            FirstReleased = stats.FirstReleased ?? package.FirstReleased,
                            VersionCount = stats.VersionCount > 0 ? stats.VersionCount : package.VersionCount,
                            LastReleased = stats.LastReleased ?? package.LastReleased,
                            ReleaseCadenceDays = stats.CadenceDays ?? package.ReleaseCadenceDays,
                        };

                        // Size and license come from the archive, which is only
                        // read when a package publishes a new version. Backfill a
                        // bounded number of the remaining ones per run so existing
                        // packages fill in over a few days instead of never.
                        if (refreshed.SizeBytes is null && Interlocked.Increment(ref _backfilled) <= BackfillLimit)
                        {
                            try
                            {
                                var detail = await Get<PackageYak>($"versions/{entry.Name}/{entry.Version}");
                                var contents = await ReadDistributions(detail.Distributions);

                                refreshed = refreshed with
                                {
                                    SizeBytes = contents.SizeBytes,
                                    License = contents.License ?? refreshed.License,
                                };
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning("Failed to backfill {Name}: {Message}", entry.Name, ex.Message);
                            }
                        }

                        if (refreshed != package)
                        {
                            updates[index] = (Update.Update, refreshed);
                        }
                    }
                    else
                    {
                        var published = await MakePackage(entry, stats);

                        // Same reasoning as the refresh above: keep the last known
                        // windows rather than publishing zeros for them.
                        if (!historyFetched)
                        {
                            published = published with
                            {
                                DownloadsWeek = package.DownloadsWeek,
                                DownloadsMonth = package.DownloadsMonth,
                            };
                        }

                        updates[index] = (Update.Update, published);
                    }
                }
                else
                {
                    updates[index] = (Update.New, await MakePackage(entry, stats));
                }

                _logger.LogInformation("{Index} {Name}: {Update}", index, entry.Name, updates[index].Update);
            }
            // A package deleted between the listing and the detail fetch, an
            // unparseable date, a truncated archive: any one of these used to
            // propagate out of the parallel loop and abandon the whole refresh.
            // Update.None leaves this package's stored record untouched.
            catch (Exception ex)
            {
                _logger.LogError("Skipped {Name}: {Message}", entry.Name, ex.Message);
            }
        });

        var result = updates.Where(p => p.Update != Update.None).ToList();

        // Prune packages that are no longer published on the yak server, for
        // example ones that were deleted or renamed (a rename such as
        // "mycelium" -> "Mycelium" leaves the old entry stranded here forever
        // otherwise). Names are compared case-sensitively so a capitalization
        // change is treated as a different package. Guard against wiping the
        // whole catalogue if the server ever returns an empty list.
        if (entries.Length > 0)
        {
            var liveNames = new HashSet<string>(entries.Select(e => e.Name), StringComparer.Ordinal);

            foreach (var package in _packages)
            {
                if (!liveNames.Contains(package.Id))
                {
                    _logger.LogInformation("{Name}: {Update}", package.Id, Update.Remove);
                    DeleteVersionHistory(package.Id);
                    DeleteDownloadHistory(package.Id);
                    result.Add((Update.Remove, package));
                }
            }
        }

        return result;
    }

    /// <summary>
    /// Reads JSON from the yak API, retrying transient failures. A run makes
    /// upwards of 2,500 requests and happens four times a day, so a dropped
    /// connection or a brief 5xx is a certainty rather than an edge case.
    /// </summary>
    async Task<T> Get<T>(string route)
    {
        var url = "https://yak.rhino3d.com/" + route;

        for (var attempt = 1; ; attempt++)
        {
            var lastAttempt = attempt == MaxAttempts;
            string failure;

            try
            {
                using var response = await _client.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadFromJsonAsync<T>(_options)
                        ?? throw new($"{route} returned an empty body.");
                }

                // A 4xx will not fix itself — a deleted package stays deleted —
                // so only server errors are worth another attempt.
                if ((int)response.StatusCode < 500)
                {
                    throw new HttpRequestException(
                        $"{route} returned {(int)response.StatusCode} {response.ReasonPhrase}.",
                        null,
                        response.StatusCode);
                }

                failure = $"HTTP {(int)response.StatusCode}";
            }
            catch (Exception ex) when (!lastAttempt && IsTransient(ex))
            {
                failure = ex.Message;
            }

            if (lastAttempt)
                throw new HttpRequestException($"{route} failed after {MaxAttempts} attempts: {failure}");

            var delay = TimeSpan.FromMilliseconds(RetryDelayMs * Math.Pow(2, attempt - 1));
            _logger.LogWarning("Retrying {Route} in {Delay}ms after {Failure}", route, delay.TotalMilliseconds, failure);
            await Task.Delay(delay);
        }
    }

    // Connection resets and timeouts, as opposed to a response the server
    // meant to send. HttpRequestException carries a status code only when it
    // came from a response, so a null one is a transport failure.
    static bool IsTransient(Exception ex) =>
        ex is HttpRequestException { StatusCode: null } or TaskCanceledException or TimeoutException;

    async Task<Package> MakePackage(EntryYak entry, HistoryStats stats)
    {
        var packageTask = Get<PackageYak>($"versions/{entry.Name}/{entry.Version}");
        var ownersTask = Get<OwnerYak[]>($"packages/{entry.Name}/owners");

        await Task.WhenAll(packageTask, ownersTask);

        var package = packageTask.Result;
        var owners = ownersTask.Result;
        var contents = await ReadDistributions(package.Distributions);

        return new
        (
            Id: entry.Name,
            Version: entry.Version,
            Updated: DateTime.Parse(package.CreatedAt),
            Authors: entry.Authors,
            Downloads: entry.DownloadCount,
            IconUrl: GetIcon(entry.Name, package.IconUrl),
            Description: package.Description ?? "",
            Keywords: package.Keywords is null ? "" : string.Join(", ", package.Keywords),
            Prerelease: package.Prerelease,
            HomepageUrl: package.HomepageUrl,
            Filters: contents.Type,
            Owners: owners.Select(o => new Owner(o.Id, o.Name)).ToList(),
            DownloadsWeek: stats.Week,
            DownloadsMonth: stats.Month,
            FirstReleased: stats.FirstReleased,
            VersionCount: stats.VersionCount,
            LastReleased: stats.LastReleased,
            ReleaseCadenceDays: stats.CadenceDays,
            SizeBytes: contents.SizeBytes,
            License: contents.License
        );
    }

    async Task<DistributionInfo> ReadDistributions(DistributionYak[] distributions)
    {
        Filters filters = Filters.None;
        long? size = null;
        string? license = null;

        foreach (var distribution in distributions)
        {
            filters |= distribution.Platform switch
            {
                "win" => Filters.Windows,
                "mac" => Filters.Mac,
                _ => Filters.Windows | Filters.Mac
            };

            filters |= distribution.RhinoVersion[..3] switch
            {
                "rh6" => Filters.Rhino6,
                "rh7" => Filters.Rhino7,
                "rh8" => Filters.Rhino8,
                "rh9" => Filters.Rhino9,
                _ => Filters.Rhino6 | Filters.Rhino7 | Filters.Rhino8 | Filters.Rhino9
            };

            var info = await ReadDistribution(distribution.Url);

            filters |= info.Type;
            license ??= info.License;

            // Windows and Mac builds are alternatives, so report the largest
            // rather than the sum: that is what a user actually downloads.
            if (info.SizeBytes is not null && (size is null || info.SizeBytes > size))
                size = info.SizeBytes;
        }

        return new(filters, size, license);
    }

    async Task<DistributionInfo> ReadDistribution(string url)
    {
        try
        {
            using var response = await _client.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
            response.EnsureSuccessStatusCode();

            var size = response.Content.Headers.ContentLength;

            using var stream = await response.Content.ReadAsStreamAsync();

            // ZipArchive reads the central directory from the end of the
            // archive, so a forward-only network stream has to be buffered.
            using MemoryStream? buffer = stream.CanSeek ? null : new();

            if (buffer is not null)
            {
                await stream.CopyToAsync(buffer);
                buffer.Position = 0;
                size ??= buffer.Length;
            }

            using ZipArchive zip = new(buffer ?? stream, ZipArchiveMode.Read);

            Filters type = Filters.None;
            ZipArchiveEntry? manifest = null;

            foreach (var entry in zip.Entries)
            {
                var ext = Path.GetExtension(entry.FullName);

                type |= ext switch
                {
                    ".rhp" => Filters.Rhino,
                    ".gha" => Filters.Grasshopper,
                    _ => Filters.None
                };

                if (entry.FullName.Equals("manifest.yml", StringComparison.OrdinalIgnoreCase))
                    manifest = entry;
            }

            return new(type, size, manifest is null ? null : await ReadLicense(manifest));
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to fetch plugin distribution {Url}: {Message}", url, ex.Message);
            return DistributionInfo.Empty;
        }
    }

    // Most manifests omit a license, so a full YAML parser would be overkill:
    // read the one top-level scalar we care about.
    static async Task<string?> ReadLicense(ZipArchiveEntry manifest)
    {
        using var stream = manifest.Open();
        using StreamReader reader = new(stream);

        while (await reader.ReadLineAsync() is { } line)
        {
            if (!line.StartsWith("license:", StringComparison.OrdinalIgnoreCase))
                continue;

            var value = line["license:".Length..].Trim().Trim('"', '\'');
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        return null;
    }

    // The version endpoint reports the icon URL directly, so no extra request
    // per package is needed anymore.
    static string GetIcon(string name, string? iconUrl)
    {
        if (!string.IsNullOrWhiteSpace(iconUrl))
            return iconUrl;

        string[] specialIcons = ["plankton", "kangaroo", "metahopper", "iris", "imaging", "Weaver", "GhShaderNodes", "icosphere", "waterman", "Paneling"];
        var icon = specialIcons.FirstOrDefault(name.Contains) ?? "default";

        return $"/icons/special/{icon}.png";
    }
    void DeleteVersionHistory(string name)
    {
        var path = Path.Combine("../RhinoPackages.Web/public/data/versions", $"{name}.json");

        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to delete version history for {Name}: {Message}", name, ex.Message);
        }
    }

    void DeleteDownloadHistory(string name)
    {
        var path = Path.Combine("../RhinoPackages.Web/public/data/history", $"{name}.json");

        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to delete download history for {Name}: {Message}", name, ex.Message);
        }
    }

    async Task SaveVersionHistory(string name, YakVersionHistoryItem[] history)
    {
        var path = Path.Combine("../RhinoPackages.Web/public/data/versions", $"{name}.json");
        var directory = Path.GetDirectoryName(path);
        
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using var stream = File.Create(path);
        await JsonSerializer.SerializeAsync(stream, history, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false 
        });
    }
}
