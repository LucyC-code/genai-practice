"""Build a reviewed, one-time public-source snapshot; never run as a live sync."""
import collections
import datetime as dt
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.request
import unicodedata
from zoneinfo import ZoneInfo

TODAY = "2026-10-03"
END = "2026-12-09"
TZ = ZoneInfo("America/Indiana/Indianapolis")
MASS_URL = "https://campusministry.nd.edu/pray/mass-schedule/campus-mass-schedule/"
TERM_URL = "https://catalog.nd.edu/undergraduate/general-information/academiccalendar/"
EXCLUSIONS = [("2026-10-17", "2026-10-25"), ("2026-11-25", "2026-11-29")]
SCHEDULE_TAG = "Published weekly schedule"
records, skipped = [], []
existing = json.loads(Path("/tmp/nd-existing-events.json").read_text())
seen = set()


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, value):
        self.parts.append(value)


def plain(value):
    parser = Text()
    parser.feed(value or "")
    return re.sub(r"\s+", " ", html.unescape(" ".join(parser.parts))).strip()


def norm(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    value = re.sub(r"^(film|screening|lecture|workshop)\s*[:—–-]\s*", "", value.lower())
    value = re.sub(r"\(\d{4}\)", "", value)
    return re.sub(r"[^a-z0-9]", "", value)


def identity(event):
    # Different room reservations for the same conference are not extra events.
    return (norm(event["title"]), event["eventDate"], event["startTime"])


for event in existing:
    seen.add(identity(event))


def add(event, evidence):
    if not event.get("eventDate") or event["eventDate"] < TODAY:
        return
    if identity(event) in seen:
        skipped.append({"title": event["title"], "reason": "Duplicate title/date/start across sources", "sourceUrl": event["sourceUrl"]})
        return
    if len(event["summary"]) > 2000:
        # Keep both the introduction and footer (where RSVP/access rules usually live).
        original = event["summary"]
        event["summary"] = (original[:1100] + " […] " + original[-650:] +
                            " This is an excerpt of a longer announcement. Consult the original listing for full program, registration, and attendance requirements.")
        event["classYears"] = []  # Do not infer broad eligibility from an abbreviated announcement.
    if not event.get("location"):
        skipped.append({"title": event["title"], "reason": "No verified campus venue", "sourceUrl": event["sourceUrl"]})
        return
    if offcampus.search(event["location"]) or event["location"].strip() in ("105", "Location Varies", "PowerHaus Studio"):
        skipped.append({"title": event["title"], "reason": "Off-campus or insufficiently identified venue", "sourceUrl": event["sourceUrl"]})
        return
    for prior in existing + records:
        if prior["eventDate"] != event["eventDate"] or prior["startTime"] != event["startTime"]:
            continue
        if prior.get("sourceUrl") == event["sourceUrl"] and SCHEDULE_TAG not in event["tags"]:
            skipped.append({"title": event["title"], "reason": "Same source occurrence", "sourceUrl": event["sourceUrl"]})
            return
        # Prevent retitled versions of the same screening/service/auditorium event.
        location = event["location"]
        if event["startTime"] is not None and re.search(r"browning cinema|basilica|auditorium", location, re.I) and norm(prior.get("location") or "") == norm(location):
            skipped.append({"title": event["title"], "reason": "Same dated event in the same specific venue", "sourceUrl": event["sourceUrl"]})
            return
    seen.add(identity(event))
    records.append(event)
    evidence["recordCount"] += 1


def category(title, description, default):
    text = title.lower()
    if re.search(r"mass\b|vespers|adoration|rosary|bible|worship|faith.*justice|blessing of|feast day", text):
        return "Faith & Spirituality"
    if re.search(r"sustainab|climate|solar revolution|green tour|energy system|recycl|shred event", text):
        return "Sustainability"
    if re.search(r"film|cinema|screening|chronovisor|met.*live in hd", text):
        return "Film"
    if re.search(r"gaming|board game|mahjong|magic.*gathering|smash bros|dungeons|video game", text):
        return "Gaming"
    if re.search(r"volunteer|service project|community re.entry|habitat for humanity|big brothers|baldwin|economic policy institute|immigrant connection|freedom network usa|food recovery", text):
        return "Service & Volunteering"
    if re.search(r"pizza.*politics|model united nations|ndmunc|political|midterms|election|national league of cities", text):
        return "Politics"
    if re.search(r"mccloskey|start.?up|entrepreneur|venture", text):
        return "Entrepreneurship"
    if re.search(r"hall presidents council|student senate|student government", text):
        return "Student Government"
    if re.search(r"networking|mixer|mentorship", text):
        return "Networking"
    if re.search(r"career|resume|résumé|internship|job |recruit|interview", text):
        return "Career"
    if re.search(r"hike|outdoor|nature walk|birding", text):
        return "Outdoors"
    if re.search(r"cooking|cookbook|tasting|taco|culinary|dinner|lunch", text):
        return "Food"
    if re.search(r"workshop|masterclass|hands.on|introduction to|beginners|coding|spreadsheets|openrefine|endnote|arcgis|data paper|sonification|making maps|wrangling data", text):
        return "Workshops"
    if re.search(r"physics|astrophysics|particle|mathemat|yamabe|science|engineering|chemistry|biology|machine learning|artificial intelligence|research fair", text):
        return "Science & Technology"
    if re.search(r"mental health|well.?being|yoga|meditation|fitness|wellness|dance class", text):
        return "Wellness"
    if re.search(r"performance|concert|music|dance|art |exhibit|theatre|theater|museum|rehearsal|choir|musical", text):
        return "Arts & Culture"
    if re.search(r"social|party|dance night|celebration|festival|game night", text):
        return "Social"
    return default


def audience(text):
    # Presenters, organizers, club names, and public visibility are not eligibility.
    if re.search(r"open to the public|all (?:are|students are) welcome|everyone is welcome|open to all (?:nd |notre dame )?students", text, re.I):
        return ["All years"]
    return []


def unescape_ics(value):
    return re.sub(r"\\([nN,;\\])", lambda m: "\n" if m[1].lower() == "n" else m[1], value)


def campus_datetime(value, params=""):
    if len(value) == 8:
        return value[:4] + "-" + value[4:6] + "-" + value[6:8], None
    parsed = dt.datetime.strptime(value, "%Y%m%dT%H%M%SZ" if value.endswith("Z") else "%Y%m%dT%H%M%S")
    zone = re.search(r"TZID=([^;]+)", params)
    parsed = parsed.replace(tzinfo=dt.timezone.utc if value.endswith("Z") else ZoneInfo(zone[1]) if zone else TZ).astimezone(TZ)
    return parsed.strftime("%Y-%m-%d"), parsed.strftime("%H:%M")


evidence_sources = []
manifest = json.loads(Path("/tmp/nd-more-feeds/manifest.json").read_text())
feeds = [{"url": "https://events.nd.edu/events.ics", "path": "/tmp/nd-university.ics", "default": "Academic"}]
hosts = {0: "College of Science", 1: "Campus Sustainability", 2: "Notre Dame Research", 4: "Department of Mathematics",
         5: "Department of Physics and Astronomy", 11: "Notre Dame Law School", 13: "Just Transformations to Sustainability"}
for source in manifest:
    if source.get("calendar") and source["index"] in hosts:
        index = source["index"]
        feeds.append({"url": source["url"], "path": f"/tmp/nd-more-feeds/{index}.ics", "host": hosts[index],
                      "default": "Science & Technology" if index in (0, 4, 5) else "Sustainability" if index in (1, 13) else "Academic"})
offcampus = re.compile(r"zoom|virtual|online|webinar|downtown|south.? bend|mishawaka|irvine|california|london|chicago|washington,|d\.c\.|tower hill|century center|leighton auditorium|purdue university|newman university church|unity gardens|lydick bog|st\. patrick", re.I)
administrative = re.compile(r"midterm break|mid.term break|final examinations|registration appointments|grades.*due|thanksgiving holiday|reading days|last class day|offices.*closed", re.I)
for source in feeds:
    evidence = {"url": source["url"], "kind": "Public dated iCalendar entries", "recordCount": 0}
    evidence_sources.append(evidence)
    unfolded = re.sub(r"\r?\n[ \t]", "", Path(source["path"]).read_text())
    for block in unfolded.split("BEGIN:VEVENT")[1:]:
        fields = {}
        for line in block.split("END:VEVENT")[0].splitlines():
            if ":" in line:
                head, value = line.split(":", 1)
                fields[head.split(";")[0]] = (value, head)
        def field(name):
            return unescape_ics(fields.get(name, ("", ""))[0])
        if not field("DTSTART") or field("STATUS").lower() == "cancelled":
            continue
        date, start = campus_datetime(field("DTSTART"), fields["DTSTART"][1])
        if date < TODAY:
            continue
        title, location, description = plain(field("SUMMARY")), plain(field("LOCATION")), plain(field("DESCRIPTION"))
        url = field("URL")
        if not url.startswith("https://") or administrative.search(title) or offcampus.search(location):
            skipped.append({"title": title, "reason": "Cancelled, administrative, online, or off-campus listing", "sourceUrl": url})
            continue
        end_date, end = campus_datetime(field("DTEND"), fields.get("DTEND", ("", ""))[1]) if field("DTEND") else (date, None)
        tags = []
        if start == "00:00" and end_date > date:
            start, end = None, None
        if end_date not in (date, (dt.date.fromisoformat(date) + dt.timedelta(days=1)).isoformat()):
            end = None
            description += f" This source lists a multi-day event ending {end_date}; this card marks its published start date."
        if "exhibit" in title.lower() or "ongoing" in field("CATEGORIES").lower():
            tags.append("Ongoing exhibition" if "exhibit" in title.lower() else "Ongoing series")
        if not start:
            description += " The source supplies a calendar date rather than confirmed visitor/start hours; check the original listing."
        cat = category(title, description, source["default"])
        tags += [cat]
        if re.search(r"seminar|lecture|colloquium", title, re.I):
            tags.append("Lecture / seminar")
        if cat == "Workshops":
            tags.append("Registration may be required")
        add(dict(title=title, summary=(description or "A publicly listed Notre Dame campus event. Check the original listing for participation details."),
                 eventDate=date, startTime=start, endTime=end, location=location or None,
                 hostOrganization=source.get("host"), category=cat, tags=tags[:6], classYears=audience(description),
                 source="Campus website", sourceUrl=url), evidence)

# Structured library events carry actual start/end timestamps, unlike RSS publication dates.
evidence = {"url": "https://www.library.nd.edu/events", "kind": "Public schema.org Event records", "recordCount": 0}
evidence_sources.append(evidence)
for event in json.loads(Path("/tmp/nd-library-events.json").read_text()):
    if event.get("eventStatus", "").endswith("EventCancelled"):
        continue
    date, start = campus_datetime(dt.datetime.fromisoformat(event["startDate"].replace("Z", "+00:00")).strftime("%Y%m%dT%H%M%SZ"))
    location = event.get("location", {}).get("name", "")
    if offcampus.search(location):
        continue
    end_date, end = campus_datetime(dt.datetime.fromisoformat(event["endDate"].replace("Z", "+00:00")).strftime("%Y%m%dT%H%M%SZ")) if event.get("endDate") else (date, None)
    if end_date != date:
        end = None
    title, summary = plain(event["name"]), plain(event.get("description", ""))
    cat = category(title, summary, "Workshops")
    add(dict(title=title, summary=summary + " Check the original library listing for registration and intended audience.",
             eventDate=date, startTime=start, endTime=end, location=location,
             hostOrganization="Hesburgh Libraries", category=cat, tags=[cat, "Library event"], classYears=audience(summary),
             source="Campus website", sourceUrl=event["url"]), evidence)

# Include remaining genuinely dated campus club announcements, preserving closed-group restrictions.
evidence = {"url": "https://nd.campuslabs.com/engage/events.rss", "kind": "Public NDCentral dated announcements", "recordCount": 0}
evidence_sources.append(evidence)
known_urls = {e.get("sourceUrl") for e in existing}
for event in json.loads(Path("/tmp/nd-rss-parsed.json").read_text()):
    if event["url"] in known_urls or event.get("status", "").lower() == "cancelled":
        continue
    start_dt = dt.datetime.fromisoformat(re.sub(r"(\.\d{6})\d+", r"\1", event["start"])).astimezone(TZ)
    end_dt = dt.datetime.fromisoformat(re.sub(r"(\.\d{6})\d+", r"\1", event["end"])).astimezone(TZ) if event.get("end") else None
    title, summary, location = event["title"].strip(), plain(event["description"]), event["location"]
    if offcampus.search(location) or re.search(r"\bf\.?a\.?s\.?t\.?\b|faculty.staff training|set.?up|tear.?down|reservation only", title, re.I):
        continue
    cat = category(title, summary, "Clubs")
    tags = [cat, "Club activity"]
    if re.search(r"presidents council|scheduling|committee|senate|executive|board|weekly meeting|project meeting|planning", title, re.I):
        summary += " This is an organization/project working meeting; public listing does not mean unrestricted attendance. Confirm membership or invitation requirements with the host."
        tags.append("Membership / role requirements")
    if "NDMUNC" in title:
        summary += " This is a registered Model UN conference, not an open drop-in mixer; consult the host about delegation or staffing eligibility."
        tags.append("Registration required")
    add(dict(title=title, summary=summary, eventDate=start_dt.date().isoformat(), startTime=start_dt.strftime("%H:%M"),
             endTime=end_dt.strftime("%H:%M") if end_dt and (end_dt.date() - start_dt.date()).days <= 1 else None,
             location=location, hostOrganization=event["host"], category=cat, tags=tags[:6], classYears=audience(summary),
             source="Student organization", sourceUrl=event["url"]), evidence)


class WeeklySchedule(HTMLParser):
    def __init__(self):
        super().__init__()
        self.heading = self.day = self.cell = None
        self.cells, self.rows = [], []
    def handle_starttag(self, tag, attrs):
        if tag == "h2":
            self.heading = ""
        if tag == "tr":
            self.cells = []
        if tag in ("td", "th"):
            self.cell = ""
    def handle_data(self, data):
        if self.heading is not None:
            self.heading += data
        if self.cell is not None:
            self.cell += data
    def handle_endtag(self, tag):
        if tag == "h2" and self.heading is not None:
            if self.heading.strip() in ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]:
                self.day = self.heading.strip()
            self.heading = None
        if tag in ("td", "th") and self.cell is not None:
            self.cells.append(re.sub(r"\s+", " ", self.cell).strip())
            self.cell = None
        if tag == "tr" and self.day and len(self.cells) == 2 and re.search(r"\d:\d\d", self.cells[0]):
            self.rows.append((self.day, *self.cells))


schedule_html = urllib.request.urlopen(MASS_URL, timeout=30).read().decode()
Path("/tmp/nd-campus-mass-schedule.html").write_text(schedule_html)
parser = WeeklySchedule()
parser.feed(schedule_html)
assert len(parser.rows) >= 65, "Campus ministry table format changed; do not guess recurrences."
evidence = {"url": MASS_URL, "kind": "Occurrences expanded from an explicitly published weekly schedule",
            "semesterCalendar": TERM_URL, "from": TODAY, "through": END, "excludedBreaks": EXCLUSIONS,
            "recordCount": 0, "rows": len(parser.rows)}
evidence_sources.append(evidence)
days = dict(zip(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], range(7)))
home_football = {e["eventDate"] for e in existing if e["category"] == "Sports" and e["title"].startswith("Football vs.")}
base_locations = ["Basilica", "Crypt Church", "Stayer Center", "Jenkins Nanovic", "Malloy Hall",
                  "Notre Dame Law School", "Stinson-Remick", "Log Chapel"]
date = dt.date.fromisoformat(TODAY)
while date.isoformat() <= END:
    key = date.isoformat()
    if not any(begin <= key <= end for begin, end in EXCLUSIONS):
        for day, time, locations in parser.rows:
            if days[day] != date.weekday():
                continue
            if key in home_football:
                # Post-game services have conditional times: do not apply a regular Saturday schedule.
                continue
            hour, minute, ap = re.search(r"(\d{1,2}):(\d{2})\s*([ap])", time, re.I).groups()
            start = f"{int(hour) % 12 + (12 if ap.lower() == 'p' else 0):02}:{minute}"
            for raw_location in locations.split(","):
                raw_location = raw_location.strip().replace("O' Neill", "O'Neill").replace("Seigfried", "Siegfried")
                if raw_location == "UCF":
                    continue  # Its chapel/location is not sufficiently identified.
                campus_venue = any(n in raw_location for n in base_locations)
                title_prefix = "Vespers" if "Vespers" in raw_location else "Spanish-language Mass" if "Spanish" in raw_location else "Mass"
                venue = re.sub(r"\s*\((?:Spanish|Vespers)\)", "", raw_location)
                venue = venue if campus_venue else f"{venue} Hall chapel"
                # Avoid a second card for a specially named Mass already listed at this time/place.
                if any(e["eventDate"] == key and e["startTime"] == start and "mass" in e["title"].lower()
                       and "basilica" in (e.get("location") or "").lower() and "Basilica" in venue
                       for e in existing + records if SCHEDULE_TAG not in e.get("tags", [])):
                    continue
                restriction = "Open to the Notre Dame community and visitors." if campus_venue else "Residence hall Masses are open to Notre Dame students and their invited guests."
                summary = (f"{title_prefix} at {venue}, following Campus Ministry's explicitly published {day} schedule for weeks when classes are in session. "
                           f"{restriction} This dated card is a published weekly-schedule occurrence, not a separately announced special event. "
                           "Fall break (October 17–25), Thanksgiving break (November 25–29), and home-football Saturday schedules are excluded. "
                           "This snapshot stops at the last class day, December 9. Verify special liturgies or schedule changes with the original source. No end time is published.")
                add(dict(title=f"{title_prefix} — {venue}", summary=summary, eventDate=key, startTime=start, endTime=None,
                         location=venue, hostOrganization="Campus Ministry, University of Notre Dame", category="Faith & Spirituality",
                         tags=[SCHEDULE_TAG, "Faith & Spirituality", "Catholic", "Verify schedule changes"], classYears=["All years"],
                         source="Campus website", sourceUrl=MASS_URL), evidence)
    date += dt.timedelta(days=1)

records.sort(key=lambda r: (r["eventDate"], r["startTime"] or "99:99", r["title"]))
result = {
    "researchedAt": TODAY, "timezone": str(TZ), "sources": evidence_sources,
    "coverageNote": "One-time public-source snapshot, not exhaustive or automatically synced. Counts are dated occurrences, not unique event series. Weekly schedules are explicitly labeled and limited to published in-session fall dates. No ordinary class meetings, office hours, guessed fitness classes, off-campus trips, academic administrative deadlines, or duplicate conference rooms are counted.",
    "categoryCounts": dict(collections.Counter(e["category"] for e in records)), "events": records,
}
out = Path("scripts/data/notre-dame-deep-coverage-events.json")
out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
Path("/tmp/nd-deep-coverage-skipped.json").write_text(json.dumps(skipped, indent=2))
print(json.dumps({k: v for k, v in result.items() if k != "events"}, indent=2))
print(f"New candidate records: {len(records)}; existing: {len(existing)}")