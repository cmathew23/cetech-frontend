"use client";

import { adminPaths } from "@/config/adminNav";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { dashboardPanelClass } from "@/lib/auth-ui";
import {
  fetchMyProfile,
  patchMyProfile,
  type PatchProfileMeInput,
  type ProfileMe,
} from "@/lib/api/profile";
import { isNormalizedApiError } from "@/lib/apiClient";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

const LOADING_COPY = "Loading profile…";

function formatProfileError(e: unknown, fallback: string): string {
  if (isNormalizedApiError(e)) {
    if (e.status === 403) {
      const server = e.message.trim();
      if (server !== "") {
        return `Access denied. ${server}`;
      }
      return "Access denied. You don't have permission to perform this action.";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

function editableFromProfile(p: ProfileMe): PatchProfileMeInput {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    phone: p.phone,
    addressLine1: p.addressLine1,
    city: p.city,
    state: p.state,
    country: p.country,
  };
}

export default function AdminProfileSettingsPage() {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<{ userId: string; email: string }>({
    userId: "",
    email: "",
  });
  const [draft, setDraft] = useState<PatchProfileMeInput>({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "",
  });
  const [baseline, setBaseline] = useState<PatchProfileMeInput>({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "",
  });
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      const p = await fetchMyProfile();
      setIdentity({
        userId: p.userId.trim() !== "" ? p.userId : "",
        email: p.email.trim() !== "" ? p.email : "",
      });
      const ed = editableFromProfile(p);
      setDraft(ed);
      setBaseline({ ...ed });
      setLoadState("ready");
    } catch (e) {
      setLoadError(formatProfileError(e, "Could not load profile."));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function handleCancel() {
    setDraft({ ...baseline });
    setSaveError(null);
    setSaveSuccess(null);
  }


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveSubmitting(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const updated = await patchMyProfile(draft);
      setIdentity({
        userId: updated.userId.trim() !== "" ? updated.userId : "",
        email: updated.email.trim() !== "" ? updated.email : "",
      });
      const ed = editableFromProfile(updated);
      setDraft(ed);
      setBaseline({ ...ed });
      setSaveSuccess("Profile updated.");
    } catch (err) {
      setSaveError(
        formatProfileError(err, "Could not save profile."),
      );
    } finally {
      setSaveSubmitting(false);
    }
  }

  const readOnlyDisplay = (value: string) =>
    value.trim() !== "" ? value : "—";

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-textSecondary">
        {LOADING_COPY}
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-6">
        <Heading variant="h2">Profile Settings</Heading>
        <Alert variant="danger">{loadError}</Alert>
        <Button type="button" variant="secondary" onClick={() => void loadProfile()}>
          Try again
        </Button>
        <p className="text-sm text-textSecondary">
          <Link
            href={adminPaths.dashboard}
            className="font-medium text-primary hover:underline"
          >
            Back to dashboard
          </Link>
        </p>
      </div>
    );
  }

  const editableEmpty =
    Object.values(draft).every((v) => v.trim() === "");

  return (
    <div className="w-full min-w-0 max-w-2xl space-y-4">
      <header>
        <Heading variant="h2">Profile Settings</Heading>
        <p className="mt-1 text-sm text-textSecondary">
          Update your personal details. Account identifiers below cannot be changed
          here.
        </p>
      </header>

      {saveSuccess ? (
        <Alert variant="success" role="status">
          {saveSuccess}
        </Alert>
      ) : null}

      <Card className={dashboardPanelClass}>
        <h3 className="text-base font-semibold text-textPrimary">Account</h3>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-textSecondary">User ID</dt>
            <dd className="mt-0.5 break-all font-mono text-textPrimary">
              {readOnlyDisplay(identity.userId)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-textSecondary">Email</dt>
            <dd className="mt-0.5 break-all text-textPrimary">
              {readOnlyDisplay(identity.email)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className={dashboardPanelClass}>
        <h3 className="text-base font-semibold text-textPrimary">Your details</h3>
        {editableEmpty ? (
          <p className="mt-2 text-xs text-textMuted">
            No profile fields are set yet. Add any details you want stored on your
            account.
          </p>
        ) : null}
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <div className="flex flex-col gap-1 sm:col-span-1">
            <label
              htmlFor="profile-first-name"
              className="text-xs font-medium text-textPrimary"
            >
              First name
            </label>
            <Input
              id="profile-first-name"
              value={draft.firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDraft((d) => ({ ...d, firstName: e.target.value }))
              }
              disabled={saveSubmitting}
              autoComplete="given-name"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-1">
            <label
              htmlFor="profile-last-name"
              className="text-xs font-medium text-textPrimary"
            >
              Last name
            </label>
            <Input
              id="profile-last-name"
              value={draft.lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDraft((d) => ({ ...d, lastName: e.target.value }))
              }
              disabled={saveSubmitting}
              autoComplete="family-name"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label
              htmlFor="profile-phone"
              className="text-xs font-medium text-textPrimary"
            >
              Phone
            </label>
            <Input
              id="profile-phone"
              type="tel"
              value={draft.phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDraft((d) => ({ ...d, phone: e.target.value }))
              }
              disabled={saveSubmitting}
              autoComplete="tel"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label
              htmlFor="profile-address1"
              className="text-xs font-medium text-textPrimary"
            >
              Address line 1
            </label>
            <Input
              id="profile-address1"
              value={draft.addressLine1}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDraft((d) => ({ ...d, addressLine1: e.target.value }))
              }
              disabled={saveSubmitting}
              autoComplete="address-line1"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-1">
            <label
              htmlFor="profile-city"
              className="text-xs font-medium text-textPrimary"
            >
              City
            </label>
            <Input
              id="profile-city"
              value={draft.city}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDraft((d) => ({ ...d, city: e.target.value }))
              }
              disabled={saveSubmitting}
              autoComplete="address-level2"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-1">
            <label
              htmlFor="profile-state"
              className="text-xs font-medium text-textPrimary"
            >
              State
            </label>
            <Input
              id="profile-state"
              value={draft.state}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDraft((d) => ({ ...d, state: e.target.value }))
              }
              disabled={saveSubmitting}
              autoComplete="address-level1"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label
              htmlFor="profile-country"
              className="text-xs font-medium text-textPrimary"
            >
              Country
            </label>
            <Input
              id="profile-country"
              value={draft.country}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDraft((d) => ({ ...d, country: e.target.value }))
              }
              disabled={saveSubmitting}
              autoComplete="country-name"
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              type="submit"
              variant="primary"
              loading={saveSubmitting}
              disabled={saveSubmitting}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="neutral"
              disabled={saveSubmitting}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
        {saveError ? (
          <Alert variant="danger" className="mt-4">
            {saveError}
          </Alert>
        ) : null}
      </Card>
    </div>
  );
}
