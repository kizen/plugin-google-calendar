# Google Calendar Plugin

### Overview

This plugin connects Kizen to Google Calendar. It has two independent features:

1. **Add to Google Calendar** — a data adornment on Date and Date/Time fields that opens a pre-filled "create event" link in Google Calendar for that field's value.
2. **Personal Calendar Sync** — lets each user connect their own Google account via OAuth so their Google Calendar events show up on the scheduled activities calendar dashlet alongside their Kizen activities.

Both features are enabled by default and can be toggled independently by business administrators.

---

### Prerequisites

- A Google Cloud project with the Google Calendar API enabled, and an OAuth client ID/secret configured under the `personal` service in [kizen.json](kizen.json)
- Users must have a Google account to connect (Personal Calendar Sync only)

---

### Feature 1: Add to Google Calendar

Adds a calendar icon adornment next to any Date or Date/Time field ([src/dataAdornments/date](src/dataAdornments/date), [src/dataAdornments/datetime](src/dataAdornments/datetime)). Clicking it opens `calendar.google.com` in a new window with the event pre-filled:

- **Title** — built from the related object/record name, and the activity name if the field belongs to a scheduled activity
- **Details** — a link back to the record (or scheduled activity) in Kizen
- **Date/time** — the field's value; Date fields create an all-day event, Date/Time fields create a 30-minute event
- **Timezone** — the business's configured timezone

This does not require OAuth — it only builds a URL and opens Google's own event-creation page.

**Business setup:** In the business-level plugin config, toggle **Enable Data Adornment** (`enableAdornments`, default `true`). Disabling it removes the adornment for all users of the business.

---

### Feature 2: Personal Calendar Sync

Lets a user OAuth into their own Google account so their calendar events appear on the scheduled activities calendar dashlet.

- [src/calendarSources/personal/calendars.js](src/calendarSources/personal/calendars.js) lists the user's Google calendars (`GET /calendar/v3/users/me/calendarList`), filtered down to the calendars the user has enabled.
- [src/calendarSources/personal/events.js](src/calendarSources/personal/events.js) fetches events for a given calendar and date range (`GET /calendar/v3/calendars/{calendar_id}/events`) and maps them into Kizen's event shape (title, description, start/end time, all-day flag, busy/free, attendees, link). Events created by Kizen's own scheduled activities (identified by a `--` in the Google `iCalUID`) are tagged with their originating `activity_id` so they aren't duplicated on the dashlet.

**Business setup:** Toggle **Enable External Calendars** (`enableExternalCalendars`, default `true`) in the business-level plugin config. Disabling it removes the feature for all users of the business.

**User setup:** Each user connects their own Google account from their plugin settings (OAuth, `personal` service — see [kizen.json](kizen.json)). Once connected, they choose:

- **Enable All Calendars** (`enableAllCalendars`, default `true`) — sync every calendar the user has access to
- **Enabled Calendars** (`enabledUserCalendars`) — when "Enable All Calendars" is off, an explicit multi-select list of which calendars to sync

A user's calendar selection and connection are private to that user — other users of the business do not get access to those calendars.

**OAuth scopes requested:** `userinfo.email`, `userinfo.profile`, `calendar.readonly`, `calendar.calendars.readonly`, `calendar.events.readonly`, `calendar.events.public.readonly` (read-only — the plugin never writes to a user's Google Calendar).

---

### Configuration Reference

| Level    | Key                     | Type    | Default | Description                                                                 |
| -------- | ----------------------- | ------- | ------- | ----------------------------------------------------------------------------- |
| Business | `enableAdornments`      | boolean | `true`  | Show the "Add to Google Calendar" icon on Date/Date-Time fields             |
| Business | `enableExternalCalendars` | boolean | `true`  | Allow users to connect their Google account and sync calendars              |
| User     | `enableExternalCalendars` | boolean | `true`  | This user's opt-in to sync their calendars (shown when the business setting above is on) |
| User     | `enableAllCalendars`    | boolean | `true`  | Sync all of the user's calendars instead of a specific selection            |
| User     | `enabledUserCalendars`  | select (multi) | — | Which calendars to sync, when "Enable All Calendars" is off                 |

---

### Release Notes

See [releaseNotes/](releaseNotes/) for the version history, or [releaseNotes/2.0.0.md](releaseNotes/2.0.0.md) for the most recent major update (business-level toggle for the adornment, and per-user Google Calendar sync on the scheduled activities dashlet).
