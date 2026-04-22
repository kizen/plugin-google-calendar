({ state }) => {
  return `/external-integrations/proxy/${
    state.pluginApiName
  }/personal/calendar/v3/users/me/calendarList`;
};
