using System.Text.Json;
using Microsoft.Extensions.Logging;
using System.IO;

namespace RhinoPackages.Api;

public record Package(string Id, string Version, DateTime Updated, string Authors, int Downloads, string? IconUrl,
    string Description, string Keywords, bool Prerelease, string? HomepageUrl, Filters Filters, List<Owner> Owners,
    int DownloadsWeek = 0, int DownloadsMonth = 0, DateTime? FirstReleased = null, int VersionCount = 0);

public record SnapshotPoint(string Date, int Downloads, int Week);

public record TotalsPoint(string Date, int Packages, long Downloads);

public record Owner(int Id, string Name);

[Flags]
public enum Filters
{
    None = 0,
    Windows = 1,
    Mac = 2,
    Rhino = 4,
    Grasshopper = 8,
    Rhino6 = 16,
    Rhino7 = 32,
    Rhino8 = 64,
    Rhino9 = 128
}

public class Store(ILogger<Store> logger)
{
    const string _dataFile = "../RhinoPackages.Web/public/data.json";

    readonly static JsonSerializerOptions _options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public async Task SavePackages(bool clear)
    {
        List<Package> packages = [];

        if (!clear)
        {
            packages.AddRange(await LoadPackages());
        }

        Seeder seeder = new(logger, packages);
        var updates = await seeder.Run();

        logger.LogInformation("{Count} packages to update...", updates.Count);

        if (!clear && updates.Count == 0)
            return;

        foreach (var (action, package) in updates)
        {
            switch (action)
            {
                case Update.New:
                    packages.Add(package);
                    break;
                case Update.Update:
                    var index = packages.FindIndex(p => p.Id == package.Id);
                    if (index >= 0)
                    {
                        packages[index] = package;
                    }
                    else
                    {
                        packages.Add(package);
                    }
                    break;
                case Update.Remove:
                    packages.RemoveAll(p => p.Id == package.Id);
                    break;
            }
        }

        logger.LogInformation("Saving packages...");
        
        var directory = Path.GetDirectoryName(_dataFile);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using (var stream = File.Create(_dataFile))
        {
            await JsonSerializer.SerializeAsync(stream, packages, _options);
        }

        logger.LogInformation("Saved successfully to {file}", _dataFile);

        await SaveSnapshots(packages);
    }

    const string _historyDir = "../RhinoPackages.Web/public/data/history";

    // Appends one download snapshot per package per day, only when the counts
    // actually moved, so the files stay sparse while still charting growth.
    async Task SaveSnapshots(List<Package> packages)
    {
        Directory.CreateDirectory(_historyDir);
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

        foreach (var package in packages)
        {
            var path = Path.Combine(_historyDir, $"{package.Id}.json");
            var points = await LoadJson<List<SnapshotPoint>>(path) ?? [];
            var last = points.Count > 0 ? points[^1] : null;

            if (last is not null && last.Downloads == package.Downloads && last.Week == package.DownloadsWeek)
                continue;

            if (last is not null && last.Date == today)
                points[^1] = new SnapshotPoint(today, package.Downloads, package.DownloadsWeek);
            else
                points.Add(new SnapshotPoint(today, package.Downloads, package.DownloadsWeek));

            await SaveJson(path, points);
        }

        var totalsPath = Path.Combine(_historyDir, "_totals.json");
        var totals = await LoadJson<List<TotalsPoint>>(totalsPath) ?? [];
        var current = new TotalsPoint(today, packages.Count, packages.Sum(p => (long)p.Downloads));
        var lastTotal = totals.Count > 0 ? totals[^1] : null;

        if (lastTotal is null || lastTotal.Packages != current.Packages || lastTotal.Downloads != current.Downloads)
        {
            if (lastTotal is not null && lastTotal.Date == today)
                totals[^1] = current;
            else
                totals.Add(current);

            await SaveJson(totalsPath, totals);
        }

        logger.LogInformation("Saved download snapshots to {dir}", _historyDir);
    }

    static async Task<T?> LoadJson<T>(string path) where T : class
    {
        if (!File.Exists(path))
            return null;

        try
        {
            using var stream = File.OpenRead(path);
            return await JsonSerializer.DeserializeAsync<T>(stream, _options);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    static async Task SaveJson<T>(string path, T value)
    {
        using var stream = File.Create(path);
        await JsonSerializer.SerializeAsync(stream, value, _options);
    }

    static async Task<Package[]> LoadPackages()
    {
        if (!File.Exists(_dataFile))
            return [];

        using var stream = File.OpenRead(_dataFile);
        try 
        {
            var packages = await JsonSerializer.DeserializeAsync<Package[]>(stream, _options);
            return packages ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}

