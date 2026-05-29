"use client";

import { adminPaths } from "@/config/adminNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { dashboardPanelClass } from "@/lib/auth-ui";
import { fetchMyAcademy, patchMyAcademy, type MyAcademyProfile } from "@/lib/api/academyAdmin";
import { isNormalizedApiError } from "@/lib/apiClient";
import { formatHumanReadableOrCopy } from "@/lib/textFormat";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

const LOADING_COPY = "Loading academy profile…";

function formatAdminApiError(e: unknown, fallback: string): string {
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

type DraftFields = {
  name: string;
  address: string;
  phone: string;
  email: string;
};

function profileToDraft(p: MyAcademyProfile): DraftFields {
  return {
    name: p.name,
    address: p.address,
    phone: p.phone,
    email: p.email,
  };
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-textSecondary">{label}</dt>
      <dd className="mt-0.5 break-words text-textPrimary">{value}</dd>
    </div>
  );
}

export default function AdminAboutAcademyPage() {
  const [loadState, setLoadState] = useState<
    "loading" | "error" | "empty" | "ready"
  >("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<MyAcademyProfile | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<DraftFields>({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [baselineDraft, setBaselineDraft] = useState<DraftFields>({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const reloadProfile = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const ctx = await fetchMyAcademy();
      if (ctx === null) {
        setProfile(null);
        setLoadState("empty");
        setSaveSuccess(null);
        setSaveError(null);
        setIsEditing(false);
        return;
      }
      setProfile(ctx);
      const d = profileToDraft(ctx);
      setEditDraft(d);
      setBaselineDraft(d);
      setLoadState("ready");
    } catch (e) {
      setLoadError(formatAdminApiError(e, "Could not load academy profile."));
      setProfile(null);
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void reloadProfile();
  }, [reloadProfile]);

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const name = editDraft.name.trim();
    if (name === "") return;
    setSaveSubmitting(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const updated = await patchMyAcademy({
        name: editDraft.name,
        address: editDraft.address,
        phone: editDraft.phone,
        email: editDraft.email,
      });
      setProfile(updated);
      const d = profileToDraft(updated);
      setEditDraft(d);
      setBaselineDraft(d);
      setIsEditing(false);
      setSaveSuccess("Changes saved.");
    } catch (err) {
      setSaveError(formatAdminApiError(err, "Could not save changes."));
    } finally {
      setSaveSubmitting(false);
    }
  }

  function handleCancelEdit() {
    setEditDraft(baselineDraft);
    setIsEditing(false);
    setSaveError(null);
  }

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
        <PageHeader
          title="About Academy"
          subtitle="View and update your academy profile."
        />
        <Alert variant="danger">{loadError}</Alert>
        <Button type="button" variant="secondary" onClick={() => void reloadProfile()}>
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

  if (loadState === "empty") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4 px-4 py-6">
        <PageHeader
          title="About Academy"
          subtitle="Academy profile data from the server."
        />
        <Alert variant="warning">
          No academy profile was returned for this account. New academy
          administrators must complete{" "}
          <strong className="font-medium text-textPrimary">Academy setup</strong>{" "}
          in onboarding before any academy data appears here. Information on this
          page always comes from the server.
        </Alert>
        <p className="text-sm text-textSecondary">
          <Link
            href="/onboarding"
            className="font-medium text-primary hover:underline"
          >
            Go to onboarding
          </Link>{" "}
          ·{" "}
          <Link
            href={adminPaths.dashboard}
            className="font-medium text-primary hover:underline"
          >
            Dashboard overview
          </Link>
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-textSecondary">
        {LOADING_COPY}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <PageHeader
        title="About Academy"
        subtitle="View and update your academy profile."
        actions={
          !isEditing ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSaveSuccess(null);
                setSaveError(null);
                setEditDraft(baselineDraft);
                setIsEditing(true);
              }}
            >
              Edit
            </Button>
          ) : null
        }
      />

      {saveSuccess ? (
        <Alert variant="success" role="status">
          {saveSuccess}
        </Alert>
      ) : null}

      <Card className={dashboardPanelClass} accent={false}>
        <dl className="grid max-w-2xl gap-4 text-sm sm:grid-cols-1">
          <div>
            <dt className="text-xs font-medium text-textSecondary">Academy ID</dt>
            <dd className="mt-0.5 break-all text-textPrimary">
              {profile.academyId}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-textSecondary">Entity ID</dt>
            <dd className="mt-0.5 break-all text-textPrimary">
              {profile.entityId}
            </dd>
          </div>
        </dl>

        {!isEditing ? (
          <dl className="mt-6 grid max-w-xl gap-4 border-t border-border pt-6 text-sm">
            <ReadOnlyField
              label="Name"
              value={formatHumanReadableOrCopy(profile.name, "—")}
            />
            <ReadOnlyField
              label="Address"
              value={formatHumanReadableOrCopy(profile.address, "—")}
            />
            <ReadOnlyField
              label="Phone"
              value={profile.phone.trim() !== "" ? profile.phone : "—"}
            />
            <ReadOnlyField
              label="Email"
              value={profile.email.trim() !== "" ? profile.email : "—"}
            />
          </dl>
        ) : (
          <form
            className="mt-6 grid max-w-xl gap-4 border-t border-border pt-6"
            onSubmit={(e) => void handleSaveEdit(e)}
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor="edit-academy-name"
                className="text-xs font-medium text-textPrimary"
              >
                Name
              </label>
              <Input
                id="edit-academy-name"
                value={editDraft.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditDraft((d) => ({ ...d, name: e.target.value }))
                }
                disabled={saveSubmitting}
                autoComplete="organization"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="edit-academy-address"
                className="text-xs font-medium text-textPrimary"
              >
                Address
              </label>
              <Input
                id="edit-academy-address"
                value={editDraft.address}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditDraft((d) => ({ ...d, address: e.target.value }))
                }
                disabled={saveSubmitting}
                autoComplete="street-address"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="edit-academy-phone"
                className="text-xs font-medium text-textPrimary"
              >
                Phone
              </label>
              <Input
                id="edit-academy-phone"
                type="tel"
                value={editDraft.phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditDraft((d) => ({ ...d, phone: e.target.value }))
                }
                disabled={saveSubmitting}
                autoComplete="tel"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="edit-academy-email"
                className="text-xs font-medium text-textPrimary"
              >
                Email
              </label>
              <Input
                id="edit-academy-email"
                type="email"
                value={editDraft.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditDraft((d) => ({ ...d, email: e.target.value }))
                }
                disabled={saveSubmitting}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                variant="primary"
                loading={saveSubmitting}
                disabled={saveSubmitting || editDraft.name.trim() === ""}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="neutral"
                disabled={saveSubmitting}
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {saveError ? (
          <Alert variant="danger" className="mt-4">
            {saveError}
          </Alert>
        ) : null}
      </Card>
    </div>
  );
}
