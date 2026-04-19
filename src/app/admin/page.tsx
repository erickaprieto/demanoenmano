import type { Metadata } from "next";
import { AdminPanelScreen } from "@/components/admin/AdminPanelScreen";

export const metadata: Metadata = {
  title: "Admin Panel",
};

export default function AdminPage() {
  return <AdminPanelScreen />;
}
