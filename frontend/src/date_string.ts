export const dateString = (datestr: string, showTime?: boolean) =>
  `${new Date(datestr).toLocaleDateString()}${
    showTime ? " " + new Date(datestr).toLocaleTimeString() : ""
  }`;
