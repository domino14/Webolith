import { useContext } from "react";
import { AppContext } from "../app_context";
import { Button, Group, Loader, Stack, Text } from "@mantine/core";
import { useIsDecksEnabled } from "../use_is_decks_enabled";
import { useDeckSelector } from "./useDeckSelector";

type DeleteNewCardsProps = {
  onDeleteNewCards: (deckId: bigint | null) => Promise<void>;
  showLoader: boolean;
};

const DeleteNewCards: React.FC<DeleteNewCardsProps> = ({
  onDeleteNewCards,
  showLoader,
}) => {
  const { decksById } = useContext(AppContext);
  const isDecksEnabled = useIsDecksEnabled();
  const { value: deck, selector: deckSelector } = useDeckSelector({
    showAllDecksOption: true,
    size: "md",
    initialValue: { all: true },
  });

  return (
    <>
      <Text m="xl">
        If you wish to delete a specific set of cards, click on Search above and
        then the "Delete from WordVault" button.
      </Text>
      <Text m="xl">
        If you've accidentally added too many cards, you can delete the new ones
        here. That is, the ones that you have not yet quizzed on.
      </Text>
      <Text m="xl" fw={700} c="red">
        This is not undoable. Make sure you want to delete these new cards! You
        can always re-add them later.
      </Text>

      <Stack>
        {isDecksEnabled && decksById.size >= 1 ? (
          <Group m="xl">
            {deckSelector}

            <Button
              color="pink"
              onClick={() => onDeleteNewCards(deck.all ? null : deck.id)}
            >
              Delete new cards
            </Button>
          </Group>
        ) : (
          <Button color="pink" m="xl" onClick={() => onDeleteNewCards(null)}>
            Delete new cards
          </Button>
        )}
        {showLoader ? <Loader color="blue" type="bars" /> : null}
      </Stack>
    </>
  );
};

export default DeleteNewCards;
