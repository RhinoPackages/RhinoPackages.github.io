using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RhinoPackages.Api;

var host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        services.AddLogging(builder => builder.AddConsole());
        services.AddSingleton<Store>();
    })
    .Build();

var store = host.Services.GetRequiredService<Store>();
await store.SavePackages(false);

