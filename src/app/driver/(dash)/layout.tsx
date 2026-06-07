import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DriverNav } from "./DriverNav";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.role !== "DRIVER" && session.role !== "ADMIN")) redirect("/driver/login");
  return <DriverNav user={{ fullName: session.fullName, role: session.role }}>{children}</DriverNav>;
}
