"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

export type ComboboxClientItem = {
  _id: string;
  name: string;
  phone?: string | null;
};

export function ClientCombobox({
  clients,
  value,
  onChange,
  name = "clientId",
  id = "client-combobox",
  required = false,
  disabled = false,
  className = "",
}: {
  clients: ComboboxClientItem[];
  value: string;
  onChange: (clientId: string) => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("forms.client");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedClient = useMemo(
    () => clients.find((c) => c._id === value) || null,
    [clients, value],
  );

  // Normalize search query for Arabic and digits
  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;

    const queryDigits = q.replace(/\D/g, "");

    return clients.filter((client) => {
      const matchName = client.name.toLowerCase().includes(q);
      const phoneDigits = (client.phone || "").replace(/\D/g, "");
      const matchPhone =
        Boolean(client.phone && client.phone.toLowerCase().includes(q)) ||
        Boolean(queryDigits && phoneDigits.includes(queryDigits));
      return matchName || matchPhone;
    });
  }, [clients, query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      inputRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  function handleSelect(client: ComboboxClientItem) {
    onChange(client._id);
    setIsOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setIsOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredClients.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredClients.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredClients[highlightedIndex]) {
        handleSelect(filteredClients[highlightedIndex]);
      }
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML form submission */}
      <input
        type="hidden"
        name={name}
        id={id}
        value={value}
        required={required}
      />

      {/* Trigger Button / Display Box */}
      {!isOpen && selectedClient ? (
        <div
          onClick={() => !disabled && setIsOpen(true)}
          className={`flex items-center justify-between rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-3 py-2 text-right transition hover:border-emerald-600 dark:hover:border-[#34D399] ${
            disabled ? "cursor-not-allowed bg-neutral-100 dark:bg-[#161E1B] opacity-60" : "cursor-pointer"
          }`}
          role="combobox"
          aria-expanded={isOpen}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-[#0F2E24] text-xs font-semibold text-emerald-800 dark:text-[#34D399]">
              {selectedClient.name.trim().charAt(0) || "?"}
            </span>
            <div className="min-w-0 truncate">
              <span className="font-medium text-neutral-900 dark:text-[#ECEAE4]">
                {selectedClient.name}
              </span>
              {selectedClient.phone && (
                <span className="ms-2 inline-flex items-center rounded-md bg-neutral-100 dark:bg-[#26302C] px-1.5 py-0.5 text-xs text-neutral-600 dark:text-[#9AA39F] dir-ltr">
                   {selectedClient.phone}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-1 text-xs text-neutral-400 dark:text-[#9AA39F] hover:bg-neutral-100 dark:hover:bg-[#26302C] hover:text-neutral-700 dark:hover:text-[#ECEAE4]"
              title={t("clearSelection")}
            >
              ✕
            </button>
            <span className="text-xs text-emerald-700 dark:text-[#34D399] hover:underline">
              {t("clearSelection")}
            </span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && setIsOpen(true)}
          className={`relative flex items-center rounded-lg border bg-white dark:bg-[#1E2824] transition ${
            isOpen
              ? "border-emerald-600 dark:border-[#34D399] ring-2 ring-emerald-100 dark:ring-[#34D399]/20"
              : "border-neutral-300 dark:border-[#26302C] hover:border-emerald-600 dark:hover:border-[#34D399]"
          } ${disabled ? "cursor-not-allowed bg-neutral-100 dark:bg-[#161E1B] opacity-60" : "cursor-pointer"}`}
        >
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400 dark:text-[#66706B]">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(0);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedClient ? selectedClient.name : t("searchPlaceholder")}
            disabled={disabled}
            className="w-full bg-transparent py-2 pe-8 ps-9 text-sm text-neutral-900 dark:text-[#ECEAE4] placeholder:text-neutral-400 dark:placeholder:text-[#66706B] focus:outline-none"
          />

          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-neutral-400 dark:text-[#66706B]">
            <svg
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] shadow-lg">
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 divide-y divide-neutral-100 dark:divide-[#26302C] overflow-y-auto py-1 text-sm text-neutral-900 dark:text-[#ECEAE4] focus:outline-none"
          >
            {filteredClients.length === 0 ? (
              <li className="px-4 py-3 text-center text-sm text-neutral-500 dark:text-[#9AA39F]">
                {t("noClientsFound")}
                {query && <span className="font-semibold text-neutral-800 dark:text-[#ECEAE4]"> «{query}»</span>}
              </li>
            ) : (
              filteredClients.map((client, index) => {
                const isSelected = client._id === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={client._id}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(client)}
                    className={`flex cursor-pointer items-center justify-between px-3.5 py-2.5 transition ${
                      isHighlighted
                        ? "bg-emerald-50 dark:bg-[#0F2E24] text-emerald-950 dark:text-[#34D399]"
                        : "hover:bg-neutral-50 dark:hover:bg-[#1E2824]"
                    } ${isSelected ? "font-semibold bg-emerald-50/50 dark:bg-[#0F2E24]/70" : ""}`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#1E2824] text-xs text-neutral-600 dark:text-[#9AA39F]">
                        {client.name.trim().charAt(0) || "?"}
                      </span>
                      <span className="truncate">{client.name}</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {client.phone && (
                        <span className="inline-flex items-center rounded bg-neutral-100 dark:bg-[#1E2824] px-2 py-0.5 text-xs text-neutral-600 dark:text-[#9AA39F] dir-ltr">
                           {client.phone}
                        </span>
                      )}
                      {isSelected && (
                        <svg
                          className="h-4 w-4 text-emerald-600 dark:text-[#34D399]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
