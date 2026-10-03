import { test } from "node:test";
import assert from "node:assert/strict";
import { toggleCategory, matchesCategories, serverCategory } from "./category-selection";
import { matchesDiscovery } from "./discovery-filters";
import type { Event, EventCategory } from "@workspace/api-client-react";

test("selecting another category adds it instead of replacing the first", () => {
  assert.deepEqual(toggleCategory(["Networking"], "Career"), ["Networking", "Career"]);
});

test("four choices are allowed, but a fifth is not added", () => {
  const selected: EventCategory[] = ["Networking", "Career", "Social", "Clubs"];
  assert.deepEqual(toggleCategory(selected, "Film"), selected);
  assert.deepEqual(toggleCategory(["Networking", "Career", "Social"], "Clubs"), selected);
});

test("selected choices remain removable at the limit", () => {
  const selected: EventCategory[] = ["Networking", "Career", "Social", "Clubs"];
  assert.deepEqual(toggleCategory(selected, "Career"), ["Networking", "Social", "Clubs"]);
  assert.deepEqual(toggleCategory(toggleCategory(selected, "Career"), "Film"), ["Networking", "Social", "Clubs", "Film"]);
});

test("no selection shows all; multiple selections use OR, never AND", () => {
  assert.equal(matchesCategories("Faith & Spirituality", []), true);
  for (const category of ["Networking", "Career"] as const) {
    assert.equal(matchesCategories(category, ["Networking", "Career"]), true);
  }
  assert.equal(matchesCategories("Social", ["Networking", "Career"]), false);
});

test("clearing the last category returns to all categories", () => {
  const selected = toggleCategory(["Film"], "Film");
  assert.deepEqual(selected, []);
  assert.equal(matchesCategories("Sports", selected), true);
});

test("single selections use the API filter; multi-selections fetch the full matching feed", () => {
  assert.equal(serverCategory([]), undefined);
  assert.equal(serverCategory(["Networking"]), "Networking");
  assert.equal(serverCategory(["Networking", "Career"]), undefined);
});

test("a sport filter does not discard a co-selected networking category", () => {
  const selected: EventCategory[] = ["Sports", "Networking"];
  const matches = (category: EventCategory, tags: string[]) => {
    const event = { category, tags, title: "Campus event", summary: "", eventDate: "2026-10-09" } as Event;
    return matchesCategories(category, selected) && matchesDiscovery(event, "", category === "Sports" ? "Tennis" : "", "");
  };
  assert.equal(matches("Sports", ["Tennis"]), true);
  assert.equal(matches("Sports", ["Hockey"]), false);
  assert.equal(matches("Networking", []), true);
});