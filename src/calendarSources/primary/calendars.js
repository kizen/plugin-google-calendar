const enabledCalendars = this.config.enabledBusinessCalendars;
const shouldFilter = Array.isArray(enabledCalendars);
const calendarFilterList =
  enabledCalendars?.map((calendar) => calendar.value) || [];

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
    if (!shouldFilter) {
      return true;
    }

    if (shouldFilter && calendarFilterList.includes(calendar.id)) {
      return true;
    }

    return false;
  });
