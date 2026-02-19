using System.Text.Json;
using Microsoft.Extensions.Logging;
using System.IO;

namespace RhinoPackages.Api;

public record Package(string Id, string Version, DateTime Updated, string Authors, int Downloads, string? IconUrl,
    string Description, string Keywords, bool Prerelease, string? HomepageUrl, Filters Filters, List<Owner> Owners);

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
    Rhino8 = 64
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
            }
        }

        logger.LogInformation("Saving packages...");
        
        var directory = Path.GetDirectoryName(_dataFile);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using var stream = File.Create(_dataFile);
        await JsonSerializer.SerializeAsync(stream, packages, _options);
        logger.LogInformation("Saved successfully to {file}", _dataFile);
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

