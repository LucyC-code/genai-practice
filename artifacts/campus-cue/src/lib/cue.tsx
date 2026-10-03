import { Mail, Globe, Users, Megaphone, MessageCircle } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import type { EventCategory, EventSource } from "@workspace/api-client-react";

export const CATEGORIES: EventCategory[] = ["Academic", "Career", "Networking", "Social", "Arts & Culture", "Wellness", "Community"];
export const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"] as const;
export function audienceLabel(years: readonly string[] | undefined) {
  if (!years?.length) return "Year not specified";
  if (years.includes("All years")) return "All years";
  if (years.length === 4 && CLASS_YEARS.slice(0, 4).every(y => years.includes(y))) return "Undergraduates";
  return years.join(", ");
}
export const SOURCES: EventSource[] = ["Email", "Instagram", "GroupMe", "Campus website", "Student organization", "Other"];
export const CAT_COLOR: Record<string, string> = {
  Academic: "#2f6f8f", Career: "#e8572a", Networking: "#256c62", Social: "#d94f8a", "Arts & Culture": "#7a4fc4", Wellness: "#2e8b6a", Community: "#e0a416",
};
export function SourceIcon({ source, className = "h-3.5 w-3.5" }: { source: string; className?: string }) {
  if (source === "Instagram") return <SiInstagram className={className} />;
  if (source === "Email") return <Mail className={className} />;
  if (source === "GroupMe") return <MessageCircle className={className} />;
  if (source === "Campus website") return <Globe className={className} />;
  if (source === "Student organization") return <Users className={className} />;
  return <Megaphone className={className} />;
}
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export function dateParts(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  return { mon: MONTHS[m - 1], day, dow: DAYS[new Date(y, m - 1, day).getDay()] };
}
export function fmtTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
export function timeRange(s: string | null, e: string | null) {
  if (s && e) return `${fmtTime(s)} - ${fmtTime(e)}`;
  if (s) return `Starts ${fmtTime(s)}`;
  if (e) return `Ends ${fmtTime(e)}`;
  return null;
}
export function Unconfirmed({ label = "Unconfirmed" }: { label?: string }) {
  return <span className="italic text-muted-foreground border-b border-dashed border-muted-foreground/60">{label}</span>;
}
export function EventArt({ seed, category, className = "" }: { seed: number; category: string; className?: string }) {
  const c = CAT_COLOR[category] ?? "#e8572a";
  const k = seed % 4;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <rect width="120" height="120" fill={c} />
      {k === 0 && <><circle cx="40" cy="80" r="42" fill="#fff5d6" opacity=".9" /><circle cx="86" cy="36" r="22" fill="#14262e" /></>}
      {k === 1 && <><path d="M0 120 L60 10 L120 120Z" fill="#fff5d6" opacity=".9" /><rect x="70" y="14" width="30" height="30" fill="#14262e" /></>}
      {k === 2 && <>{[0,1,2,3,4].map(i => <rect key={i} x={-10 + i * 28} y="0" width="14" height="120" fill={i % 2 ? "#14262e" : "#fff5d6"} transform="skewX(-14)" opacity=".92" />)}</>}
      {k === 3 && <><rect x="14" y="14" width="64" height="64" rx="32" fill="#14262e" /><rect x="46" y="46" width="64" height="64" fill="#fff5d6" opacity=".92" /></>}
    </svg>
  );
}
