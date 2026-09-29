"use client";

import type { ReactNode } from "react";
import { Link000 } from "@/components/ui/skiper-ui/skiper40";
import { cn } from "@/lib/utils";

export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link000 href={href} className={cn("link-quiet text-caption", className)}>
      {children}
    </Link000>
  );
}
