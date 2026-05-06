import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   children: import("react").ReactNode;
 *   className?: string;
 *   title?: string;
 *   subtitle?: string;
 *   actions?: import("react").ReactNode;
 *   padding?: "compact" | "default" | "spacious";
 *   accent?: boolean;
 * }} props
 */
export function Card({
  children,
  className = "",
  title,
  subtitle,
  actions = null,
  padding = "default",
  accent = true,
}) {
  const paddingClass =
    designSystem.card.padding[padding] ?? designSystem.card.padding.default;
  const showHeader =
    (typeof title === "string" && title.trim() !== "") ||
    (typeof subtitle === "string" && subtitle.trim() !== "") ||
    actions !== null;

  return (
    <div className={cn(designSystem.card.root, paddingClass, className)}>
      {accent ? <div aria-hidden="true" className={designSystem.card.accent} /> : null}
      {showHeader ? (
        <div className={cn(designSystem.card.header.root)}>
          <div className="min-w-0">
            {title ? (
              <h3 className={cn(designSystem.card.header.title)}>{title}</h3>
            ) : null}
            {subtitle ? (
              <p className={cn(designSystem.card.header.subtitle)}>{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
