import type { Metadata } from "next";
import { loadPackages } from "@/app/_components/packageData";
import { StatusTone, statusDefinitions, statusToneClasses } from "@/app/_components/packageInfo";
import { openGraphDefaults, siteUrl, twitterDefaults } from "@/app/_components/seo";

const title = "Rhino Packages FAQ";
const description =
  "How to install Rhino and Grasshopper plugins from the Yak package manager, which Rhino versions and platforms are supported, and how often the directory updates.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/faq" },
  openGraph: { ...openGraphDefaults, url: `${siteUrl}/faq`, title: `${title} | Rhino Packages`, description },
  twitter: { ...twitterDefaults, title: `${title} | Rhino Packages`, description },
};

/** Answer text: plain strings and links, so one source feeds both the page and the JSON-LD. */
type Part = string | { href: string; text: string };

interface Term {
  name: string;
  /** Set for the labels shown as a coloured pill on cards, so the glossary matches what people see. */
  tone?: StatusTone;
  definition: Part[];
}

interface Qa {
  /** The anchor other pages link to, e.g. /faq#status. */
  id?: string;
  question: string;
  answer: Part[];
  /** Glossary entries under the answer. The JSON-LD text lists them too. */
  terms?: Term[];
}

// The FAQ is the one place that defines the site's vocabulary (status labels,
// sort orders) and how often the data is refreshed. Other pages link here
// instead of repeating it, so keep the ids below stable.
function buildQa(packageCount: number): Qa[] {
  return [
    {
      question: "What is Rhino Packages?",
      answer: [
        `Rhino Packages is the most comprehensive directory of Rhino 3D and Grasshopper plugins. It currently indexes ${packageCount.toLocaleString("en-US")} packages from the Yak package manager with search, filtering, version history, and one-click install links.`,
      ],
    },
    {
      id: "install",
      question: "How do I install a Rhino plugin from this directory?",
      answer: [
        "Use Install in Rhino on a package page (on a desktop screen, the Install button on a list card does the same). The button opens a rhino:// protocol link that launches Rhino's built-in Package Manager and installs the plugin directly, so it only works on a computer that has Rhino installed. If nothing happens, or you are on a phone, follow the install steps on the package page (for example ",
        { href: "/package/Eddy3D#install", text: "Eddy3D" },
        "): run the _PackageManager command inside Rhino and search for the package name, or paste the terminal command shown there.",
      ],
    },
    {
      question: "What is the difference between a Rhino plugin and a Grasshopper plugin?",
      answer: [
        "Rhino plugins (.rhp) add commands and features directly to Rhinoceros 3D. Grasshopper plugins (.gha) add components to Grasshopper, Rhino's visual programming environment for parametric and computational design. Many packages include both.",
      ],
    },
    {
      question: "Which Rhino versions are supported?",
      answer: [
        "Packages in this directory support Rhino 6, Rhino 7, Rhino 8 and Rhino 9 (WIP). Filter by version to find plugins compatible with your installation, for example ",
        { href: "/?filters=64", text: "packages with a Rhino 8 build" },
        ".",
      ],
    },
    {
      question: "Are these plugins available for Mac?",
      answer: [
        "Many plugins support both Windows and macOS. Use the platform filter to ",
        { href: "/?filters=2", text: "find Mac-compatible packages" },
        ". Platform support depends on the individual plugin author.",
      ],
    },
    {
      id: "status",
      question: "What do the status labels mean?",
      answer: [
        "Package cards and package pages show these labels. A package can have several at once: lists show the first that applies, in the order No Rhino 8+ build, Inactive, Pre-release, New; the package page shows all of them.",
      ],
      terms: [
        {
          name: "Maintained",
          definition: [
            `${statusDefinitions.maintained} It has no label of its own: a package that is not Maintained is Inactive. It is also a switch in the filters (`,
            { href: "/?maintained=true", text: "see maintained packages" },
            ").",
          ],
        },
        {
          name: "Inactive",
          tone: "amber",
          definition: [`${statusDefinitions.inactive} The opposite of Maintained.`],
        },
        {
          name: "No Rhino 8+ build",
          tone: "rose",
          definition: [
            `${statusDefinitions.noRhino8} It is also a switch in the filters (`,
            { href: "/?deprecated=true", text: "see these packages" },
            ").",
          ],
        },
        {
          name: "Pre-release",
          tone: "yellow",
          definition: [statusDefinitions.prerelease],
        },
        {
          name: "New",
          tone: "green",
          definition: [statusDefinitions.new],
        },
      ],
    },
    {
      id: "sorting",
      question: "How is the package list sorted?",
      answer: ["The directory opens on Trending. The Sort menu above the list offers four orders:"],
      terms: [
        { name: "Downloads", definition: ["Most downloads in total, all time."] },
        { name: "Latest updates", definition: ["Most recent release first."] },
        { name: "Trending", definition: ["Most downloads in the last week."] },
        {
          name: "Rising stars",
          definition: [
            "The largest share of a package's lifetime downloads earned in the last week. Packages with fewer than 20 downloads this week or fewer than 100 in total rank last.",
          ],
        },
      ],
    },
    {
      id: "updates",
      question: "How often is the plugin directory updated?",
      answer: [
        "Data is checked every 3 hours. An automated GitHub Actions workflow syncs with the official Yak package manager feed and republishes the site whenever packages, versions or download counts have changed, so new plugins and releases usually appear within a few hours of being published.",
      ],
    },
  ];
}

function plainText(parts: Part[]) {
  return parts.map((part) => (typeof part === "string" ? part : part.text)).join("");
}

function answerText({ answer, terms }: Qa) {
  const lines = [plainText(answer), ...(terms ?? []).map((term) => `${term.name}: ${plainText(term.definition)}`)];
  return lines.join(" ");
}

function Parts({ parts }: { parts: Part[] }) {
  return (
    <>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          part
        ) : (
          <a key={i} href={part.href} className="pkg-link">
            {part.text}
          </a>
        ),
      )}
    </>
  );
}

export default function FaqPage() {
  const qa = buildQa(loadPackages().length);

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: answerText(item) },
    })),
  };

  return (
    <div className="mx-auto mt-6 max-w-3xl">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Frequently asked questions</h1>
      <dl className="mt-6 divide-y divide-gray-200 dark:divide-zinc-800">
        {qa.map((item) => (
          <div key={item.question} id={item.id} className="scroll-mt-4 py-4">
            <dt className="font-medium text-gray-900 dark:text-zinc-100">{item.question}</dt>
            <dd className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
              <Parts parts={item.answer} />
              {item.terms && (
                <dl className="mt-3 space-y-3">
                  {item.terms.map((term) => (
                    <div key={term.name} className="sm:flex sm:gap-4">
                      <dt className="flex-shrink-0 sm:w-40">
                        {term.tone ? (
                          <span
                            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-medium leading-4 ring-1 ring-inset ${statusToneClasses[term.tone]}`}
                          >
                            {term.name}
                          </span>
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-zinc-100">{term.name}</span>
                        )}
                      </dt>
                      <dd className="mt-1 sm:mt-0">
                        <Parts parts={term.definition} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
