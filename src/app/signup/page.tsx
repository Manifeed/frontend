import { AuthFormCard } from "@/features/user/components/AuthFormCard";
import { redirectIfAuthenticated } from "@/lib/server/session-guards";

import styles from "../landing.module.css";

export default async function SignupPage() {
  await redirectIfAuthenticated();

  return (
    <main className={styles.hero}>
      <AuthFormCard
        title="Create account"
        description="Public signup creates a standard user account. API access stays disabled until an admin enables it."
        submitLabel="Create account"
        mode="signup"
        alternativeHref="/login"
        alternativeLabel="Already registered? Sign in."
        showPseudo
      />
    </main>
  );
}
