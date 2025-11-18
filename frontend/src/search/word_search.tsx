import { useCallback, useContext, useState } from "react";
import { AppContext } from "../app_context";
import { Badge, Tabs } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import SearchTab from "./SearchTab";
import UploadTextFileTab from "./UploadTextFileTab";
import UploadCardboxTab from "./UploadCardboxTab";
import BulkCardDeletionTab from "./BulkCardDeletionTab";

const WordSearchForm: React.FC = () => {
  const { lexicon, wordVaultClient } = useContext(AppContext);
  const [showLoader, setShowLoader] = useState(false);

  const handleDeleteFromAllDecks = useCallback(
    async (alphagramList: string[]) => {
      if (!wordVaultClient) {
        return;
      }
      try {
        setShowLoader(true);
        const resp = await wordVaultClient.delete({
          lexicon,
          onlyNewQuestions: false,
          allQuestions: false,
          onlyAlphagrams: alphagramList,
        });
        notifications.show({
          color: "green",
          message: `Deleted ${resp.numDeleted} cards.`,
        });
      } catch (e) {
        notifications.show({
          color: "red",
          title: "Error",
          message: String(e),
        });
      } finally {
        setShowLoader(false);
      }
    },
    [lexicon, wordVaultClient]
  );

  const handleDeleteFromDeck = useCallback(
    async (deckId: bigint, alphagramList: string[]) => {
      if (!wordVaultClient) {
        return;
      }
      try {
        setShowLoader(true);
        const resp = await wordVaultClient.deleteFromDeck({
          lexicon,
          deckId,
          onlyNewQuestions: false,
          allQuestions: false,
          onlyAlphagrams: alphagramList,
        });
        notifications.show({
          color: "green",
          message: `Deleted ${resp.numDeleted} cards.`,
        });
      } catch (e) {
        notifications.show({
          color: "red",
          title: "Error",
          message: String(e),
        });
      } finally {
        setShowLoader(false);
      }
    },
    [lexicon, wordVaultClient]
  );

  const handleDeleteNewCards = useCallback(
    async (deckId: bigint | null) => {
      if (!wordVaultClient) {
        return;
      }
      try {
        setShowLoader(true);
        if (deckId === null) {
          const resp = await wordVaultClient.delete({
            lexicon,
            onlyNewQuestions: true,
            allQuestions: false,
          });
          notifications.show({
            color: "green",
            message: `Deleted ${resp.numDeleted} cards.`,
          });
        } else {
          const resp = await wordVaultClient.deleteFromDeck({
            lexicon,
            deckId,
            onlyNewQuestions: true,
            allQuestions: false,
          });
          notifications.show({
            color: "green",
            message: `Deleted ${resp.numDeleted} cards.`,
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
    },
    [lexicon, wordVaultClient]
  );

  const handleDeleteAllCards = useCallback(
    async (deckId: bigint | null) => {
      if (!wordVaultClient) {
        return;
      }
      try {
        setShowLoader(true);
        if (deckId === null) {
          const resp = await wordVaultClient.delete({
            lexicon,
            onlyNewQuestions: false,
            allQuestions: true,
          });
          notifications.show({
            color: "green",
            message: `Deleted ${resp.numDeleted} cards.`,
          });
        } else {
          const resp = await wordVaultClient.deleteFromDeck({
            lexicon,
            deckId,
            onlyNewQuestions: false,
            allQuestions: true,
          });
          notifications.show({
            color: "green",
            message: `Deleted ${resp.numDeleted} cards.`,
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
    },
    [lexicon, wordVaultClient]
  );

  return (
    <Tabs variant="default" defaultValue="search">
      <Tabs.List>
        <Tabs.Tab value="search">Search</Tabs.Tab>
        <Tabs.Tab value="upload-list">Upload text file</Tabs.Tab>
        <Tabs.Tab value="upload-cardbox">
          Upload Zyzzyva Cardbox
          <Badge color="green" ml="md">
            New
          </Badge>
        </Tabs.Tab>
        <Tabs.Tab value="delete-cards" c="red">
          Bulk card deletion
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="search">
        <SearchTab
          showLoader={showLoader}
          setShowLoader={setShowLoader}
          onDeleteFromAllDecks={handleDeleteFromAllDecks}
          onDeleteFromDeck={handleDeleteFromDeck}
        />
      </Tabs.Panel>

      <Tabs.Panel value="upload-list">
        <UploadTextFileTab
          showLoader={showLoader}
          setShowLoader={setShowLoader}
        />
      </Tabs.Panel>

      <Tabs.Panel value="upload-cardbox">
        <UploadCardboxTab
          showLoader={showLoader}
          setShowLoader={setShowLoader}
        />
      </Tabs.Panel>

      <Tabs.Panel value="delete-cards">
        <BulkCardDeletionTab
          onDeleteNewCards={handleDeleteNewCards}
          onDeleteAllCards={handleDeleteAllCards}
          showLoader={showLoader}
        />
      </Tabs.Panel>
    </Tabs>
  );
};

export default WordSearchForm;
