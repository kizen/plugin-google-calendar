({ state }) => {
  return `/external-integrations/proxy/${
    state.pluginApiName
  }/primary/calendar/v3/users/me/calendarList`;
};
