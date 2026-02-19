using Microsoft.Extensions.Logging;
using Moq;
using RhinoPackages.Api;
using System.Net;
using System.Text.Json;

namespace RhinoPackages.Tests;

public class MockHttpMessageHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var url = request.RequestUri?.ToString() ?? "";
        string responseContent = "";

        if (url.EndsWith("/packages"))
        {
            var entries = new[] { new EntryYak("Author Name", 100, "TestPackage", "1.0.0") };
            responseContent = JsonSerializer.Serialize(entries, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });
        }
        else if (url.Contains("/versions/TestPackage/1.0.0/_icon"))
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }
        else if (url.Contains("/versions/TestPackage/1.0.0"))
        {
            var packageInfo = new PackageYak("2021-01-01T00:00:00Z", "A test package", Array.Empty<DistributionYak>(), "https://example.com", new[] { "test" }, false);
            responseContent = JsonSerializer.Serialize(packageInfo, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });
        }
        else if (url.Contains("/owners"))
        {
            var owners = new[] { new OwnerYak(1, "Owner 1") };
            responseContent = JsonSerializer.Serialize(owners, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });
        }
        else
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }

        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(responseContent)
        };
        return Task.FromResult(response);
    }
}

public class StoreTests
{
    [Fact]
    public async Task Seeder_Run_CorrectlyParsesMockedYakData()
    {
        // Arrange
        var mockLogger = new Mock<ILogger>();
        var emptyPackages = new List<Package>();
        
        var mockHandler = new MockHttpMessageHandler();
        var httpClient = new HttpClient(mockHandler);

        var seeder = new Seeder(mockLogger.Object, emptyPackages, httpClient);

        // Act
        var updates = await seeder.Run();

        // Assert
        Assert.Single(updates);
        var update = updates.First();
        Assert.Equal(Update.New, update.Update);
        
        var package = update.Package;
        Assert.Equal("TestPackage", package.Id);
        Assert.Equal("1.0.0", package.Version);
        Assert.Equal(100, package.Downloads);
        Assert.Equal("Author Name", package.Authors);
        Assert.Equal("A test package", package.Description);
        Assert.Single(package.Owners);
        Assert.Equal("Owner 1", package.Owners.First().Name);
    }
}
