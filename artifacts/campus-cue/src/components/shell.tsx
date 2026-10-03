import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Compass } from "lucide-react";

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  useEffect(() => {
    const title = loc === "/submit" ? "Submit an announcement — CampusCue" : "CampusCue — Discover campus events";
    const description = loc === "/submit"
      ? "Turn a campus email, caption, or chat message into editable event suggestions. Review missing details before publishing to CampusCue."
      : "Discover campus events in one place. Filter by interests and free time, and find your next campus opportunity.";
    document.title = title;
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) document.querySelector(selector)?.setAttribute("content", title);
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) document.querySelector(selector)?.setAttribute("content", description);
  }, [loc]);
  const tab = (href: string, label: string, icon: ReactNode) => (
    <Link href={href} data-testid={`link-nav-${label.toLowerCase()}`}
      className={`flex items-center gap-1.5 rounded-full border-2 border-foreground px-3.5 py-1.5 text-sm font-semibold transition-all ${loc === href ? "bg-foreground text-background" : "bg-card hover:bg-accent"}`}>
      {icon}{label}
    </Link>
  );
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b-2 border-foreground bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground stamp font-extrabold text-lg -rotate-6">C</span>
            <span className="text-xl font-extrabold tracking-tight">CampusCue</span>
          </Link>
          <nav className="flex gap-2">{tab("/", "Discover", <Compass className="h-4 w-4" />)}{tab("/submit", "Submit", <Plus className="h-4 w-4" />)}</nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground font-mono-cue">
        Notre Dame listings researched October 3, 2026. Times are campus-local Eastern time. Check the original listing for changes and RSVP requirements. CampusCue is independent, not affiliated with Notre Dame, and does not automatically sync these sources.
      </footer>
    </div>
  );
}
