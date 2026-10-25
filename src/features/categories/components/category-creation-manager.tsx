"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { CreateCategoryForm } from "@/features/categories/components/create-category-form";
import { useTranslations } from "next-intl";

export function CategoryCreationManager({
  workspaceId,
  canWrite = true,
}: {
  workspaceId: string;
  canWrite?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const t = useTranslations("forms.category");

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
        className="flex items-center gap-2 rounded-xl bg-[#065F46] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#054E3A] active:scale-98"
      >
        <span className="text-base font-bold leading-none">+</span>
        <span>{t("title")}</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("title")}
        maxWidthClassName="max-w-md"
      >
        <CreateCategoryForm
          workspaceId={workspaceId}
          showTitle={false}
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
