import { headers } from "next/headers";
import { App } from "@/components/dashboard/AI-avatar/app";
import { getAppConfig } from "@/lib/utils";

export default async function AgingFriendlyAvatarPage() {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);

  return (
    <div className="">
      <App appConfig={appConfig} />
    </div>
  );
}
