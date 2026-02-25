const allCalendarsEnabled = this.config.enableAllCalendars ?? true; // Default to true
const calendarFilterList =
  this.config.enabledBusinessCalendars?.map((calendar) => calendar.value) || [];

const [data, errors] = await this.getWithErrors(
  this.getServiceUrl("primary", "/calendar/v3/users/me/calendarList"),
);

if (errors) {
  return [];
}

return data.items
  .map((calendar) => {
    return {
      id: calendar.id,
      description: calendar.description,
      name: calendar.summary,
      default: false,
    };
  })
  .filter((calendar) => {
    if (allCalendarsEnabled) {
      return true;
    }

    if (calendarFilterList.includes(calendar.id)) {
      return true;
    }

    return false;
  });
