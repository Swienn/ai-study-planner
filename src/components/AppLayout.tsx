import AppTopBar from "./AppTopBar";
import AppSidebar from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  activePlanId?: string;
  activeDate?: string;
}

export default function AppLayout({
  children,
  activePlanId,
  activeDate,
}: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-white">
      <AppTopBar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-60 border-r border-slate-200 flex-shrink-0 overflow-y-auto bg-slate-50">
          <AppSidebar activePlanId={activePlanId} activeDate={activeDate} />
        </aside>
        <main className="flex-1 overflow-y-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
