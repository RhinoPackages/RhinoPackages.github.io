using Microsoft.Extensions.Logging;
using Moq;
using RhinoPackages.Api;

namespace RhinoPackages.Tests;

public class StoreTests
{
    [Fact]
    public async Task Seeder_Run_FetchesFromYakAndReturnsUpdates()
    {
        // Arrange
        var mockLogger = new Mock<ILogger>();
        var emptyPackages = new List<Package>();
        
        // Use a real HttpClient instead of a mocked one so it queries Yak directly.
        using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
        var seeder = new Seeder(mockLogger.Object, emptyPackages, httpClient);

        // Act
        // This will connect to the real Yak API.
        var updates = await seeder.Run();

        // Assert
        Assert.NotNull(updates);
        
        // We expect there to be more than 100 packages on the Yak API.
        Assert.True(updates.Count > 100, $"Expected > 100 updates but got {updates.Count}.");

        // Verify some data parsing
        var firstPackage = updates.First().Package;
        Assert.False(string.IsNullOrWhiteSpace(firstPackage.Id));
        Assert.False(string.IsNullOrWhiteSpace(firstPackage.Version));
        Assert.NotNull(firstPackage.Authors);
    }
}
