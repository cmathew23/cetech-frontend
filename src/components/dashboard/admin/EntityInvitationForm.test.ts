import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  EntityInvitationForm,
  INITIAL_INVITE_ROLE,
  readInvitationSubmit,
} from "@/components/dashboard/admin/AcademyAdminWorkspacePage";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

type ElementProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  htmlFor?: string;
  id?: string;
  onChange?: (event: { target: { value: string } }) => void;
  onSubmit?: (event: { preventDefault: () => void }) => void;
  value?: string;
  required?: boolean;
};

function visit(
  node: ReactNode,
  match: (element: ReactElement<ElementProps>) => boolean,
): ReactElement<ElementProps> | null {
  if (!isValidElement<ElementProps>(node)) return null;
  if (match(node)) return node;
  let found: ReactElement<ElementProps> | null = null;
  Children.forEach(node.props.children, (child) => {
    if (found) return;
    found = visit(child, match);
  });
  return found;
}

function renderForm(overrides?: Partial<Parameters<typeof EntityInvitationForm>[0]>) {
  return EntityInvitationForm({
    email: "",
    role: INITIAL_INVITE_ROLE,
    submitting: false,
    onEmailChange: () => {},
    onRoleChange: () => {},
    onSubmit: () => {},
    ...overrides,
  });
}

function sendInviteButton(tree: ReactNode) {
  const button = visit(
    tree,
    (element) =>
      element.type === Button && element.props.children === "Send invite",
  );
  if (!button) throw new Error("Send invite button was not rendered");
  return button;
}

function roleLabel(tree: ReactNode) {
  const label = visit(
    tree,
    (element) => element.type === "label" && element.props.htmlFor === "invite-role",
  );
  if (!label) throw new Error("Role label was not rendered");
  return label;
}

function roleSelect(tree: ReactNode) {
  const select = visit(
    tree,
    (element) => element.type === Select && element.props.id === "invite-role",
  );
  if (!select) throw new Error("Role select was not rendered");
  return select;
}

function formElement(tree: ReactNode) {
  const form = visit(tree, (element) => element.type === "form");
  if (!form) throw new Error("Invitation form was not rendered");
  return form;
}

describe("EntityInvitationForm", () => {
  it("shows a red required asterisk on the Role label", () => {
    const label = roleLabel(renderForm());
    const mark = visit(
      label,
      (element) => element.type === "span" && element.props.children === "*",
    );

    expect(mark).not.toBeNull();
    expect(mark?.props.className).toBe("text-danger");
    expect(JSON.stringify(label.props.children)).toContain("Role");
  });

  it("disables Send invite on initial load", () => {
    expect(INITIAL_INVITE_ROLE).toBe("");
    expect(sendInviteButton(renderForm()).props.disabled).toBe(true);
  });

  it("keeps Send invite disabled when no role is selected", () => {
    const button = sendInviteButton(
      renderForm({ email: "user@example.com", role: "" }),
    );
    expect(button.props.disabled).toBe(true);
    expect(readInvitationSubmit("user@example.com", "")).toBeNull();
  });

  it("enables Send invite after a role is selected when email is present", () => {
    let role = "";
    const onRoleChange = (value: string) => {
      role = value;
    };
    const initial = renderForm({
      email: "user@example.com",
      role,
      onRoleChange,
    });

    expect(sendInviteButton(initial).props.disabled).toBe(true);

    roleSelect(initial).props.onChange?.({ target: { value: "ATHLETE" } });

    const selected = renderForm({
      email: "user@example.com",
      role,
      onRoleChange,
    });
    expect(role).toBe("ATHLETE");
    expect(sendInviteButton(selected).props.disabled).toBe(false);
    expect(readInvitationSubmit("user@example.com", "COACH")).toEqual({
      email: "user@example.com",
      role: "COACH",
    });
  });

  it("keeps Send invite disabled when email is empty even if a role is selected", () => {
    expect(
      sendInviteButton(renderForm({ email: "   ", role: "COACH" })).props.disabled,
    ).toBe(true);
    expect(readInvitationSubmit("   ", "COACH")).toBeNull();
  });

  it("does not submit when no role is selected", () => {
    const onSubmit = vi.fn();
    const form = formElement(
      renderForm({ email: "user@example.com", role: "", onSubmit }),
    );
    const preventDefault = vi.fn();

    form.props.onSubmit?.({ preventDefault });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(readInvitationSubmit("user@example.com", "")).toBeNull();
  });

  it("submits when email and role are both present", () => {
    const onSubmit = vi.fn();
    const form = formElement(
      renderForm({ email: "user@example.com", role: "COACH", onSubmit }),
    );

    form.props.onSubmit?.({ preventDefault: vi.fn() });

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("blocks invitation creation in the page handler when role is missing", () => {
    const source = readFileSync(
      new URL("./AcademyAdminWorkspacePage.tsx", import.meta.url),
      "utf8",
    );
    const handlerStart = source.indexOf("async function handleCreateInvitation");
    const handlerEnd = source.indexOf("async function handleCreateAssignment");
    const handler = source.slice(handlerStart, handlerEnd);
    const guard = handler.indexOf("readInvitationSubmit");
    const request = handler.indexOf("createEntityInvitation");

    expect(guard).toBeGreaterThan(-1);
    expect(request).toBeGreaterThan(guard);
    expect(handler).toContain("if (!submit) return;");
  });
});
