import { useContext, useState } from "react";
import { AppContext } from "../app_context";
import { Button, Center, Loader, Stack, Text, TextInput } from "@mantine/core";
import { useIsDecksEnabled } from "../use_is_decks_enabled";
import { useDeckSelector } from "./useDeckSelector";

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
  const { value: deck, selector: deckSelector } = useDeckSelector({
    showAllDecksOption: true,
    size: "md",
    initialValue: { all: true },
  });
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
        {isDecksEnabled && decksById.size >= 1 && deckSelector}
        <TextInput
          label="Type in DELETE ALL CARDS"
          value={deleteAllTextInput}
          onChange={(e) => setDeleteAllTextInput(e.target.value)}
        />
        <Button
          color="red"
          onClick={() => onDeleteAllCards(deck.all ? null : deck.id)}
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
