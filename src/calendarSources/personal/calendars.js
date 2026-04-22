const allCalendarsEnabled = this.userConfig.enableAllCalendars ?? true; // Default to true
const calendarFilterList =
  this.userConfig.enabledUserCalendars?.map((calendar) => calendar.value) || [];

const [data, errors] = await this.getWithErrors(
  this.getServiceUrl("personal", "/calendar/v3/users/me/calendarList"),
);

if (errors) {
  return [];
}

return data.items
  .map((calendar) => ({
    id: calendar.id,
    description: calendar.description,
    name: calendar.summary,
    default: calendar.primary || false,
  }))
  .filter((calendar) => {
    if (allCalendarsEnabled) {
      return true;
    }

    if (calendarFilterList.includes(calendar.id)) {
      return true;
    }

    return false;
  });
