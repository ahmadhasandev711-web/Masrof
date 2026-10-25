"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { CreateProjectForm } from "@/features/projects/components/create-project-form";
import type { ClientOption } from "@/features/clients/types";
import { useTranslations } from "next-intl";

export function ProjectCreationManager({
  workspaceId,
  clients,
  canWrite,
}: {
  workspaceId: string;
  clients: ClientOption[];
  canWrite: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const t = useTranslations("pages.projects");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams]);

  if (!canWrite) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#065F46] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#054E3A] active:scale-98"
      >
        <span className="text-base font-bold leading-none">+</span>
        <span>{t("newProjectBtn")}</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("newProjectTitle")}
        subtitle={t("newProjectSubtitle")}
        maxWidthClassName="max-w-xl"
      >
        <CreateProjectForm
          workspaceId={workspaceId}
          clients={clients}
          onCancel={() => setIsOpen(false)}
          onSuccess={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
