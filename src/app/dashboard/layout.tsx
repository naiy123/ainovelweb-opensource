import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "创作中心",
}

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
