import { AuthFormCard } from "@/features/user/components/AuthFormCard";
import { redirectIfAuthenticated } from "@/lib/server/session-guards";

import styles from "../landing.module.css";

type LoginPageProps = {
  searchParams?: { next?: string; registered?: string; passwordChanged?: string };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  return (
    <main className={styles.hero}>
      <AuthFormCard
        mode="login"
        title="Sign in"
        description={
          searchParams?.passwordChanged
            ? "Your password was updated. Sign in again with your new credentials."
            : searchParams?.registered
              ? "Your account is ready. Sign in to access your workspace."
              : "Use your Manifeed credentials to access your workspace or the admin console."
        }
        submitLabel="Sign in"
        alternativeHref="/signup"
        alternativeLabel="Need an account? Create one."
        nextPath={searchParams?.next ?? null}
      />
    </main>
  );
}
