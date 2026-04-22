"use client";

import { designSystem } from "@/config/design-system";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * @param {{ items?: Array<{ href: string; label: string }> }} props
 */
export function Sidebar({ items = [] }) {
  const pathname = usePathname();
  const { root, nav, link, linkActive } = designSystem.layout.sidebar;

  return (
    <aside className={cn(root)}>
      <nav className={cn(nav)} aria-label="Sidebar">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(link, active && linkActive)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
