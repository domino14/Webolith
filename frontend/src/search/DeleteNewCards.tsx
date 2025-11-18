import { useContext, useState } from "react";
import { AppContext } from "../app_context";
import { Button, Group, Select, Text } from "@mantine/core";
import { useIsDecksEnabled } from "../use_is_decks_enabled";

// Deck selector constants
const ALL_DECKS_OPTION_VALUE = "ALL";
const DEFAULT_DECK_OPTION_VALUE = "DEFAULT";

type DeleteNewCardsProps = {
  onDeleteNewCards: (deckId: bigint | null) => Promise<void>;
};

const DeleteNewCards: React.FC<DeleteNewCardsProps> = ({
  onDeleteNewCards,
}) => {
  const { decksById } = useContext(AppContext);
  const isDecksEnabled = useIsDecksEnabled();
  const [bulkDeleteDeckId, setBulkDeleteDeckId] = useState<bigint | null>(null);

  return (
    <>
      <Text m="xl">
        If you wish to delete a specific set of cards, click on Search above
        and then the "Delete from WordVault" button.
      </Text>
      <Text m="xl">
        If you've accidentally added too many cards, you can delete the new
        ones here. That is, the ones that you have not yet quizzed on.
      </Text>
      <Text m="xl" fw={700} c="red">
        This is not undoable. Make sure you want to delete these new cards! You
        can always re-add them later.
      </Text>

      {isDecksEnabled && decksById.size >= 1 ? (
        <Group m="xl">
          <Select
            value={
              bulkDeleteDeckId === null
                ? ALL_DECKS_OPTION_VALUE
                : bulkDeleteDeckId === 0n
                ? DEFAULT_DECK_OPTION_VALUE
                : bulkDeleteDeckId.toString()
            }
            onChange={(value) =>
              setBulkDeleteDeckId(
                value === ALL_DECKS_OPTION_VALUE || value == null
                  ? null
                  : value === DEFAULT_DECK_OPTION_VALUE
                  ? 0n
                  : BigInt(parseInt(value))
              )
            }
            data={[
              { value: ALL_DECKS_OPTION_VALUE, label: "All Decks" },
              { value: DEFAULT_DECK_OPTION_VALUE, label: "Default Deck" },
              ...[...decksById.values()].map((deck) => ({
                value: deck.id.toString(),
                label: deck.name,
              })),
            ]}
            style={{ minWidth: 200 }}
            placeholder="Select deck"
            size="md"
          />
          <Button
            color="pink"
            onClick={() => onDeleteNewCards(bulkDeleteDeckId)}
          >
            Delete new cards
          </Button>
        </Group>
      ) : (
        <Button
          color="pink"
          m="xl"
          onClick={() => onDeleteNewCards(null)}
        >
          Delete new cards
        </Button>
      )}
    </>
  );
};

export default DeleteNewCards;
