import { useContext, useMemo, useState } from "react";
import { MantineSize } from "@mantine/core";
import { AppContext } from "../app_context";
import DeckSelector, { DeckValue } from "./DeckSelector";

export type DeckSelectorValue =
  | { name: string; id: bigint; all: false }
  | { name: string; all: true };

type UseDeckSelectorOptions = {
  showAllDecksOption?: boolean;
  size?: MantineSize;
  minWidth?: number;
  initialValue?: DeckValue;
  label?: string;
};

export function useDeckSelector(options?: UseDeckSelectorOptions) {
  const { decksById } = useContext(AppContext);
  const [internalValue, setInternalValue] = useState<DeckValue>(
    options?.initialValue ?? { deckId: 0n }
  );

  // Compute the value with name
  const value: DeckSelectorValue = useMemo(() => {
    if ("all" in internalValue) {
      return { name: "All Decks", all: true };
    }
    if (internalValue.deckId === 0n) {
      return { name: "Default Deck", id: 0n, all: false };
    }
    const deck = decksById.get(internalValue.deckId);
    return {
      name: deck?.name ?? "Unknown Deck",
      id: internalValue.deckId,
      all: false,
    };
  }, [internalValue, decksById]);

  // Create the selector component
  const selector = (
    <DeckSelector
      value={internalValue}
      onSelect={setInternalValue}
      showAllDecksOption={options?.showAllDecksOption}
      size={options?.size}
      minWidth={options?.minWidth}
      label={options?.label}
    />
  );

  return { value, selector, setInternalValue };
}
