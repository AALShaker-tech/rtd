import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { EmployeeNav } from "./EmployeeNav";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.role !== "EMPLOYEE" && !isAdmin(session.role)))
    redirect("/employee/login");
  return (
    <EmployeeNav user={{ fullName: session.fullName, role: session.role }}>{children}</EmployeeNav>
  );
}
