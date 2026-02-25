({ state }) => {
  const data = state.result?.data?.items || [];

  return data.map((calendar) => {
    return {
      label: calendar.summary,
      value: calendar.id,
    };
  });
};
