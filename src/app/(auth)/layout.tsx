import { MarketingHeader } from "@/features/marketing/components/marketing-header";
import "@fontsource/markazi-text/500.css";
import "@fontsource/markazi-text/600.css";
import "@fontsource/markazi-text/700.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F4] text-[#1C1B1A] pb-[calc(max(1.5rem,env(safe-area-inset-bottom,0px))+var(--kb-height,0px))]">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
