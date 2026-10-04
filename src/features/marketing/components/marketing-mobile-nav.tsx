"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";

type MarketingNavProps = {
  appName: string;
  blog: string;
  pricing: string;
  faq: string;
  support: string;
  login: string;
  startFree: string;
  menuLabel: string;
  closeMenu: string;
};

export function MarketingMobileNav({
  appName,
  blog,
  pricing,
  faq,
  support,
  login,
  startFree,
  menuLabel,
  closeMenu,
}: MarketingNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const links = [
    { href: "/pricing", label: pricing },
    { href: "/faq", label: faq },
    { href: "/support", label: support },
    { href: "/login", label: login },
  ];

  return (
    <>
      <nav className="hidden items-center gap-3 text-sm sm:flex sm:gap-5">
        <Link href="/pricing" className="text-[#1C1B1A]/70 transition hover:text-[#065F46]">
          {pricing}
        </Link>
        <Link href="/faq" className="text-[#1C1B1A]/70 transition hover:text-[#065F46]">
          {faq}
        </Link>
        <Link href="/support" className="text-[#1C1B1A]/70 transition hover:text-[#065F46]">
          {support}
        </Link>
        <LocaleSwitcher />
        <Link href="/login" className="text-[#1C1B1A]/70 transition hover:text-[#065F46]">
          {login}
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-[#065F46] px-4 py-2 font-medium text-white transition hover:bg-[#054d3a]"
        >
          {startFree}
        </Link>
      </nav>

      <div className="flex items-center gap-2 sm:hidden">
        <LocaleSwitcher />
        <Link
          href="/register"
          className="rounded-lg bg-[#065F46] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#054d3a]"
        >
          {startFree}
        </Link>
        <button
          type="button"
          aria-label={menuLabel}
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="rounded-lg border border-[#E4DFD3] px-3 py-1.5 text-sm text-[#065F46]"
        >
          ☰
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={closeMenu}
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 max-h-[85vh] overflow-y-auto rounded-b-2xl border-b border-[#E4DFD3] bg-[#FBF9F4] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E4DFD3] px-4 py-3">
              <p className="font-semibold text-[#065F46]">{appName}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                {closeMenu}
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base text-[#1C1B1A]/80 hover:bg-[#F3F0E8] hover:text-[#065F46]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
