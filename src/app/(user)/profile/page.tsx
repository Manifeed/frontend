"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button, Field, Modal, Notice, PageShell, Surface, TextInput } from "@/components";
import { apiRequest } from "@/services/api/client";
import type {
  AccountProfileUpdateRequest,
  AccountMeRead,
  AccountPasswordUpdateRead,
  AccountProfileUpdateRead,
} from "@/types/account";
import type { AuthenticatedUser } from "@/types/auth";
import { formatSourceDate } from "@/utils/date";

import styles from "./page.module.css";

const PROFILE_PICTURES = Array.from({ length: 8 }, (_, index) => index + 1);

export default function ProfilePage() {
  const router = useRouter();
  const [isRedirecting, startRedirect] = useTransition();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [selectedPpId, setSelectedPpId] = useState(1);
  const [changingAvatar, setChangingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);

      try {
        const payload = await apiRequest<AccountMeRead>("/api/account/me");
        setUser(payload.user);
        setSelectedPpId(payload.user.pp_id);
        setProfileError(null);
      } catch (loadError) {
        setProfileError(loadError instanceof Error ? loadError.message : "Unable to load profile");
      } finally {
        setLoadingProfile(false);
      }
    }

    void loadProfile();
  }, []);

  useEffect(() => {
    if (!isPasswordModalOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setPasswordError(null);
    }
  }, [isPasswordModalOpen]);

  useEffect(() => {
    if (isAvatarModalOpen && user) {
      setSelectedPpId(user.pp_id);
      setAvatarError(null);
      return;
    }

    if (!isAvatarModalOpen) {
      setAvatarError(null);
    }
  }, [isAvatarModalOpen, user]);

  function applyUserUpdate(nextUser: AuthenticatedUser) {
    setUser(nextUser);
    setSelectedPpId(nextUser.pp_id);
    router.refresh();
  }

  async function updateProfile(update: AccountProfileUpdateRequest) {
    const payload = await apiRequest<AccountProfileUpdateRead>("/api/account/me", {
      method: "PATCH",
      body: JSON.stringify(update),
    });
    applyUserUpdate(payload.user);
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangingPassword(true);
    setPasswordError(null);

    try {
      await apiRequest<AccountPasswordUpdateRead>("/api/account/password", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      startRedirect(() => {
        router.replace("/login?passwordChanged=1");
        router.refresh();
      });
    } catch (updateError) {
      setPasswordError(
        updateError instanceof Error ? updateError.message : "Unable to update password",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleAvatarSubmit() {
    if (!user || user.pp_id === selectedPpId) {
      setIsAvatarModalOpen(false);
      return;
    }

    setChangingAvatar(true);
    setAvatarError(null);

    try {
      await updateProfile({ pp_id: selectedPpId });
      setProfileSuccess("Photo de profil mise a jour.");
      setProfileError(null);
      setIsAvatarModalOpen(false);
    } catch (updateError) {
      setAvatarError(
        updateError instanceof Error ? updateError.message : "Impossible de changer la photo de profil",
      );
    } finally {
      setChangingAvatar(false);
    }
  }

  const createdLabel = formatSourceDate(user?.created_at ?? null, "day_month_year");
  const profilePictureId = user?.pp_id ?? selectedPpId;

  return (
    <PageShell>
      <div className={styles.page}>
        {profileError ? <Notice tone="danger">{profileError}</Notice> : null}
        {profileSuccess ? <Notice tone="info">{profileSuccess}</Notice> : null}

        <Surface tone="soft" padding="lg" className={styles.hero}>
          <div className={styles.heroHeader}>
            <div className={styles.heroTitleBlock}>
              <h1 className={styles.heroTitle}>{loadingProfile ? "Loading..." : user?.pseudo ?? "Your account"}</h1>
            </div>

            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => {
                  setProfileSuccess(null);
                  setIsAvatarModalOpen(true);
                }}
                disabled={loadingProfile || !user}
              >
                Change avatar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setProfileSuccess(null);
                  setIsPasswordModalOpen(true);
                }}
                disabled={loadingProfile || !user}
              >
                Change password
              </Button>
            </div>
          </div>

          <div className={styles.identityCard}>
            <div className={styles.avatarBlock}>
              <div className={styles.avatarFrame}>
                <img
                  className={styles.avatarImage}
                  src={`/pp/${profilePictureId}.webp`}
                  alt={user ? `${user.pseudo} avatar` : "Profile avatar"}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            <div className={styles.identityContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <p className={styles.infoLabel}>Email</p>
                  <p className={styles.infoValue}>
                    {loadingProfile ? "Loading..." : user?.email ?? "-"}
                  </p>
                </div>
                <div className={styles.infoCard}>
                  <p className={styles.infoLabel}>Member since</p>
                  <p className={styles.infoValue}>{loadingProfile ? "Loading..." : createdLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </Surface>
      </div>

      <Modal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change password"
        description="Confirm your current password then enter the new one."
        size="sm"
      >
        <form className={styles.modalForm} onSubmit={handlePasswordSubmit}>
          <Field label="Current password" htmlFor="current-password">
            <TextInput
              id="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
              disabled={changingPassword || isRedirecting}
            />
          </Field>

          <Field label="New password" htmlFor="new-password">
            <TextInput
              id="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={changingPassword || isRedirecting}
            />
          </Field>

          {passwordError ? <Notice tone="danger">{passwordError}</Notice> : null}

          <Button type="submit" variant="primary" disabled={changingPassword || isRedirecting}>
            {changingPassword || isRedirecting ? "Updating..." : "Change password"}
          </Button>
        </form>
      </Modal>

      <Modal
        open={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        title="Change avatar"
        description="Choose an avatar from the currently available ones."
        size="md"
        bodyClassName={styles.avatarModalBody}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAvatarModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleAvatarSubmit()}
              disabled={!user || changingAvatar || user.pp_id === selectedPpId}
            >
              {changingAvatar ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <div className={styles.avatarPreview}>
          <div className={styles.avatarPreviewCircle}>
            <img
              src={`/pp/${selectedPpId}.webp`}
              alt={`Avatar ${selectedPpId}`}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className={styles.avatarGrid}>
          {PROFILE_PICTURES.map((ppId) => (
            <Button
              key={ppId}
              variant="secondary"
              active={selectedPpId === ppId}
              className={styles.avatarChoice}
              onClick={() => setSelectedPpId(ppId)}
              disabled={changingAvatar}
              aria-label={`Select avatar ${ppId}`}
            >
              <img
                className={styles.avatarChoiceImage}
                src={`/pp/${ppId}.webp`}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </Button>
          ))}
        </div>

        {avatarError ? <Notice tone="danger">{avatarError}</Notice> : null}
      </Modal>
    </PageShell>
  );
}
