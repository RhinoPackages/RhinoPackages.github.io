namespace RhinoPackages.Tests;

/// <summary>
/// The generator writes to paths relative to the working directory, so each
/// test runs inside its own temporary directory.
/// </summary>
sealed class WorkingDirectorySandbox : IDisposable
{
    readonly string _previous;
    readonly string _tempDir;

    public WorkingDirectorySandbox()
    {
        _previous = Directory.GetCurrentDirectory();
        _tempDir = Path.Combine(Path.GetTempPath(), "rhino-packages-tests-" + Guid.NewGuid().ToString("N"));

        // The generator writes to "../RhinoPackages.Web/...", so the working
        // directory needs a private parent — otherwise every sandbox would
        // resolve to the same shared temp folder.
        var workingDir = Path.Combine(_tempDir, "RhinoPackages.Generator");
        Directory.CreateDirectory(workingDir);
        Directory.SetCurrentDirectory(workingDir);
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
