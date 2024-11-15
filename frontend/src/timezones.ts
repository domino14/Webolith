export const getBrowserTimezone = () => {
  // XXX: need to fix this! There's gotta be a better way!
  let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  switch (tz) {
    case "America/Indianapolis":
      tz = "America/Indiana/Indianapolis";
      break;
    default:
    // Do not change it.
  }
  return tz;
};
