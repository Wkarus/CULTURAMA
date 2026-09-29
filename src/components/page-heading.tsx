import { TextLink } from "@/components/text-link";

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="grid max-w-xl gap-3">
      <h1 className="text-display">{title}</h1>
      {description ? <p className="text-body-lg text-muted-foreground">{description}</p> : null}
      {action ? <TextLink href={action.href}>{action.label}</TextLink> : null}
    </div>
  );
}
