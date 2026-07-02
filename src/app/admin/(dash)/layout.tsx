import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) redirect("/admin/login");
  return <AdminNav user={{ fullName: session.fullName, role: session.role }}>{children}</AdminNav>;
}
