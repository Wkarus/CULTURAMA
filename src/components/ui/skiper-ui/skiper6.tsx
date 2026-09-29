"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";
import { visual } from "@/lib/visual-tokens";

export type HoverMemberItem = {
  name: string;
  image: string;
  href?: string;
};

type HoverMemberProps = {
  teamMembers: HoverMemberItem[];
  defaultName?: string;
  className?: string;
  backgroundColor?: string;
  textColor?: string;
  hoverTextColor?: string;
  cursorColor?: string;
};

export function HoverMember({
  teamMembers,
  defaultName = "Eventos em destaque",
  className,
  backgroundColor = visual.surfaceDark,
  textColor = visual.mutedOnDark,
  hoverTextColor = visual.accentHoverText,
  cursorColor,
}: HoverMemberProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const x = useSpring(mouseX, { stiffness: 140, damping: 22, mass: 0.45 });
  const y = useSpring(mouseY, { stiffness: 140, damping: 22, mass: 0.45 });
  const member = active !== null ? teamMembers[active] : null;
  const cursorBackground = cursorColor ?? `linear-gradient(135deg, ${visual.accentFrom}, ${visual.accentTo})`;

  if (reduce) {
    return (
      <section className={cn("px-4 py-20", className)} style={{ backgroundColor }}>
        <p className="mx-auto max-w-page font-display text-2xl font-semibold" style={{ color: hoverTextColor }}>
          {defaultName}
        </p>
        <ul className="mx-auto mt-10 grid max-w-page gap-4">
          {teamMembers.map((item) => (
            <li key={item.name}>
              <MemberLabel item={item} color={textColor} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      className={cn("relative overflow-hidden px-4 py-20 md:py-28", className)}
      style={{ backgroundColor }}
      onMouseMove={(event) => {
        mouseX.set(event.clientX);
        mouseY.set(event.clientY);
      }}
    >
      <p className="mx-auto max-w-page text-caption" style={{ color: textColor }}>
        {defaultName}
      </p>
      <ul
        className="relative z-10 mx-auto mt-10 grid max-w-page gap-2"
        onMouseLeave={() => setActive(null)}
      >
        {teamMembers.map((item, index) => {
          const color = active === index ? hoverTextColor : textColor;
          return (
            <li key={`${item.name}-${index}`}>
              <div
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
              >
                <MemberLabel item={item} color={color} large />
              </div>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {member ? (
          <motion.div
            key={member.image}
            className="pointer-events-none fixed z-30 hidden size-44 overflow-hidden rounded-card shadow-card md:block"
            style={{
              left: x,
              top: y,
              translateX: "-50%",
              translateY: "-50%",
              backgroundImage: cursorBackground,
              padding: 2,
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={member.image} alt="" className="size-full rounded-[18px] object-cover" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function MemberLabel({
  item,
  color,
  large = false,
}: {
  item: HoverMemberItem;
  color: string;
  large?: boolean;
}) {
  const className = cn(
    "block font-display font-semibold transition-colors duration-300",
    large ? "text-3xl md:text-5xl" : "text-2xl",
  );
  if (item.href) {
    return (
      <Link href={item.href} className={className} style={{ color }}>
        {item.name}
      </Link>
    );
  }
  return (
    <p className={className} style={{ color }}>
      {item.name}
    </p>
  );
}

export default HoverMember;
