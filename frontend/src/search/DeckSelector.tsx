import { useContext } from "react";
import { Select, MantineSize } from "@mantine/core";
import { AppContext } from "../app_context";

// Internal constants for deck selection
const ALL_DECKS_OPTION_VALUE = "ALL";
const DEFAULT_DECK_OPTION_VALUE = "DEFAULT";

export type DeckValue = { all: true } | { deckId: bigint };

type DeckSelectorProps = {
  value: DeckValue;
  onSelect: (value: DeckValue) => void;
  showAllDecksOption?: boolean;
  size?: MantineSize;
  minWidth?: number;
};

const DeckSelector: React.FC<DeckSelectorProps> = ({
  value,
  onSelect,
  showAllDecksOption = false,
  size = "lg",
  minWidth = 200,
}) => {
  const { decksById } = useContext(AppContext);

  // Convert internal value to string for Select component
  const getSelectValue = (): string => {
    if ("all" in value) {
      return ALL_DECKS_OPTION_VALUE;
    }
    if (value.deckId === 0n) {
      return DEFAULT_DECK_OPTION_VALUE;
    }
    return value.deckId.toString();
  };

  // Convert string from Select component to DeckValue type
  const handleChange = (selectedValue: string | null) => {
    if (selectedValue === ALL_DECKS_OPTION_VALUE) {
      onSelect({ all: true });
    } else if (selectedValue === DEFAULT_DECK_OPTION_VALUE || selectedValue === null) {
      onSelect({ deckId: 0n });
    } else {
      onSelect({ deckId: BigInt(parseInt(selectedValue)) });
    }
  };

  // Build the options array
  const options = [
    ...(showAllDecksOption
      ? [{ value: ALL_DECKS_OPTION_VALUE, label: "All Decks" }]
      : []),
    { value: DEFAULT_DECK_OPTION_VALUE, label: "Default Deck" },
    ...[...decksById.values()].map((deck) => ({
      value: deck.id.toString(),
      label: deck.name,
    })),
  ];

  // Don't render if there are no named decks
  if (decksById.size < 1) {
    return null;
  }

  return (
    <Select
      value={getSelectValue()}
      onChange={handleChange}
      data={options}
      style={{ minWidth }}
      placeholder="Select deck"
      size={size}
    />
  );
};

export default DeckSelector;
