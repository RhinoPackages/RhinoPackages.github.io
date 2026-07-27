// The generator resolves its output paths relative to the working directory,
// and WorkingDirectorySandbox changes that process-wide, so test classes must
// not run concurrently.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
