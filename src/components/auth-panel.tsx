import type { ReactNode } from "react";
import Link from "next/link";

export function AuthPanel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto grid max-w-page items-end gap-8 px-4 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:py-20">
      <div className="grid gap-3">
        <h1 className="text-display">{title}</h1>
        <p className="max-w-[40ch] text-body-lg text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-card bg-card p-6 shadow-card">
        {children}
        {footer ? <div className="mt-6 text-caption text-muted-foreground">{footer}</div> : null}
      </div>
    </main>
  );
}

export function AuthFooterLink({ href, prompt, label }: { href: string; prompt: string; label: string }) {
  return (
    <p>
      {prompt}{" "}
      <Link href={href} className="link-quiet text-caption">
        {label}
      </Link>
    </p>
  );
}
