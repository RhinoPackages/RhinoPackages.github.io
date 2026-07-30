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
                  "prerelease": false,
                  "icon_url": "https://files.example.test/icons/unit-test.png"
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
                        "url": "https://files.example.test/unit-test-package.yak",
                        "created_at": "2026-02-20T00:00:00Z"
                      }
                    ],
                    "prerelease": false,
                    "download_count": 42,
                    "downloads": { "last_day": 1, "last_week": 5, "last_month": 20 }
                  }
                ]
                """),
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
        Assert.Equal("https://files.example.test/icons/unit-test.png", updates[0].Package.IconUrl);
        Assert.Equal(5, updates[0].Package.DownloadsWeek);
        Assert.Equal(20, updates[0].Package.DownloadsMonth);
        Assert.Equal(1, updates[0].Package.VersionCount);
        Assert.Equal(DateTime.Parse("2026-02-20T00:00:00Z"), updates[0].Package.FirstReleased);

        var historyPath = Path.GetFullPath($"../RhinoPackages.Web/public/data/versions/{packageName}.json");
        Assert.True(File.Exists(historyPath));
    }

    [Fact]
    public async Task Run_MissingIcon_ReturnsFallbackIconUrl()
    {
        var packageName = "NoIconPackage";
        var packageVersion = "1.0.0";
        var yakBase = "https://yak.rhino3d.com/";
        var packageUrl = "https://files.example.test/no-icon-package.yak";

        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Icon Tester", "download_count": 10, "name": "NoIconPackage", "version": "1.0.0" }
                ]
                """),
            [yakBase + $"versions/{packageName}/{packageVersion}"] = Json("""
                {
                  "created_at": "2026-02-21T00:00:00Z",
                  "description": "Test package without icon",
                  "distributions": [
                    {
                      "filename": "NoIconPackage-1.0.0-rh8_0-win.yak",
                      "platform": "win",
                      "rhino_version": "rh8_0",
                      "url": "https://files.example.test/no-icon-package.yak"
                    }
                  ],
                  "homepage_url": "https://example.test",
                  "keywords": ["test"],
                  "prerelease": false
                }
                """),
            [yakBase + $"packages/{packageName}/owners"] = Json("""
                [ { "id": 2, "name": "Owner Two" } ]
                """),
            [yakBase + $"versions/{packageName}"] = Json("""
                [
                  {
                    "created_at": "2026-02-21T00:00:00Z",
                    "version": "1.0.0",
                    "distributions": [
                      {
                        "filename": "NoIconPackage-1.0.0-rh8_0-win.yak",
                        "platform": "win",
                        "rhino_version": "rh8_0",
                        "url": "https://files.example.test/no-icon-package.yak"
                      }
                    ],
                    "prerelease": false
                  }
                ]
                """),
            [packageUrl] = ZipWithEntries("test.rhp"),
        };

        using var sandbox = new WorkingDirectorySandbox();
        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, [], client);

        var updates = await seeder.Run();

        Assert.Single(updates);
        Assert.Equal("/icons/special/default.png", updates[0].Package.IconUrl);
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
                Owners: [new Owner(1, "Owner One")],
                DownloadsWeek: 0,
                DownloadsMonth: 0,
                FirstReleased: DateTime.Parse("2026-01-01T00:00:00Z"),
                VersionCount: 1,
                LastReleased: DateTime.Parse("2026-01-01T00:00:00Z")
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

    [Fact]
    public async Task Run_PackageNoLongerOnServer_ReturnsRemoveAndDeletesHistory()
    {
        var staleName = "mycelium";
        var liveName = "Mycelium";
        var liveVersion = "1.0.0";
        var yakBase = "https://yak.rhino3d.com/";
        var packageUrl = "https://files.example.test/mycelium.yak";

        var existing = new List<Package>
        {
            new(
                Id: staleName,
                Version: "0.9.0",
                Updated: new DateTime(2026, 1, 1),
                Authors: "Author",
                Downloads: 5,
                IconUrl: "/icons/special/default.png",
                Description: "Old lowercase entry",
                Keywords: "",
                Prerelease: false,
                HomepageUrl: null,
                Filters: Filters.Windows,
                Owners: [new Owner(1, "Author")]
            )
        };

        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Author", "download_count": 7, "name": "Mycelium", "version": "1.0.0" }
                ]
                """),
            [yakBase + $"versions/{liveName}/{liveVersion}"] = Json("""
                {
                  "created_at": "2026-03-01T00:00:00Z",
                  "description": "Renamed package",
                  "distributions": [
                    {
                      "filename": "Mycelium-1.0.0-rh8_0-win.yak",
                      "platform": "win",
                      "rhino_version": "rh8_0",
                      "url": "https://files.example.test/mycelium.yak"
                    }
                  ],
                  "homepage_url": "https://example.test",
                  "keywords": ["test"],
                  "prerelease": false
                }
                """),
            [yakBase + $"packages/{liveName}/owners"] = Json("""
                [ { "id": 1, "name": "Author" } ]
                """),
            [yakBase + $"versions/{liveName}"] = Json("""
                [
                  {
                    "created_at": "2026-03-01T00:00:00Z",
                    "version": "1.0.0",
                    "distributions": [
                      {
                        "filename": "Mycelium-1.0.0-rh8_0-win.yak",
                        "platform": "win",
                        "rhino_version": "rh8_0",
                        "url": "https://files.example.test/mycelium.yak"
                      }
                    ],
                    "prerelease": false
                  }
                ]
                """),
            [packageUrl] = ZipWithEntries("test.rhp"),
        };

        using var sandbox = new WorkingDirectorySandbox();

        // Seed a stale history file for the lowercase entry that should be pruned.
        var staleHistoryPath = Path.GetFullPath($"../RhinoPackages.Web/public/data/versions/{staleName}.json");
        Directory.CreateDirectory(Path.GetDirectoryName(staleHistoryPath)!);
        await File.WriteAllTextAsync(staleHistoryPath, "[]");

        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, existing, client);

        var updates = await seeder.Run();

        Assert.Contains(updates, u => u.Update == Update.New && u.Package.Id == liveName);
        Assert.Contains(updates, u => u.Update == Update.Remove && u.Package.Id == staleName);
        Assert.False(File.Exists(staleHistoryPath));
    }

    [Fact]
    public async Task Run_SameVersion_WeeklyDownloadsChanged_ReturnsUpdate()
    {
        var packageName = "WeeklyChangePackage";
        var packageVersion = "1.0.0";
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
                Owners: [new Owner(1, "Owner One")],
                DownloadsWeek: 0,
                DownloadsMonth: 0,
                FirstReleased: DateTime.Parse("2026-01-01T00:00:00Z"),
                VersionCount: 1
            )
        };

        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Unit Tester", "download_count": 99, "name": "WeeklyChangePackage", "version": "1.0.0" }
                ]
                """),
            [yakBase + $"versions/{packageName}"] = Json("""
                [
                  {
                    "created_at": "2026-01-01T00:00:00Z",
                    "version": "1.0.0",
                    "distributions": [],
                    "prerelease": false,
                    "download_count": 99,
                    "downloads": { "last_day": 2, "last_week": 15, "last_month": 40 }
                  }
                ]
                """),
        };

        using var sandbox = new WorkingDirectorySandbox();
        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, existing, client);

        var updates = await seeder.Run();

        Assert.Single(updates);
        Assert.Equal(Update.Update, updates[0].Update);
        Assert.Equal(15, updates[0].Package.DownloadsWeek);
        Assert.Equal(40, updates[0].Package.DownloadsMonth);
    }

    [Fact]
    public async Task Run_ReadsSizeLicenseAndCadenceFromDistribution()
    {
        var packageName = "ManifestPackage";
        var packageVersion = "2.0.0";
        var yakBase = "https://yak.rhino3d.com/";
        var winUrl = "https://files.example.test/manifest-package-win.yak";
        var macUrl = "https://files.example.test/manifest-package-mac.yak";

        var manifest = """
            ---
            name: ManifestPackage
            version: 2.0.0
            license: MIT
            """;

        var win = ZipWith(manifest, "plugin.gha", "extra.dll");
        var mac = ZipWith(manifest, "plugin.gha");

        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Unit Tester", "download_count": 10, "name": "ManifestPackage", "version": "2.0.0" }
                ]
                """),
            [yakBase + $"versions/{packageName}/{packageVersion}"] = Json("""
                {
                  "created_at": "2026-02-10T00:00:00Z",
                  "description": "Test package",
                  "distributions": [
                    {
                      "filename": "ManifestPackage-2.0.0-rh8_0-win.yak",
                      "platform": "win",
                      "rhino_version": "rh8_0",
                      "url": "https://files.example.test/manifest-package-win.yak"
                    },
                    {
                      "filename": "ManifestPackage-2.0.0-rh8_0-mac.yak",
                      "platform": "mac",
                      "rhino_version": "rh8_0",
                      "url": "https://files.example.test/manifest-package-mac.yak"
                    }
                  ],
                  "keywords": [],
                  "prerelease": false
                }
                """),
            [yakBase + $"packages/{packageName}/owners"] = Json("""
                [ { "id": 3, "name": "Owner Three" } ]
                """),
            // Three releases spanning ten days: two gaps, so five days apart.
            [yakBase + $"versions/{packageName}"] = Json("""
                [
                  { "created_at": "2026-02-01T00:00:00Z", "version": "1.0.0", "distributions": [], "prerelease": false },
                  { "created_at": "2026-02-06T00:00:00Z", "version": "1.5.0", "distributions": [], "prerelease": true },
                  { "created_at": "2026-02-11T00:00:00Z", "version": "2.0.0", "distributions": [], "prerelease": false }
                ]
                """),
            [winUrl] = win,
            [macUrl] = mac,
        };

        using var sandbox = new WorkingDirectorySandbox();
        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, [], client);

        var updates = await seeder.Run();

        var package = Assert.Single(updates).Package;
        Assert.Equal("MIT", package.License);
        // The larger of the two platform builds, not their sum.
        Assert.Equal(win.Content.Headers.ContentLength, package.SizeBytes);
        Assert.Equal(3, package.VersionCount);
        Assert.Equal(5, package.ReleaseCadenceDays);
        Assert.Equal(DateTime.Parse("2026-02-11T00:00:00Z"), package.LastReleased);
        Assert.Equal(DateTime.Parse("2026-02-01T00:00:00Z"), package.FirstReleased);
    }

    [Fact]
    public async Task Run_SameVersionMissingSize_BackfillsFromArchive()
    {
        var packageName = "BackfillPackage";
        var packageVersion = "1.0.0";
        var yakBase = "https://yak.rhino3d.com/";
        var packageUrl = "https://files.example.test/backfill.yak";

        var existing = new List<Package>
        {
            new(
                Id: packageName,
                Version: packageVersion,
                Updated: new DateTime(2026, 1, 1),
                Authors: "Unit Tester",
                Downloads: 42,
                IconUrl: "/icons/special/default.png",
                Description: "Existing",
                Keywords: "",
                Prerelease: false,
                HomepageUrl: null,
                Filters: Filters.Windows,
                Owners: [new Owner(1, "Owner One")],
                FirstReleased: DateTime.Parse("2026-01-01T00:00:00Z"),
                VersionCount: 1,
                LastReleased: DateTime.Parse("2026-01-01T00:00:00Z")
            )
        };

        var archive = ZipWith("license: Apache-2.0", "plugin.gha");

        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Unit Tester", "download_count": 42, "name": "BackfillPackage", "version": "1.0.0" }
                ]
                """),
            [yakBase + $"versions/{packageName}/{packageVersion}"] = Json("""
                {
                  "created_at": "2026-01-01T00:00:00Z",
                  "description": "Existing",
                  "distributions": [
                    {
                      "filename": "BackfillPackage-1.0.0-rh8_0-win.yak",
                      "platform": "win",
                      "rhino_version": "rh8_0",
                      "url": "https://files.example.test/backfill.yak"
                    }
                  ],
                  "keywords": [],
                  "prerelease": false
                }
                """),
            [yakBase + $"versions/{packageName}"] = Json("""
                [
                  { "created_at": "2026-01-01T00:00:00Z", "version": "1.0.0", "distributions": [], "prerelease": false }
                ]
                """),
            [packageUrl] = archive,
        };

        using var sandbox = new WorkingDirectorySandbox();
        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, existing, client);

        var updates = await seeder.Run();

        var package = Assert.Single(updates).Package;
        Assert.Equal(Update.Update, updates[0].Update);
        Assert.Equal(archive.Content.Headers.ContentLength, package.SizeBytes);
        Assert.Equal("Apache-2.0", package.License);
    }

    [Fact]
    public async Task Run_DistributionWithoutManifest_LeavesLicenseUnset()
    {
        var packageName = "NoManifestPackage";
        var packageVersion = "1.0.0";
        var yakBase = "https://yak.rhino3d.com/";
        var packageUrl = "https://files.example.test/no-manifest.yak";

        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Unit Tester", "download_count": 1, "name": "NoManifestPackage", "version": "1.0.0" }
                ]
                """),
            [yakBase + $"versions/{packageName}/{packageVersion}"] = Json("""
                {
                  "created_at": "2026-02-10T00:00:00Z",
                  "description": "Test package",
                  "distributions": [
                    {
                      "filename": "NoManifestPackage-1.0.0-rh8_0-win.yak",
                      "platform": "win",
                      "rhino_version": "rh8_0",
                      "url": "https://files.example.test/no-manifest.yak"
                    }
                  ],
                  "keywords": [],
                  "prerelease": false
                }
                """),
            [yakBase + $"packages/{packageName}/owners"] = Json("""
                [ { "id": 4, "name": "Owner Four" } ]
                """),
            [yakBase + $"versions/{packageName}"] = Json("""
                [
                  { "created_at": "2026-02-10T00:00:00Z", "version": "1.0.0", "distributions": [], "prerelease": false }
                ]
                """),
            [packageUrl] = ZipWithEntries("plugin.rhp"),
        };

        using var sandbox = new WorkingDirectorySandbox();
        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, [], client);

        var package = Assert.Single(await seeder.Run()).Package;

        Assert.Null(package.License);
        // A single release has no gap to measure.
        Assert.Null(package.ReleaseCadenceDays);
    }

    [Fact]
    public async Task Run_HistoryFetchFails_KeepsPreviousDownloadWindows()
    {
        var packageName = "FlakyHistoryPackage";
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
                Owners: [new Owner(1, "Owner One")],
                DownloadsWeek: 7,
                DownloadsMonth: 30,
                FirstReleased: DateTime.Parse("2026-01-01T00:00:00Z"),
                VersionCount: 1,
                LastReleased: DateTime.Parse("2026-01-01T00:00:00Z"),
                SizeBytes: 1024
            )
        };

        // No response for versions/{name}: the history fetch fails the way a
        // transient API error would.
        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Unit Tester", "download_count": 150, "name": "FlakyHistoryPackage", "version": "2.0.0" }
                ]
                """),
        };

        using var sandbox = new WorkingDirectorySandbox();
        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, existing, client);

        var package = Assert.Single(await seeder.Run()).Package;

        // The lifetime count came from the package listing, so it still updates.
        Assert.Equal(150, package.Downloads);

        // The rolling windows are only known from the history. Zeroing them here
        // would write a dip into the charted download history that never
        // happened, and it would outlive the next successful run.
        Assert.Equal(7, package.DownloadsWeek);
        Assert.Equal(30, package.DownloadsMonth);
    }

    [Fact]
    public async Task Run_OnePackageFails_StillReturnsTheOthers()
    {
        var yakBase = "https://yak.rhino3d.com/";
        var goodUrl = "https://files.example.test/good.yak";

        // BrokenPackage has no detail response, mimicking a package deleted
        // between the listing and the detail fetch.
        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Unit Tester", "download_count": 1, "name": "BrokenPackage", "version": "1.0.0" },
                  { "authors": "Unit Tester", "download_count": 2, "name": "GoodPackage", "version": "1.0.0" }
                ]
                """),
            [yakBase + "versions/GoodPackage/1.0.0"] = Json("""
                {
                  "created_at": "2026-03-01T00:00:00Z",
                  "description": "Fine",
                  "distributions": [
                    {
                      "filename": "GoodPackage-1.0.0-rh8_0-win.yak",
                      "platform": "win",
                      "rhino_version": "rh8_0",
                      "url": "https://files.example.test/good.yak"
                    }
                  ],
                  "keywords": [],
                  "prerelease": false
                }
                """),
            [yakBase + "packages/GoodPackage/owners"] = Json("""
                [ { "id": 2, "name": "Owner Two" } ]
                """),
            [yakBase + "versions/GoodPackage"] = Json("""
                [
                  { "created_at": "2026-03-01T00:00:00Z", "version": "1.0.0", "distributions": [], "prerelease": false }
                ]
                """),
            [yakBase + "versions/BrokenPackage"] = Json("""
                [
                  { "created_at": "2026-03-01T00:00:00Z", "version": "1.0.0", "distributions": [], "prerelease": false }
                ]
                """),
            [goodUrl] = ZipWithEntries("good.rhp"),
        };

        using var sandbox = new WorkingDirectorySandbox();
        using var client = new HttpClient(new FakeHandler(responses));
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, [], client);

        var package = Assert.Single(await seeder.Run()).Package;

        Assert.Equal("GoodPackage", package.Id);
    }

    [Fact]
    public async Task Run_ServerErrorThenSuccess_RetriesTheRequest()
    {
        var packageName = "RetryPackage";
        var yakBase = "https://yak.rhino3d.com/";
        var packageUrl = "https://files.example.test/retry.yak";
        var flakyUrl = yakBase + $"versions/{packageName}";

        var responses = new Dictionary<string, HttpResponseMessage>
        {
            [yakBase + "packages"] = Json("""
                [
                  { "authors": "Unit Tester", "download_count": 3, "name": "RetryPackage", "version": "1.0.0" }
                ]
                """),
            [yakBase + $"versions/{packageName}/1.0.0"] = Json("""
                {
                  "created_at": "2026-04-01T00:00:00Z",
                  "description": "Retried",
                  "distributions": [
                    {
                      "filename": "RetryPackage-1.0.0-rh8_0-win.yak",
                      "platform": "win",
                      "rhino_version": "rh8_0",
                      "url": "https://files.example.test/retry.yak"
                    }
                  ],
                  "keywords": [],
                  "prerelease": false
                }
                """),
            [yakBase + $"packages/{packageName}/owners"] = Json("""
                [ { "id": 3, "name": "Owner Three" } ]
                """),
            [flakyUrl] = Json("""
                [
                  {
                    "created_at": "2026-04-01T00:00:00Z",
                    "version": "1.0.0",
                    "distributions": [],
                    "prerelease": false,
                    "downloads": { "last_day": 1, "last_week": 4, "last_month": 9 }
                  }
                ]
                """),
            [packageUrl] = ZipWithEntries("retry.rhp"),
        };

        using var sandbox = new WorkingDirectorySandbox();
        var handler = new FlakyHandler(responses, flakyUrl, failures: 2);
        using var client = new HttpClient(handler);
        var logger = new Mock<ILogger>();
        var seeder = new Seeder(logger.Object, [], client);

        var package = Assert.Single(await seeder.Run()).Package;

        Assert.Equal(3, handler.Attempts);

        // The windows prove the retried response was the one that got used.
        Assert.Equal(4, package.DownloadsWeek);
        Assert.Equal(9, package.DownloadsMonth);
    }

    static HttpResponseMessage Json(string json)
        => new(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    static HttpResponseMessage ZipWithEntries(params string[] entries)
        => ZipWith(null, entries);

    static HttpResponseMessage ZipWith(string? manifest, params string[] entries)
    {
        var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            foreach (var entry in entries)
            {
                zip.CreateEntry(entry);
            }

            if (manifest is not null)
            {
                using var stream = zip.CreateEntry("manifest.yml").Open();
                using StreamWriter writer = new(stream);
                writer.Write(manifest);
            }
        }
        ms.Position = 0;

        var response = new HttpResponseMessage(HttpStatusCode.OK) { Content = new StreamContent(ms) };
        response.Content.Headers.ContentLength = ms.Length;
        return response;
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

    /// <summary>Answers one URL with 503 a few times before letting it through.</summary>
    sealed class FlakyHandler(Dictionary<string, HttpResponseMessage> responses, string flakyUrl, int failures)
        : HttpMessageHandler
    {
        int _served;

        public int Attempts { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var url = request.RequestUri?.ToString() ?? string.Empty;

            if (url == flakyUrl)
            {
                Attempts++;

                if (_served++ < failures)
                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
            }

            if (!responses.TryGetValue(url, out var response))
            {
                throw new InvalidOperationException($"No fake response configured for URL: {url}");
            }

            return Task.FromResult(response);
        }
    }

}
