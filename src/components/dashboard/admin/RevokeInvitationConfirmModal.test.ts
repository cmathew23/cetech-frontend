import { Button } from "@/components/ui/Button";
import { RevokeInvitationConfirmModal } from "@/components/dashboard/admin/RevokeInvitationConfirmModal";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

type ElementProps = {
  children?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

function findButton(root: ReactNode, label: string): ReactElement<ElementProps> {
  let found: ReactElement<ElementProps> | null = null;

  function visit(node: ReactNode) {
    if (!isValidElement<ElementProps>(node) || found) return;
    if (node.type === Button && node.props.children === label) {
      found = node;
      return;
    }
    Children.forEach(node.props.children, visit);
  }

  visit(root);
  if (!found) throw new Error(`Button "${label}" was not rendered`);
  return found;
}

describe("RevokeInvitationConfirmModal", () => {
  it("renders only when open with the required copy", () => {
    const closed = RevokeInvitationConfirmModal({
      open: false,
      submitting: false,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    });
    const open = RevokeInvitationConfirmModal({
      open: true,
      submitting: false,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
    });

    expect(closed).toBeNull();
    expect(JSON.stringify(open)).toContain("Revoke invitation");
    expect(JSON.stringify(open)).toContain(
      "Revoke this invitation? The invitee will no longer be able to accept it.",
    );
  });

  it("closes without confirming when Cancel is clicked", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const modal = RevokeInvitationConfirmModal({
      open: true,
      submitting: false,
      onClose,
      onConfirm,
    });

    findButton(modal, "Cancel").props.onClick?.();

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms once when Revoke is clicked", () => {
    const onConfirm = vi.fn();
    const modal = RevokeInvitationConfirmModal({
      open: true,
      submitting: false,
      onClose: vi.fn(),
      onConfirm,
    });

    findButton(modal, "Revoke").props.onClick?.();

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("blocks duplicate confirmation while submitting", () => {
    const onConfirm = vi.fn();
    const modal = RevokeInvitationConfirmModal({
      open: true,
      submitting: true,
      onClose: vi.fn(),
      onConfirm,
    });
    const revokeButton = findButton(modal, "Revoke");

    expect(revokeButton.props.disabled).toBe(true);
    revokeButton.props.onClick?.();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not use native browser confirmation in the invitations page", () => {
    const source = readFileSync(
      new URL("./AcademyAdminWorkspacePage.tsx", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("window.confirm");
  });
});
