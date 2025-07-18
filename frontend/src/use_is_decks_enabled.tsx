import { useContext } from "react";
import { AppContext } from "./app_context";

const ALLOWLISTED_USERS = ["benmuschol", "benmusch", "cesar"];

// TODO: Fully release decks soon and remove this
export function useIsDecksEnabled() {
  const { username, isMember } = useContext(AppContext);
  return ALLOWLISTED_USERS.includes(username) || isMember;
}
