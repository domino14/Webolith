import { Code, ConnectError } from "@connectrpc/connect";
import { notifications } from "@mantine/notifications";

// Shows an error from a card action. The server returns NotFound when a
// search given to it matches no cards, which is a warning, not an error.
export const notifyCardActionError = (e: unknown) => {
  if (e instanceof ConnectError && e.code === Code.NotFound) {
    notifications.show({
      color: "yellow",
      message: "No cards match the search criteria.",
    });
    return;
  }
  notifications.show({
    color: "red",
    title: "Error",
    message: String(e),
  });
};
