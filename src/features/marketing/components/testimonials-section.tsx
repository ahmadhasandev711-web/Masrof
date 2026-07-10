import { getTranslations } from "next-intl/server";

type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
};

export async function TestimonialsSection() {
  const t = await getTranslations("marketing.testimonials");
  const testimonials = t.raw("items") as TestimonialItem[];

  return (
    <section className="border-b border-[#E4DFD3]/60 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center font-[family-name:var(--font-marketing-display)] text-2xl font-semibold text-[#1C1B1A]">
          {t("title")}
        </h2>
        <p className="mt-2 text-center text-[#1C1B1A]/60">{t("subtitle")}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote
              key={item.name}
              className="rounded-2xl border border-[#E4DFD3] bg-[#FBF9F4] p-6"
            >
              <p className="leading-relaxed text-[#1C1B1A]/80">«{item.quote}»</p>
              <footer className="mt-4 border-t border-[#E4DFD3]/80 pt-4">
                <p className="font-medium text-[#065F46]">{item.name}</p>
                <p className="text-xs text-[#1C1B1A]/50">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
