import AppTopBar from "./AppTopBar";
import AppSidebar from "./AppSidebar";
import SidebarShell from "./SidebarShell";

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
    <SidebarShell
      topbar={<AppTopBar />}
      sidebar={<AppSidebar activePlanId={activePlanId} activeDate={activeDate} />}
    >
      {children}
    </SidebarShell>
  );
}
