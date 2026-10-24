"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { switchWorkspaceAction } from "@/features/workspaces/actions/switch-workspace";
import { useTranslations } from "next-intl";

type WorkspaceOption = {
  id: string;
  name: string;
  type: string;
};

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  className,
}: {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
  className?: string;
}) {
  const tNav = useTranslations("nav");
  const tWorkspaceType = useTranslations("workspaceType");
  const [isOpen, setIsOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSwitch(workspaceId: string) {
    if (workspaceId === activeWorkspaceId || isPending) return;
    setSwitchingId(workspaceId);
    startTransition(async () => {
      await switchWorkspaceAction(workspaceId);
      window.location.reload();
    });
  }

  const active = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  if (workspaces.length <= 1) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-2xs sm:text-sm ${className ?? ""}`}>
        <svg
          className="h-4 w-4 shrink-0 text-emerald-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <span className="truncate max-w-[150px] sm:max-w-[200px] text-neutral-900">
          {active?.name ?? "..."}
        </span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative z-50 inline-block ${className ?? ""}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isPending}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200/90 bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-2xs hover:border-neutral-300 hover:bg-neutral-50/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 transition sm:text-sm"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <svg
            className="h-4 w-4 shrink-0 text-emerald-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="truncate max-w-[130px] sm:max-w-[170px] text-neutral-900">
            {active?.name ?? "..."}
          </span>
        </div>

        {isPending ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent shrink-0" />
        ) : (
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-700" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute end-0 top-full mt-1.5 w-64 sm:w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-neutral-200/90 bg-white p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-neutral-400 font-semibold border-b border-neutral-100 mb-1">
            <span>{tNav("workspacesTitle")}</span>
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.2 text-[10px] text-neutral-600">
              {workspaces.length}
            </span>
          </div>

          {/* Workspaces List */}
          <div className="max-h-56 overflow-y-auto space-y-1">
            {workspaces.map((workspace) => {
              const isActive = workspace.id === activeWorkspaceId;
              const isSwitching = isPending && switchingId === workspace.id;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => {
                    if (!isActive) handleSwitch(workspace.id);
                  }}
                  disabled={isPending}
                  className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-right transition ${
                    isActive
                      ? "bg-emerald-50/80 border border-emerald-200/70 text-emerald-950 font-medium"
                      : "hover:bg-neutral-50 text-neutral-700 border border-transparent"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="truncate text-xs font-semibold text-neutral-900">
                      {workspace.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {tWorkspaceType(workspace.type)}
                    </span>
                  </div>

                  {isActive ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
                      
                    </span>
                  ) : isSwitching ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
