import Image from "next/image";

type GitHubContributor = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

const defaultRepository = "RhinoPackages/RhinoPackages.github.io";

async function getContributors(): Promise<GitHubContributor[]> {
  const repository = process.env.GITHUB_REPOSITORY || defaultRepository;
  const maxPages = 10;
  const perPage = 100;
  const all: GitHubContributor[] = [];

  try {
    for (let page = 1; page <= maxPages; page++) {
      const response = await fetch(
        `https://api.github.com/repos/${repository}/contributors?per_page=${perPage}&page=${page}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "RhinoPackages-Web",
          },
          cache: "force-cache",
        }
      );

      if (!response.ok) {
        break;
      }

      const contributors = (await response.json()) as GitHubContributor[];
      if (!Array.isArray(contributors) || contributors.length === 0) {
        break;
      }

      all.push(...contributors);

      if (contributors.length < perPage) {
        break;
      }
    }
  } catch {
    return [];
  }

  const unique = new Map<number, GitHubContributor>();
  for (const contributor of all) {
    unique.set(contributor.id, contributor);
  }

  return Array.from(unique.values()).sort((a, b) => b.contributions - a.contributions);
}

export default async function ContributorsBubbles() {
  const contributors = await getContributors();

  if (contributors.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
        Contributors
      </p>
      <ul className="flex flex-wrap justify-center gap-2">
        {contributors.map((contributor) => (
          <li key={contributor.id}>
            <a
              href={contributor.html_url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${contributor.login} (${contributor.contributions} contributions)`}
              aria-label={`GitHub profile of ${contributor.login}`}
              className="block transition-transform hover:scale-105"
            >
              <Image
                src={contributor.avatar_url}
                alt={`${contributor.login} avatar`}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full ring-1 ring-gray-300 dark:ring-zinc-700"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
