import { AuthFormCard } from "@/features/auth/components/AuthFormCard";
import { redirectIfAuthenticated } from "@/lib/server/session-guards";

import styles from "../login.module.css";

type LoginPageProps = {
  searchParams?: Promise<{ 
    next?: string; 
    registered?: string; 
    passwordChanged?: string;
    description?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();
  const resolvedSearchParams = await searchParams;

  return (
    <main className={styles.hero}>
      <AuthFormCard
        mode="login"
        title="Sign in"
        description={
          resolvedSearchParams?.passwordChanged
            ? "Your password was updated. Sign in again with your new credentials."
            : resolvedSearchParams?.registered
              ? "Your account is ready. Sign in to access your workspace."
              : resolvedSearchParams?.description
        }
        submitLabel="Sign in"
        alternativeHref="/signup"
        alternativeLabel="Need an account? Create one."
        nextPath={resolvedSearchParams?.next ?? null}
      />
    </main>
  );
}
