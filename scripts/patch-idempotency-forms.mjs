import fs from "fs";
import path from "path";

const forms = [
  "src/features/clients/components/create-client-form.tsx",
  "src/features/invoices/components/create-invoice-form.tsx",
  "src/features/projects/components/create-project-form.tsx",
  "src/features/accounts/components/create-account-form.tsx",
  "src/features/categories/components/create-category-form.tsx",
  "src/features/budgets/components/create-budget-form.tsx",
  "src/features/savings-goals/components/create-savings-goal-form.tsx",
  "src/features/recurring-expenses/components/create-recurring-form.tsx",
  "src/features/workspaces/components/create-workspace-form.tsx",
  "src/features/debts/components/create-debt-dialog.tsx",
];

for (const rel of forms) {
  const file = path.join(process.cwd(), rel);
  let c = fs.readFileSync(file, "utf8");
  if (c.includes("useIdempotencyKey")) {
    console.log("skip", rel);
    continue;
  }

  c = c.replace(
    /from "react";/,
    'from "react";\nimport { useIdempotencyKey } from "@/hooks/use-idempotency-key";\nimport { IdempotencyKeyInput } from "@/components/idempotency-key-input";',
  );

  c = c.replace(
    /(const \[state, formAction[^\n]+\n)/,
    "$1  const { idempotencyKey, regenerateIdempotencyKey } = useIdempotencyKey();\n",
  );

  c = c.replace(
    /hasSubmittedRef\.current = false;\n(\s+)onSuccess/,
    "hasSubmittedRef.current = false;\n      regenerateIdempotencyKey();\n$1onSuccess",
  );
  c = c.replace(
    /setHasSubmitted\(false\);\n(\s+)onSuccess/,
    "setHasSubmitted(false);\n      regenerateIdempotencyKey();\n$1onSuccess",
  );
  c = c.replace(
    /if \(state\.success\) \{\n(\s+)onClose/,
    "if (state.success) {\n$1regenerateIdempotencyKey();\n$1onClose",
  );

  if (c.includes('name="workspaceId"')) {
    c = c.replace(
      /<input type="hidden" name="workspaceId" value=\{workspaceId\} \/>/,
      '<input type="hidden" name="workspaceId" value={workspaceId} />\n      <IdempotencyKeyInput value={idempotencyKey} />',
    );
  } else if (rel.includes("create-workspace-form")) {
    c = c.replace(
      /<form/,
      '<form',
    );
    c = c.replace(
      /(<form[^>]*>\n)/,
      "$1      <IdempotencyKeyInput value={idempotencyKey} />\n",
    );
  }

  fs.writeFileSync(file, c);
  console.log("patched", rel);
}
