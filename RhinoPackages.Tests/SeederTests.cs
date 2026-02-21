using System.IO.Compression;
using System.Net;
using System.Text;
using Microsoft.Extensions.Logging;
using Moq;
using RhinoPackages.Api;

namespace RhinoPackages.Tests;

public class SeederTests
{
    [Fact]
    public async Task Run_NewPackage_ReturnsNewUpdateAndSavesHistory()
    {
        var packageName = "UnitTestPackage";
        var packageVersion = "1.2.3";
        var yakBase = "https://yak.rhino3d.com/";
        var packageUrl = "https://files.example.test/unit-test-package.yak";

        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Unit Tester", "download_count": 42, "name": "UnitTestPackage", "version": "1.2.3" }
                ]
                """),
            [yakBase + $"versions/{packageName}/{packageVersion}"] = Json("""
                {
                  "created_at": "2026-02-20T00:00:00Z",
                  "description": "Test package",
                  "distributions": [
                    {
                      "filename": "UnitTestPackage-1.2.3-rh8_0-win.yak",
                      "platform": "win",
                      "rhino_version": "rh8_0",
                      "url": "https://files.example.test/unit-test-package.yak"
                    }
                  ],
                  "homepage_url": "https://example.test",
                  "keywords": ["test", "unit"],
                  "prerelease": false
                }
                """),
            [yakBase + $"packages/{packageName}/owners"] = Json("""
                [ { "id": 1, "name": "Owner One" } ]
                """),
            [yakBase + $"versions/{packageName}"] = Json("""
                [
                  {
                    "created_at": "2026-02-20T00:00:00Z",
                    "version": "1.2.3",
                    "distributions": [
                      {
                        "filename": "UnitTestPackage-1.2.3-rh8_0-win.yak",
                        "platform": "win",
                        "rhino_version": "rh8_0",
                        "url": "https://files.example.test/unit-test-package.yak"
                      }
                    ],
                    "prerelease": false
                  }
                ]
                """),
            [yakBase + $"versions/{packageName}/{packageVersion}/_icon"] = new HttpResponseMessage(HttpStatusCode.OK),
            [packageUrl] = ZipWithEntries("test.rhp"),
        };

        using var sandbox = new WorkingDirectorySandbox();
        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, [], client);

        var updates = await seeder.Run();

        Assert.Single(updates);
        Assert.Equal(Update.New, updates[0].Update);
        Assert.Equal(packageName, updates[0].Package.Id);
        Assert.Equal(packageVersion, updates[0].Package.Version);
        Assert.Equal(Filters.Windows | Filters.Rhino8 | Filters.Rhino, updates[0].Package.Filters);
        Assert.Equal(42, updates[0].Package.Downloads);

        var historyPath = Path.GetFullPath($"../RhinoPackages.Web/public/data/versions/{packageName}.json");
        Assert.True(File.Exists(historyPath));
    }

    [Fact]
    public async Task Run_SameVersionAndDownloads_ReturnsNoUpdates()
    {
        var packageName = "NoChangePackage";
        var packageVersion = "2.0.0";
        var yakBase = "https://yak.rhino3d.com/";

        var existing = new List<Package>
        {
            new(
                Id: packageName,
                Version: packageVersion,
                Updated: new DateTime(2026, 1, 1),
                Authors: "Unit Tester",
                Downloads: 99,
                IconUrl: "/icons/special/default.png",
                Description: "Existing",
                Keywords: "",
                Prerelease: false,
                HomepageUrl: null,
                Filters: Filters.Windows,
                Owners: [new Owner(1, "Owner One")]
            )
        };

        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Unit Tester", "download_count": 99, "name": "NoChangePackage", "version": "2.0.0" }
                ]
                """),
            [yakBase + $"versions/{packageName}"] = Json("""
                [
                  {
                    "created_at": "2026-01-01T00:00:00Z",
                    "version": "2.0.0",
                    "distributions": [],
                    "prerelease": false
                  }
                ]
                """),
        };

        using var sandbox = new WorkingDirectorySandbox();
        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, existing, client);

        var updates = await seeder.Run();

        Assert.Empty(updates);
    }

    static HttpResponseMessage Json(string json)
        => new(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    static HttpResponseMessage ZipWithEntries(params string[] entries)
    {
        var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            foreach (var entry in entries)
            {
                zip.CreateEntry(entry);
            }
        }
        ms.Position = 0;
        return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StreamContent(ms) };
    }

    sealed class FakeHandler(Dictionary<string, HttpResponseMessage> responses) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var url = request.RequestUri?.ToString() ?? string.Empty;
            if (!responses.TryGetValue(url, out var response))
            {
                throw new InvalidOperationException($"No fake response configured for URL: {url}");
            }

            return Task.FromResult(response);
        }
    }

    sealed class WorkingDirectorySandbox : IDisposable
    {
        readonly string _previous;
        readonly string _tempDir;

        public WorkingDirectorySandbox()
        {
            _previous = Directory.GetCurrentDirectory();
            _tempDir = Path.Combine(Path.GetTempPath(), "rhino-packages-tests-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_tempDir);
            Directory.SetCurrentDirectory(_tempDir);
        }

        public void Dispose()
        {
            Directory.SetCurrentDirectory(_previous);
            if (Directory.Exists(_tempDir))
            {
                Directory.Delete(_tempDir, recursive: true);
            }
        }
    }
}
