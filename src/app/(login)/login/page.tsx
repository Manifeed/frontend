import { AuthFormCard } from "@/features/auth/components/AuthFormCard";
import { redirectIfAuthenticated } from "@/lib/server/session-guards";

import styles from "../login.module.css";

type LoginPageProps = {
  searchParams?: { 
    next?: string; 
    registered?: string; 
    passwordChanged?: string;
    description?: string;
  };
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
              : searchParams?.description
        }
        submitLabel="Sign in"
        alternativeHref="/signup"
        alternativeLabel="Need an account? Create one."
        nextPath={searchParams?.next ?? null}
      />
    </main>
  );
}
