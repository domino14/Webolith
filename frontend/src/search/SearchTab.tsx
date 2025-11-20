import { useCallback, useContext, useMemo, useState } from "react";
import {
  SearchTypesEnum,
  SearchCriterion,
  lexiconSearchCriterion,
} from "./types";
import useSearchRows from "./use_search_rows";
import { AppContext } from "../app_context";
import SearchRows from "./rows";
import { Button, Group, Loader, Select, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useDeckSelector } from "./useDeckSelector";

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
  onDeleteFromAllDecks: (alphagramList: string[]) => Promise<void>;
  onDeleteFromDeck: (deckId: bigint, alphagramList: string[]) => Promise<void>;
};

type ActionType = "add" | "move" | "delete";

const SearchTab: React.FC<SearchTabProps> = ({
  showLoader,
  setShowLoader,
  onDeleteFromAllDecks,
  onDeleteFromDeck,
}) => {
  const { lexicon, wordVaultClient, wordServerClient, decksById } =
    useContext(AppContext);
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
    if (!lexicon || !wordServerClient || !wordVaultClient) {
      return;
    }
    try {
      setShowLoader(true);

      const searchRequest = {
        searchparams: searchCriteria.map((s) => s.toProtoObj()),
      };
      searchRequest.searchparams.unshift(lexiconSearchCriterion(lexicon));

      const searchResponse = await wordServerClient.search(searchRequest);

      if (searchResponse.alphagrams.length === 0) {
        notifications.show({
          color: "yellow",
          message: "No cards match the search criteria.",
        });
        return;
      }

      const alphagrams = searchResponse.alphagrams.map((a) => a.alphagram);

      if (action === "add") {
        const deckId = targetDeck.all ? 0n : targetDeck.id;
        const addResp = await wordVaultClient.addCards({
          lexicon,
          deckId: deckId === 0n ? undefined : deckId,
          alphagrams,
        });

        notifications.show({
          color: "green",
          message: `Added ${addResp.numCardsAdded} cards to WordVault.`,
        });

        if (addResp.numCardsInOtherDecks > 0) {
          const countInOtherDecks = addResp.numCardsInOtherDecks;
          const cardOrCards = countInOtherDecks === 1 ? "card" : "cards";

          notifications.show({
            color: "yellow",
            message: `${countInOtherDecks} ${cardOrCards} were already in other decks. If you wish to add them to this deck, you must move them from the other decks first.`,
          });
        }
      } else if (action === "delete") {
        if (sourceDeck.all) {
          await onDeleteFromAllDecks(alphagrams);
        } else {
          await onDeleteFromDeck(sourceDeck.id, alphagrams);
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
          alphagrams,
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
      notifications.show({
        color: "red",
        title: "Error",
        message: String(e),
      });
    } finally {
      setShowLoader(false);
    }
  }, [
    action,
    lexicon,
    searchCriteria,
    wordServerClient,
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
