export function LegalPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold text-[#1C1B1A]">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-[#1C1B1A]/60">{subtitle}</p>}
      <div className="prose prose-neutral mt-10 max-w-none prose-headings:text-[#1C1B1A] prose-p:leading-relaxed prose-p:text-[#1C1B1A]/80">
        {children}
      </div>
    </div>
  );
}
