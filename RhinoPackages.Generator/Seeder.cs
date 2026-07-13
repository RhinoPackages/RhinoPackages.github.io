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

public record HistoryStats(int Week, int Month, DateTime? FirstReleased, int VersionCount)
{
    public static readonly HistoryStats Empty = new(0, 0, null, 0);

    public static HistoryStats From(YakVersionHistoryItem[] history)
    {
        if (history.Length == 0)
            return Empty;

        var week = 0;
        var month = 0;
        DateTime? first = null;

        foreach (var item in history)
        {
            week += item.Downloads?.LastWeek ?? 0;
            month += item.Downloads?.LastMonth ?? 0;

            if (DateTime.TryParse(item.CreatedAt, out var created) && (first is null || created < first))
                first = created;
        }

        return new(week, month, first, history.Length);
    }
}

public enum Update { None, New, Update, Remove }

public class Seeder
{
    readonly static JsonSerializerOptions _options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    readonly HttpClient _client;
    readonly ILogger _logger;
    readonly IEnumerable<Package> _packages;

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

            // The version history doubles as the source for rolling download
            // windows, first release date and version count, so fetch it up
            // front and reuse it below.
            YakVersionHistoryItem[] history = [];

            try
            {
                history = await Get<YakVersionHistoryItem[]>($"versions/{entry.Name}");
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
                        DownloadsWeek = stats.Week,
                        DownloadsMonth = stats.Month,
                        FirstReleased = stats.FirstReleased ?? package.FirstReleased,
                        VersionCount = stats.VersionCount > 0 ? stats.VersionCount : package.VersionCount,
                    };

                    if (refreshed != package)
                    {
                        updates[index] = (Update.Update, refreshed);
                    }
                }
                else
                {
                    updates[index] = (Update.Update, await MakePackage(entry, stats));
                }
            }
            else
            {
                updates[index] = (Update.New, await MakePackage(entry, stats));
            }

            _logger.LogInformation("{Index} {Name}: {Update}", index, entry.Name, updates[index].Update);
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

    async Task<T> Get<T>(string route)
    {
        var url = "https://yak.rhino3d.com/" + route;

        return await _client.GetFromJsonAsync<T>(url, _options)
            ?? throw new("Could not get package list.");
    }

    async Task<Package> MakePackage(EntryYak entry, HistoryStats stats)
    {
        var packageTask = Get<PackageYak>($"versions/{entry.Name}/{entry.Version}");
        var ownersTask = Get<OwnerYak[]>($"packages/{entry.Name}/owners");

        await Task.WhenAll(packageTask, ownersTask);

        var package = packageTask.Result;
        var owners = ownersTask.Result;

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
            Filters: await GetFilters(package.Distributions),
            Owners: owners.Select(o => new Owner(o.Id, o.Name)).ToList(),
            DownloadsWeek: stats.Week,
            DownloadsMonth: stats.Month,
            FirstReleased: stats.FirstReleased,
            VersionCount: stats.VersionCount
        );
    }

    async Task<Filters> GetFilters(DistributionYak[] distributions)
    {
        Filters filters = Filters.None;

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

            filters |= await GetPluginType(distribution.Url);
        }

        return filters;
    }

    async Task<Filters> GetPluginType(string url)
    {
        try
        {
            using var stream = await _client.GetStreamAsync(url);
            using ZipArchive zip = new(stream, ZipArchiveMode.Read);

            Filters type = Filters.None;

            foreach (var entry in zip.Entries)
            {
                var ext = Path.GetExtension(entry.FullName);

                type |= ext switch
                {
                    ".rhp" => Filters.Rhino,
                    ".gha" => Filters.Grasshopper,
                    _ => Filters.None
                };
            }

            return type;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to fetch plugin distribution {Url}: {Message}", url, ex.Message);
            return Filters.None;
        }
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
