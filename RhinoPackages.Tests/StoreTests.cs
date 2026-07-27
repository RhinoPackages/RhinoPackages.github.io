using System.Text.Json;
using Microsoft.Extensions.Logging;
using Moq;
using RhinoPackages.Api;

namespace RhinoPackages.Tests;

public class StoreTests
{
    const string HistoryDir = "../RhinoPackages.Web/public/data/history";

    [Fact]
    public async Task SaveSnapshots_FirstRun_WritesPointPerPackageAndTotals()
    {
        using var sandbox = new WorkingDirectorySandbox();
        var store = MakeStore();

        await store.SaveSnapshots([Package("Alpha", 100, 10), Package("Beta", 50, 5)], Day(1));

        var alpha = ReadSnapshots("Alpha");
        Assert.Equal(new SnapshotPoint("2026-03-01", 100, 10), Assert.Single(alpha));

        var totals = ReadTotals();
        Assert.Equal(new TotalsPoint("2026-03-01", 2, 150), Assert.Single(totals));
    }

    [Fact]
    public async Task SaveSnapshots_UnchangedCounts_DoesNotAppendPoint()
    {
        using var sandbox = new WorkingDirectorySandbox();
        var store = MakeStore();

        await store.SaveSnapshots([Package("Alpha", 100, 10)], Day(1));
        await store.SaveSnapshots([Package("Alpha", 100, 10)], Day(2));

        // A quiet day adds nothing, which is what keeps the files sparse.
        var point = Assert.Single(ReadSnapshots("Alpha"));
        Assert.Equal("2026-03-01", point.Date);
        Assert.Single(ReadTotals());
    }

    [Fact]
    public async Task SaveSnapshots_ChangedCountsOnNewDay_AppendsPoint()
    {
        using var sandbox = new WorkingDirectorySandbox();
        var store = MakeStore();

        await store.SaveSnapshots([Package("Alpha", 100, 10)], Day(1));
        await store.SaveSnapshots([Package("Alpha", 130, 30)], Day(2));

        var points = ReadSnapshots("Alpha");
        Assert.Equal(2, points.Count);
        Assert.Equal(new SnapshotPoint("2026-03-02", 130, 30), points[1]);
    }

    [Fact]
    public async Task SaveSnapshots_ChangedCountsSameDay_OverwritesLastPoint()
    {
        using var sandbox = new WorkingDirectorySandbox();
        var store = MakeStore();

        await store.SaveSnapshots([Package("Alpha", 100, 10)], Day(1));
        await store.SaveSnapshots([Package("Alpha", 120, 20)], Day(1));

        // Re-running the generator on the same day must not create a second
        // point for that day.
        var point = Assert.Single(ReadSnapshots("Alpha"));
        Assert.Equal(new SnapshotPoint("2026-03-01", 120, 20), point);
    }

    [Fact]
    public async Task SaveSnapshots_WeeklyCountChangeAlone_IsRecorded()
    {
        using var sandbox = new WorkingDirectorySandbox();
        var store = MakeStore();

        await store.SaveSnapshots([Package("Alpha", 100, 10)], Day(1));
        await store.SaveSnapshots([Package("Alpha", 100, 4)], Day(2));

        var points = ReadSnapshots("Alpha");
        Assert.Equal(2, points.Count);
        Assert.Equal(4, points[1].Week);
    }

    [Fact]
    public async Task SaveSnapshots_TotalsFollowPackageCountAndDownloads()
    {
        using var sandbox = new WorkingDirectorySandbox();
        var store = MakeStore();

        await store.SaveSnapshots([Package("Alpha", 100, 10)], Day(1));
        await store.SaveSnapshots([Package("Alpha", 100, 10), Package("Beta", 7, 7)], Day(2));

        var totals = ReadTotals();
        Assert.Equal(2, totals.Count);
        Assert.Equal(new TotalsPoint("2026-03-02", 2, 107), totals[1]);
    }

    [Fact]
    public async Task SaveSnapshots_CorruptSnapshotFile_StartsFresh()
    {
        using var sandbox = new WorkingDirectorySandbox();
        Directory.CreateDirectory(HistoryDir);
        await File.WriteAllTextAsync(Path.Combine(HistoryDir, "Alpha.json"), "not json");

        var store = MakeStore();
        await store.SaveSnapshots([Package("Alpha", 100, 10)], Day(1));

        Assert.Equal(new SnapshotPoint("2026-03-01", 100, 10), Assert.Single(ReadSnapshots("Alpha")));
    }

    static Store MakeStore() => new(new Mock<ILogger<Store>>().Object);

    static DateTime Day(int day) => new(2026, 3, day, 12, 0, 0, DateTimeKind.Utc);

    static Package Package(string id, int downloads, int week) => new(
        Id: id,
        Version: "1.0.0",
        Updated: new DateTime(2026, 3, 1),
        Authors: "Tester",
        Downloads: downloads,
        IconUrl: "/icons/special/default.png",
        Description: "",
        Keywords: "",
        Prerelease: false,
        HomepageUrl: null,
        Filters: Filters.Windows,
        Owners: [new Owner(1, "Tester")],
        DownloadsWeek: week);

    static readonly JsonSerializerOptions _options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    static List<SnapshotPoint> ReadSnapshots(string id) =>
        JsonSerializer.Deserialize<List<SnapshotPoint>>(
            File.ReadAllText(Path.Combine(HistoryDir, $"{id}.json")), _options)!;

    static List<TotalsPoint> ReadTotals() =>
        JsonSerializer.Deserialize<List<TotalsPoint>>(
            File.ReadAllText(Path.Combine(HistoryDir, "_totals.json")), _options)!;
}
