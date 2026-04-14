import { AppStatusPage } from "@/components";

export default function NotFound() {
  return (
    <AppStatusPage
      statusCode="404"
      title="404 Not Found"
      message="The page you requested does not exist or is intentionally hidden."
      primaryActionHref="/"
      primaryActionLabel="Home"
    />
  );
}
