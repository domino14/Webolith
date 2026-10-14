import { useCallback, useContext, useMemo, useState } from "react";
import { SearchTypesEnum, SearchCriterion } from "./types";
import useSearchRows from "./use_search_rows";
import { AppContext } from "../app_context";
import SearchRows from "./rows";
import { Button, Group, Loader, Select, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useDeckSelector } from "./useDeckSelector";
import { notifyCardActionError } from "./notify_error";
import { SearchRequest_SearchParam } from "../gen/rpc/wordsearcher/searcher_pb";

const allowedSearchTypes = new Set([
  SearchTypesEnum.PROBABILITY,
  SearchTypesEnum.LENGTH,
  SearchTypesEnum.TAGS,
  SearchTypesEnum.POINTS,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_VOWELS,
  SearchTypesEnum.NOT_IN_LEXICON,
  SearchTypesEnum.DIFFICULTY_RANGE,
  SearchTypesEnum.PROBABILITY_LIMIT,
  SearchTypesEnum.MATCHING_ANAGRAM,
  SearchTypesEnum.CONTAINS_HOOKS,
  SearchTypesEnum.DEFINITION_CONTAINS,
]);

const initialCriteria = [
  new SearchCriterion(SearchTypesEnum.LENGTH, {
    minValue: 7,
    maxValue: 7,
  }),
  new SearchCriterion(SearchTypesEnum.PROBABILITY, {
    minValue: 1,
    maxValue: 200,
  }),
];

type SearchTabProps = {
  showLoader: boolean;
  setShowLoader: (loading: boolean) => void;
  onDeleteFromAllDecks: (
    searchParams: SearchRequest_SearchParam[]
  ) => Promise<void>;
  onDeleteFromDeck: (
    deckId: bigint,
    searchParams: SearchRequest_SearchParam[]
  ) => Promise<void>;
};

type ActionType = "add" | "move" | "delete";

const SearchTab: React.FC<SearchTabProps> = ({
  showLoader,
  setShowLoader,
  onDeleteFromAllDecks,
  onDeleteFromDeck,
}) => {
  const { lexicon, wordVaultClient, decksById } = useContext(AppContext);
  const [action, setAction] = useState<ActionType>("add");

  const hasDecks = decksById.size > 0;

  const { value: sourceDeck, selector: sourceDeckSelector } = useDeckSelector({
    showAllDecksOption: true,
    label: action === "move" ? "From" : undefined,
    initialValue: { deckId: 0n },
  });

  const { value: targetDeck, selector: targetDeckSelector } = useDeckSelector({
    showAllDecksOption: false,
    label: action === "move" ? "To" : undefined,
    initialValue: { deckId: 0n },
  });

  const {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  } = useSearchRows(initialCriteria, allowedSearchTypes);

  const handleAction = useCallback(async () => {
    if (!lexicon || !wordVaultClient) {
      return;
    }
    // The search runs on the server, in the current lexicon.
    const searchParams = searchCriteria.map((s) => s.toProtoObj());

    if (action === "delete") {
      // The delete handlers manage the loader and notifications themselves.
      if (sourceDeck.all) {
        await onDeleteFromAllDecks(searchParams);
      } else {
        await onDeleteFromDeck(sourceDeck.id, searchParams);
      }
      return;
    }

    try {
      setShowLoader(true);

      if (action === "add") {
        const deckId = targetDeck.all ? 0n : targetDeck.id;
        const addResp = await wordVaultClient.addCards({
          lexicon,
          deckId: deckId === 0n ? undefined : deckId,
          searchParams,
        });

        notifications.show({
          color: "green",
          message: `Added ${addResp.numCardsAdded} cards to WordVault.`,
        });

        if (addResp.numCardsInOtherDecks > 0) {
          const countInOtherDecks = addResp.numCardsInOtherDecks;
          const inOtherDecksMessage =
            countInOtherDecks === 1
              ? "card is in another deck"
              : "cards were already in other decks";

          notifications.show({
            color: "yellow",
            message: `${countInOtherDecks} ${inOtherDecksMessage}. If you wish to add them to this deck, you must move them from the other decks first.`,
          });
        }
      } else if (action === "move") {
        if (
          !sourceDeck.all &&
          !targetDeck.all &&
          sourceDeck.id === targetDeck.id
        ) {
          notifications.show({
            color: "red",
            message: "Source and target decks cannot be the same.",
          });
          return;
        }

        const targetDeckId = targetDeck.all ? 0n : targetDeck.id;
        const sourceDeckId = sourceDeck.all ? undefined : sourceDeck.id;

        const moveResp = await wordVaultClient.moveCards({
          lexicon,
          searchParams,
          targetDeckId: targetDeckId,
          sourceDeckId: sourceDeckId,
          fromAllDecks: sourceDeck.all,
        });

        notifications.show({
          color: "green",
          message: `Moved ${moveResp.numCardsMoved} cards.`,
        });
      }
    } catch (e) {
      notifyCardActionError(e);
    } finally {
      setShowLoader(false);
    }
  }, [
    action,
    lexicon,
    searchCriteria,
    wordVaultClient,
    setShowLoader,
    sourceDeck,
    targetDeck,
    onDeleteFromAllDecks,
    onDeleteFromDeck,
  ]);

  const actionOptions = useMemo(() => {
    if (hasDecks) {
      return [
        { label: "Add to deck", value: "add" },
        { label: "Move cards", value: "move" },
        { label: "Delete cards", value: "delete" },
      ];
    }

    return [
      { label: "Add cards", value: "add" },
      { label: "Delete cards", value: "delete" },
    ];
  }, [hasDecks]);

  const buttonDisabled = useMemo(() => {
    if (action === "move") {
      return !hasDecks;
    }

    return false;
  }, [action, hasDecks]);

  const buttonLabel = useMemo(() => {
    if (action === "add") {
      return hasDecks ? "Add to Deck" : "Add to WordVault";
    }
    if (action === "delete") {
      return "Delete Cards";
    }
    return "Move Cards";
  }, [action, hasDecks]);

  return (
    <Stack mt="lg" gap="sm">
      <SearchRows
        criteria={searchCriteria}
        addSearchRow={addSearchRow}
        removeSearchRow={removeSearchRow}
        modifySearchType={searchTypeChange}
        modifySearchParam={searchParamChange}
        allowedSearchTypes={allowedSearchTypes}
      />

      <Group>
        <Select
          label="Action"
          value={action}
          onChange={(value) => setAction(value as ActionType)}
          data={actionOptions}
          size="lg"
          mb="lg"
          allowDeselect={false}
        />
      </Group>

      <Group mb="lg" align="flex-end">
        {action === "add" && hasDecks && targetDeckSelector}
        {action === "delete" && hasDecks && sourceDeckSelector}
        {action === "move" && (
          <>
            {sourceDeckSelector}
            {targetDeckSelector}
          </>
        )}

        <Button
          variant={action === "delete" ? "filled" : "light"}
          color={action === "delete" ? "red" : "blue"}
          onClick={handleAction}
          size="lg"
          disabled={buttonDisabled}
        >
          {buttonLabel}
        </Button>
      </Group>

      {showLoader ? <Loader color="blue" type="bars" /> : null}
    </Stack>
  );
};

export default SearchTab;
