import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { EmployeeNav } from "./EmployeeNav";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.role !== "EMPLOYEE" && session.role !== "ADMIN")) redirect("/employee/login");
  return <EmployeeNav user={{ fullName: session.fullName, role: session.role }}>{children}</EmployeeNav>;
}
