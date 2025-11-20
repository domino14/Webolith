import { useCallback, useContext, useState } from "react";
import {
  SearchTypesEnum,
  SearchCriterion,
  lexiconSearchCriterion,
} from "./types";
import useSearchRows from "./use_search_rows";
import { AppContext } from "../app_context";
import SearchRows from "./rows";
import {
  Button,
  Group,
  Loader,
  Select,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useDeckSelector } from "./useDeckSelector";
import { MoveCardsRequest } from "../gen/rpc/wordvault/api_pb";

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
  const { lexicon, wordVaultClient, wordServerClient } = useContext(AppContext);
  const [action, setAction] = useState<ActionType>("add");

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
      } else if (action === "delete") {
        if (sourceDeck.all) {
          await onDeleteFromAllDecks(alphagrams);
        } else {
          await onDeleteFromDeck(sourceDeck.id, alphagrams);
        }
      } else if (action === "move") {
        if (!sourceDeck.all && !targetDeck.all && sourceDeck.id === targetDeck.id) {
            notifications.show({
                color: "red",
                message: "Source and target decks cannot be the same.",
            });
            return;
        }
        
        const targetDeckId = targetDeck.all ? 0n : targetDeck.id;
        const sourceDeckId = sourceDeck.all ? undefined : sourceDeck.id;
        
        // @ts-ignore: MoveCardsRequest generated types might be missing sourceDeckId/fromAllDecks
        const moveReq = new MoveCardsRequest({
            lexicon,
            alphagrams,
            deckId: targetDeckId,
            sourceDeckId: sourceDeckId,
            fromAllDecks: sourceDeck.all,
        });
        // Manually assign extra properties if the constructor ignores them due to type safety
        // (Protobuf classes usually ignore unknown fields in constructor)
        
        const reqPlain: any = {
            lexicon,
            alphagrams,
            deckId: targetDeckId,
            sourceDeckId: sourceDeckId,
            fromAllDecks: sourceDeck.all
        };

        // @ts-ignore
        const moveResp = await wordVaultClient.moveCards(reqPlain);

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

  return (
    <Stack mt="lg">
      <SearchRows
        criteria={searchCriteria}
        addSearchRow={addSearchRow}
        removeSearchRow={removeSearchRow}
        modifySearchType={searchTypeChange}
        modifySearchParam={searchParamChange}
        allowedSearchTypes={allowedSearchTypes}
      />

      <Select
        label="Action"
        value={action}
        onChange={(value) => setAction(value as ActionType)}
        data={[
          { label: "Add to deck", value: "add" },
          { label: "Move cards", value: "move" },
          { label: "Delete cards", value: "delete" },
        ]}
        size="md"
        mb="md"
        allowDeselect={false}
      />

      <Group mb="lg" align="flex-end">
        {action === "add" && targetDeckSelector}
        {action === "delete" && sourceDeckSelector}
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
        >
          {action === "add"
            ? "Add to Deck"
            : action === "delete"
            ? "Delete Cards"
            : "Move Cards"}
        </Button>
      </Group>

      {showLoader ? <Loader color="blue" type="bars" /> : null}
    </Stack>
  );
};

export default SearchTab;
