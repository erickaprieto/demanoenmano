import { BottomNav } from "@/components/BottomNav";
import { TabsProviders } from "./providers";

export default function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TabsProviders>
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-obsidian text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <main
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]"
          id="main-content"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
    </TabsProviders>
  );
}
