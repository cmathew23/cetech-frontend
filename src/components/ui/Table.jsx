import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   children: import("react").ReactNode;
 *   className?: string;
 *   tableClassName?: string;
 *   minWidth?: string;
 * }} props
 */
export function Table({
  children,
  className = "",
  tableClassName = "",
  minWidth = "",
}) {
  const normalizedMinWidth =
    typeof minWidth === "string" && minWidth.trim() !== "" ? minWidth.trim() : null;

  return (
    <div className={cn(designSystem.table.container, className)}>
      <table
        className={cn(designSystem.table.root, tableClassName)}
        style={normalizedMinWidth ? { minWidth: normalizedMinWidth } : undefined}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = "" }) {
  return <thead className={cn(className)}>{children}</thead>;
}

export function TableBody({ children, className = "" }) {
  return <tbody className={cn(className)}>{children}</tbody>;
}

export function TableRow({
  variant = "body",
  className = "",
  children,
  ...props
}) {
  const v = variant ?? "body";
  const styles = {
    head: designSystem.table.row.head,
    body: designSystem.table.row.body,
  };

  if (!styles[v]) {
    throw new Error(`Invalid TableRow variant: ${variant}`);
  }

  return (
    <tr className={cn(styles[v], className)} {...props}>
      {children}
    </tr>
  );
}

export function Th({ children, className = "", ...props }) {
  return (
    <th className={cn(designSystem.table.cell.head, className)} {...props}>
      {children}
    </th>
  );
}

export function Td({ children, className = "", ...props }) {
  return (
    <td className={cn(designSystem.table.cell.body, className)} {...props}>
      {children}
    </td>
  );
}
