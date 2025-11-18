import { useContext, useState } from "react";
import { AppContext } from "../app_context";
import { Button, Center, Loader, Select, Stack, Text, TextInput } from "@mantine/core";
import { useIsDecksEnabled } from "../use_is_decks_enabled";

// Deck selector constants
const ALL_DECKS_OPTION_VALUE = "ALL";
const DEFAULT_DECK_OPTION_VALUE = "DEFAULT";

type DeleteAllCardsProps = {
  onDeleteAllCards: (deckId: bigint | null) => Promise<void>;
  showLoader: boolean;
};

const DeleteAllCards: React.FC<DeleteAllCardsProps> = ({
  onDeleteAllCards,
  showLoader,
}) => {
  const { decksById } = useContext(AppContext);
  const isDecksEnabled = useIsDecksEnabled();
  const [bulkDeleteDeckId, setBulkDeleteDeckId] = useState<bigint | null>(null);
  const [deleteAllTextInput, setDeleteAllTextInput] = useState("");

  return (
    <>
      <Center>
        <Text fw={700} m="xl" c="red" size="xl">
          DANGER ZONE
        </Text>
      </Center>
      <Text m="xl">
        Maybe you wish to start over new? You can delete ALL your cards.
      </Text>
      <Text m="xl" fw={700} c="red">
        This is not undoable. You will lose all your history! Make sure you
        actually want to delete all your cards!
      </Text>
      <Stack m="xl">
        {isDecksEnabled && decksById.size >= 1 && (
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
        )}
        <TextInput
          label="Type in DELETE ALL CARDS"
          value={deleteAllTextInput}
          onChange={(e) => setDeleteAllTextInput(e.target.value)}
        />
        <Button
          color="red"
          onClick={() => onDeleteAllCards(bulkDeleteDeckId)}
          disabled={deleteAllTextInput !== "DELETE ALL CARDS"}
        >
          Delete ALL cards
        </Button>
        <Text c="dimmed" size="xs">
          This is one doodle that can't be undid, home skillet.
        </Text>
        {showLoader ? <Loader color="blue" type="bars" /> : null}
      </Stack>
    </>
  );
};

export default DeleteAllCards;
