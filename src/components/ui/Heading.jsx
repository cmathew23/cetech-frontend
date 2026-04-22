import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";

const VARIANT_TO_TOKEN = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
};

export function Heading({
  variant = "h2",
  className = "",
  children,
  ...props
}) {
  const v = variant ?? "h2";
  const tokenKey = VARIANT_TO_TOKEN[v];
  if (!tokenKey) {
    throw new Error(`Invalid Heading variant: ${variant}`);
  }
  const Tag = v;
  const typoClass = designSystem.typography[tokenKey];
  return (
    <Tag className={cn(typoClass, className)} {...props}>
      {children}
    </Tag>
  );
}
