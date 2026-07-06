import { listLoungesAdmin } from "@/server/services/lounge.service";
import { LoungesManager } from "./LoungesManager";

export const dynamic = "force-dynamic";

export default async function LoungesPage() {
  const lounges = await listLoungesAdmin();
  return <LoungesManager lounges={lounges} />;
}
