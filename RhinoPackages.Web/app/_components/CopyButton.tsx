"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/solid";

/** Copies `text` to the clipboard and says "Copied" for two seconds, to screen readers too. */
export default function CopyButton({ text, label, ariaLabel }: { text: string; label: string; ariaLabel?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  function copy() {
    // navigator.clipboard is missing outside secure contexts; stay quiet there.
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }, () => undefined);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={ariaLabel}
        className="inline-flex flex-none items-center gap-1.5 rounded-md align-middle bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:focus-visible:ring-brand-400"
      >
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-500" aria-hidden="true" />
        ) : (
          <ClipboardDocumentIcon className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
        )}
        {copied ? "Copied" : label}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
