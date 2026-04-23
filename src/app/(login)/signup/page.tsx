import { AuthFormCard } from "@/features/auth/components/AuthFormCard";
import { redirectIfAuthenticated } from "@/lib/server/session-guards";

import styles from "../login.module.css";

export default async function SignupPage() {
  await redirectIfAuthenticated();

  return (
    <main className={styles.hero}>
      <AuthFormCard
        mode="signup"
        title="Create account"
        submitLabel="Create account"
        alternativeHref="/login"
        alternativeLabel="Already registered? Sign in."
        showPseudo
      />
    </main>
  );
}
