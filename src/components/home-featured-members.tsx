"use client";

import { HoverMember } from "@/components/ui/skiper-ui/skiper6";
import { visual } from "@/lib/visual-tokens";

export function HomeFeaturedMembers({
  events,
}: {
  events: { name: string; image: string; href: string }[];
}) {
  if (events.length === 0) return null;

  return (
    <HoverMember
      teamMembers={events}
      defaultName="Eventos em destaque"
      backgroundColor={visual.surfaceDark}
      textColor={visual.mutedOnDark}
      hoverTextColor={visual.accentHoverText}
      cursorColor={`linear-gradient(135deg, ${visual.accentFrom}, ${visual.accentTo})`}
    />
  );
}
