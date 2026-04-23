import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/server/backend";

import LandingPage from "./LandingPage";

export default async function Page() {
  const session = await getOptionalSession();

  if (session)
    redirect("/sources");

  return <LandingPage />;
}
