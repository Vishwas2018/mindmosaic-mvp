// DEV ONLY — not linked in any nav or layout
// Visit: /dev/ui-gallery

import { type ReactNode } from "react";
import { Button }     from "@/components/ui/Button";
import { Card }       from "@/components/ui/Card";
import { Badge }      from "@/components/ui/Badge";
import { Skeleton }   from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

if (process.env.NODE_ENV === "production") {
  throw new Error("Dev gallery must not be accessible in production.");
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#1E1B4B", borderBottom: "1px solid #E9E5F5", paddingBottom: "0.5rem" }}>{title}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-start" }}>
        {children}
      </div>
    </section>
  );
}

export default function UIGalleryPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto", fontFamily: "var(--font-dm-sans, system-ui, sans-serif)" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1E1B4B", marginBottom: "0.25rem" }}>UI Component Gallery</h1>
      <p style={{ fontSize: "0.875rem", color: "#7C7399", marginBottom: "3rem" }}>DEV ONLY — not visible in production</p>

      {/* ── Buttons ── */}
      <Section title="Button — variants">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </Section>

      <Section title="Button — sizes">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </Section>

      <Section title="Button — states">
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" loading>Loading secondary</Button>
      </Section>

      {/* ── Cards ── */}
      <Section title="Card — variants">
        <Card style={{ padding: "1.25rem", width: "200px" }}>
          <strong>Default card</strong>
          <p style={{ fontSize: "0.8rem", color: "#7C7399", marginTop: "0.5rem" }}>Shadow + border on white</p>
        </Card>
        <Card variant="hover" style={{ padding: "1.25rem", width: "200px" }}>
          <strong>Hover card</strong>
          <p style={{ fontSize: "0.8rem", color: "#7C7399", marginTop: "0.5rem" }}>Lifts on hover</p>
        </Card>
      </Section>

      {/* ── Badges ── */}
      <Section title="Badge — variants">
        <Badge variant="default">Default</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="purple">Purple</Badge>
      </Section>

      {/* ── Skeletons ── */}
      <Section title="Skeleton — sizes + multi-line">
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Skeleton width={240} height={20} />
          <Skeleton width={160} height={16} rounded="full" />
          <Skeleton width={80} height={80} rounded="lg" />
          <Skeleton width={320} height={16} lines={3} />
        </div>
      </Section>

      {/* ── EmptyState ── */}
      <Section title="EmptyState">
        <Card style={{ width: "100%" }}>
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            }
            heading="No children added yet"
            subtext="Add your first child to see their exam progress and learning plan here."
            action={<Button size="sm">Add child</Button>}
          />
        </Card>
      </Section>

      {/* ── EmptyState without action ── */}
      <Section title="EmptyState — minimal">
        <Card style={{ width: "100%" }}>
          <EmptyState heading="Nothing here yet" subtext="Check back later." />
        </Card>
      </Section>
    </main>
  );
}
