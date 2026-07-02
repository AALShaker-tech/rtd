import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { DriverNav } from "./DriverNav";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.role !== "DRIVER" && !isAdmin(session.role))) redirect("/driver/login");
  return (
    <DriverNav user={{ fullName: session.fullName, role: session.role }}>{children}</DriverNav>
  );
}
