"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@heroicons/react/20/solid";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    toggleVisibility(); // Initial check

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? "visible translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Scroll to top"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-md transition-all hover:bg-brand-600 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:bg-brand-600 dark:hover:bg-brand-500 dark:focus-visible:ring-offset-zinc-950"
      >
        <ArrowUpIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
