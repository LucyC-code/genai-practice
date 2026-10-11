An AI-powered campus event hub that turns messy announcements from email, Instagram, and GroupMe into clean, filterable event cards in one feed.
What the First Working Slice Does
A user opens the prototype and lands on a feed that is already filled with campus events. They can filter the feed by category (for example Free Food, Tech, Networking). They can also paste a raw campus announcement into an Add Event Source box and press a button. The prototype then shows a structured event card (title, date, time, location, host, tags, one-sentence summary) and adds it to the feed next to the pre-loaded events.
How to Open the Prototype
Replit Link:
https://campus-event-discovery.replit.app

Github Link:
https://github.com/LucyC-code/genai-practice/tree/main

Open the Replit link in any browser. No login is needed. On a phone, the layout is mobile-responsive.
AI Behavior: Working vs. Simulated
What the future AI system will do. Read unstructured campus posts (email blasts, Instagram captions, GroupMe messages, flyer images), extract structured event details, tag the event type, flag missing fields, and catch duplicates when the same event is posted on more than one channel.
What currently works. The feed, the category filters, the paste box, and the event card display all work from beginning to end.
What is simulated. No live AI model or external API is connected. The pre-loaded feed events were created from real campus posts using offline batch scripts and prepared by hand. When a user pastes text, the extraction result is a prewritten response matched to a small set of sample posts, not live output from a language model. Anything outside those samples returns a placeholder card with missing fields marked. No API keys or passwords are stored in this repository.
Test Results
Test
Input or action
What happened
Pass, partial, or fail
Typical case
Pasted an informal GroupMe style message with an emoji, a relative day, a time, and a room (free boba and board games tomorrow at 7pm in Duncan 210).
The system showed an event card with the title, tomorrow's date, 7:00 PM, Duncan 210, a Free Food tag, and a one-sentence summary. The card appeared at the top of the feed with the pre-loaded events.
Pass
Challenge case
Pasted an incomplete Instagram caption with no room or time (Startup Pitch Night this Thursday in DeBartolo).
The card showed the title, the date for Thursday, and the building. The time and room were marked as Not provided, with a note that details are missing. The prototype did not invent values.
Partial. Missing fields were handled well, but the date for Thursday is a fixed sample rather than calculated from the post date.
Invalid or empty case
Pressed the submit button with the box empty, then pasted text with no event in it.
With the box empty, a short message asked the user to paste an announcement and no card was created. For text with no event, a message said no event details were found and nothing was added to the feed.
Pass

Known Limitations
The AI extraction is simulated. Pasted text is matched to prewritten sample responses, so only a few inputs produce a realistic card. The next step is to connect a language model through a server-side API call with the key kept out of the repository.
Relative dates are not calculated. Words like tomorrow and this Thursday map to fixed sample dates instead of being resolved against the date a post was published. The next step is to pass the post date to the extraction step and test this Friday against next Friday.
Nothing is saved or deduplicated. Events added through the paste box disappear on refresh, and the same event posted on two channels would show as two cards. The next step is to add a database and a simple duplicate check on title, date, and location.
Where Tests and Limitations Appear
Both are in this README. Test results are under Test Results and limitations are under Known Limitations.

