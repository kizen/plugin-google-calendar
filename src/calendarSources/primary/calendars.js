const [data, errors] = await this.getWithErrors(
  this.getServiceUrl("primary", "/calendar/v3/users/me/calendarList"),
);

if (errors) {
  return [];
}

return data.items.map((calendar) => ({
  id: calendar.id,
  description: calendar.description,
  name: calendar.summary,
  default: calendar.primary || false,
}));
