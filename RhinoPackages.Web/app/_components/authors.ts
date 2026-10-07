import { loadPackages } from "./packageData";
import { Package, matchesOwner, normalizeName } from "./packageModel";

/**
 * A Yak publisher with a page of its own. Accounts sharing a name are one
 * author (people often hold two), and packages that only credit the name in
 * their author list count too, the same way the directory's owner filter does.
 */
export interface Author {
  slug: string;
  /** Lowest account id: the one the directory's "?owner=" filter uses. */
  id: number;
  name: string;
  packages: Package[];
  /** Packages published from one of the author's accounts. */
  owned: number;
}

/** Single-package authors get a page but stay out of search: it would just repeat the package page. */
export const minIndexedPackages = 2;

let authorsCache: Author[] | undefined;
let authorsBySlug: Map<string, Author> | undefined;
let authorsByName: Map<string, Author> | undefined;

/** "Sérgio Correia" → "sergio-correia"; names with no Latin letters fall back to the account id. */
function slugify(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function loadAuthors(): Author[] {
  if (authorsCache) return authorsCache;

  const all = loadPackages();
  const accounts = new Map<string, { id: number; name: string }>();
  for (const pkg of all) {
    for (const owner of pkg.owners) {
      const key = normalizeName(owner.name);
      const seen = accounts.get(key);
      if (!seen || owner.id < seen.id) accounts.set(key, { id: owner.id, name: owner.name.trim() });
    }
  }

  const bySlug = new Map<string, { id: number; name: string }[]>();
  for (const account of Array.from(accounts.values())) {
    const slug = slugify(account.name) || String(account.id);
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), account]);
  }

  const authors: Author[] = [];
  for (const [slug, group] of Array.from(bySlug.entries())) {
    for (const account of group) {
      const target = normalizeName(account.name);
      const packages = all
        .filter((pkg) => matchesOwner(pkg, account.id, account.name))
        .sort((a, b) => b.downloads - a.downloads);
      const owned = packages.filter((pkg) => pkg.owners.some((o) => normalizeName(o.name) === target)).length;
      authors.push({
        // Two names that only differ in punctuation share a slug: keep it unique with the id.
        slug: group.length > 1 ? `${slug}-${account.id}` : slug,
        id: account.id,
        name: account.name,
        packages,
        owned,
      });
    }
  }

  authorsCache = authors.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  authorsBySlug = new Map(authors.map((author) => [author.slug, author]));
  authorsByName = new Map(authors.map((author) => [normalizeName(author.name), author]));
  return authorsCache;
}

export function findAuthor(slug: string): Author | undefined {
  loadAuthors();
  return authorsBySlug!.get(slug);
}

/** The author page for a publisher or credited name, if that name publishes on Yak. */
export function findAuthorByName(name: string): Author | undefined {
  loadAuthors();
  return authorsByName!.get(normalizeName(name));
}

export function authorPath(slug: string) {
  return `/author/${encodeURIComponent(slug)}`;
}

export function isIndexedAuthor(author: Author) {
  return author.packages.length >= minIndexedPackages;
}
