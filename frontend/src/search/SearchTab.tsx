import { useCallback, useContext } from "react";
import {
  SearchTypesEnum,
  SearchCriterion,
  lexiconSearchCriterion,
} from "./types";
import useSearchRows from "./use_search_rows";
import { AppContext } from "../app_context";
import SearchRows from "./rows";
import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
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

type AlertValues = {
  shown: boolean;
  color?: string;
  text?: string;
};

type SearchTabProps = {
  onAlertChange: (alert: AlertValues) => void;
  alert: AlertValues;
  showLoader: boolean;
  setShowLoader: (loading: boolean) => void;
  onDeleteFromAllDecks: (alphagramList: string[]) => Promise<void>;
  onDeleteFromDeck: (deckId: bigint, alphagramList: string[]) => Promise<void>;
};

const SearchTab: React.FC<SearchTabProps> = ({
  onAlertChange,
  alert,
  showLoader,
  setShowLoader,
  onDeleteFromAllDecks,
  onDeleteFromDeck,
}) => {
  const { lexicon, wordVaultClient, wordServerClient, decksById } =
    useContext(AppContext);
  const { value: deck, selector: deckSelector } = useDeckSelector();
  const [
    openedSearchDelete,
    { close: closeSearchDelete, open: openSearchDelete },
  ] = useDisclosure(false);
  const [
    openedSearchDeleteDeck,
    { close: closeSearchDeleteDeck, open: openSearchDeleteDeck },
  ] = useDisclosure(false);

  const {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  } = useSearchRows(initialCriteria, allowedSearchTypes);

  const addToWordVault = useCallback(async () => {
    if (!lexicon || !wordServerClient || !wordVaultClient) {
      return;
    }
    try {
      setShowLoader(true);
      onAlertChange({ ...alert, shown: false });

      const searchRequest = {
        searchparams: searchCriteria.map((s) => s.toProtoObj()),
      };
      searchRequest.searchparams.unshift(lexiconSearchCriterion(lexicon));

      const searchResponse = await wordServerClient.search(searchRequest);
      const deckId = deck.all ? 0n : deck.id;
      console.log("Adding cards!!", { deckId });
      const addResp = await wordVaultClient.addCards({
        lexicon,
        deckId: deckId === 0n ? undefined : deckId,
        alphagrams: searchResponse.alphagrams.map((a) => a.alphagram),
      });

      onAlertChange({
        color: "green",
        shown: true,
        text: `Added ${addResp.numCardsAdded} cards to WordVault.`,
      });
    } catch (e) {
      onAlertChange({
        color: "red",
        shown: true,
        text: String(e),
      });
    } finally {
      setShowLoader(false);
    }
  }, [
    lexicon,
    searchCriteria,
    wordServerClient,
    wordVaultClient,
    onAlertChange,
    setShowLoader,
    deck,
    alert,
  ]);

  const onConfirmDeleteFromAllDecksViaSearch = useCallback(async () => {
    if (!lexicon || !wordServerClient) {
      return;
    }
    try {
      setShowLoader(true);
      onAlertChange({ ...alert, shown: false });

      const searchRequest = {
        searchparams: searchCriteria.map((s) => s.toProtoObj()),
      };
      searchRequest.searchparams.unshift(lexiconSearchCriterion(lexicon));

      const searchResponse = await wordServerClient.search(searchRequest);

      if (searchResponse.alphagrams.length === 0) {
        throw new Error("No cards to delete.");
      }
      await onDeleteFromAllDecks(
        searchResponse.alphagrams.map((a) => a.alphagram)
      );
    } catch (e) {
      onAlertChange({
        color: "red",
        shown: true,
        text: String(e),
      });
    } finally {
      setShowLoader(false);
    }
  }, [
    lexicon,
    onDeleteFromAllDecks,
    searchCriteria,
    wordServerClient,
    onAlertChange,
    setShowLoader,
    alert,
  ]);

  const onConfirmDeleteFromDeckViaSearch = useCallback(async () => {
    if (!lexicon || !wordServerClient) {
      return;
    }
    try {
      setShowLoader(true);
      onAlertChange({ ...alert, shown: false });

      const searchRequest = {
        searchparams: searchCriteria.map((s) => s.toProtoObj()),
      };
      searchRequest.searchparams.unshift(lexiconSearchCriterion(lexicon));

      const searchResponse = await wordServerClient.search(searchRequest);

      if (searchResponse.alphagrams.length === 0) {
        throw new Error("No cards to delete.");
      }
      const deckId = deck.all ? 0n : deck.id;
      await onDeleteFromDeck(
        deckId,
        searchResponse.alphagrams.map((a) => a.alphagram)
      );
    } catch (e) {
      onAlertChange({
        color: "red",
        shown: true,
        text: String(e),
      });
    } finally {
      setShowLoader(false);
    }
  }, [
    lexicon,
    onDeleteFromDeck,
    searchCriteria,
    wordServerClient,
    onAlertChange,
    setShowLoader,
    alert,
    deck,
  ]);

  return (
    <>
      <Modal
        opened={openedSearchDelete}
        withCloseButton
        onClose={closeSearchDelete}
        title="Delete some cards?"
      >
        <Text size="lg" m="lg">
          Are you sure? This will delete the cards matching your search criteria
          from WordVault from the selected deck. This can't be undone!
        </Text>
        <Group gap="lg" m="lg">
          <Button
            onClick={() => {
              onConfirmDeleteFromAllDecksViaSearch();
              closeSearchDelete();
            }}
            color="pink"
          >
            Yes, delete matching cards
          </Button>
          <Button onClick={closeSearchDelete}>Nevermind</Button>
        </Group>
      </Modal>

      <Modal
        opened={openedSearchDeleteDeck}
        withCloseButton
        onClose={closeSearchDeleteDeck}
        title="Delete some cards from deck?"
      >
        <Text size="lg" m="lg">
          Are you sure? This will delete the cards matching your search criteria
          from <strong>{deck.name}</strong>. This can't be undone!
        </Text>
        <Group gap="lg" m="lg">
          <Button
            onClick={() => {
              onConfirmDeleteFromDeckViaSearch();
              closeSearchDeleteDeck();
            }}
            color="pink"
          >
            Yes, delete matching cards from this deck
          </Button>
          <Button onClick={closeSearchDeleteDeck}>Nevermind</Button>
        </Group>
      </Modal>

      <Stack mt="lg">
        <SearchRows
          criteria={searchCriteria}
          addSearchRow={addSearchRow}
          removeSearchRow={removeSearchRow}
          modifySearchType={searchTypeChange}
          modifySearchParam={searchParamChange}
          allowedSearchTypes={allowedSearchTypes}
        />
        <Group mb="lg">
          {deckSelector}
          <Button
            variant="light"
            color="blue"
            style={{ maxWidth: 250 }}
            onClick={addToWordVault}
            size="lg"
          >
            Add to WordVault
          </Button>
        </Group>
        {alert.shown && (
          <Alert variant="light" color={alert.color} mt="lg">
            {alert.text}
          </Alert>
        )}

        <Text size="lg" mb="lg">
          OR
        </Text>

        {decksById.size >= 1 ? (
          <Group>
            <Button variant="light" color="red" onClick={openSearchDeleteDeck}>
              Delete from {deck.name}
            </Button>
            <Button variant="light" color="pink" onClick={openSearchDelete}>
              Delete from All Decks
            </Button>
          </Group>
        ) : (
          <Button
            variant="light"
            color="red"
            style={{ maxWidth: 250 }}
            onClick={openSearchDelete}
          >
            Delete from WordVault
          </Button>
        )}

        {showLoader ? <Loader color="blue" type="bars" /> : null}
      </Stack>
    </>
  );
};

export default SearchTab;
