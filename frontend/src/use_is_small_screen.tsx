import { useMediaQuery } from "@mantine/hooks";

export function useIsSmallScreen() {
  return useMediaQuery("(max-width: 40em)");
}
