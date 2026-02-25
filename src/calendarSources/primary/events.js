const { range_start, range_end, calendar_id } = this.args.calendar;

// An all-day event from google will have a start and end date, but not
// a start or end datetime.
const isAllDayEvent = (event) => {
  return Boolean(
    !event.start.dateTime &&
    !event.end.dateTime &&
    event.start.date &&
    event.end.date,
  );
};

// The date bounds need to be parsed in the user's timezone if they are an all-day event,
// otherwise we get a full timestamp that can be parsed as-is.
const parseDateBounds = (event) => {
  let startDate;
  let endDate;

  try {
    if (isAllDayEvent(event)) {
      startDate = this.createDateObject(event.start.date);
      endDate = this.createDateObject(event.end.date);
    } else {
      startDate = new Date(event.start.dateTime);
      endDate = new Date(event.end.dateTime);
    }
  } catch (ex) {}

  return { startDate, endDate };
};

const [data, errors] = await this.getWithErrors(
  this.getServiceUrl(
    "primary",
    `/calendar/v3/calendars/${encodeURIComponent(calendar_id)}/events?timeMin=${encodeURIComponent(
      range_start,
    )}&timeMax=${encodeURIComponent(range_end)}&singleEvents=true`,
  ),
);

if (errors) {
  return [];
}

return data.items
  .filter((event) => {
    return event.eventType !== "workingLocation";
  })
  .map((event) => {
    const { startDate, endDate } = parseDateBounds(event);

    if (!startDate || !endDate) {
      return null;
    }

    // If the iCalUID has a "--" in it, try to extract an activity ID.
    // This is how the calendar plugin will create events for scheduled activities.
    const activityId = event.iCalUID?.includes("--")
      ? event.iCalUID.split("--")[0]
      : undefined;

    return {
      id: event.id,
      activity_id: activityId,
      calendar_id,
      title: event.summary,
      description: event.description,
      start_time: this.formatDateForResponse(startDate),
      end_time: this.formatDateForResponse(endDate),
      all_day: isAllDayEvent(event),
      // Transparency is how google indicates free/busy
      busy: event.transparency !== "transparent",
      url: event.htmlLink,
      attendees:
        event.attendees
          ?.filter((attendee) => attendee.responseStatus === "accepted")
          .map((attendee) => attendee.email) ?? [],
    };
  })
  .filter((event) => event !== null);
