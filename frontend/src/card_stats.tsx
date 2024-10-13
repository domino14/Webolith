import React, { useCallback, useContext, useMemo, useState } from "react";
import { AppContext } from "./app_context";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import { useClient } from "./use_client";
import {
  Button,
  Card,
  List,
  Stack,
  Text,
  TextInput,
  Timeline,
  useMantineTheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Score, Card as WordVaultCard } from "./gen/rpc/wordvault/api_pb";
import {
  IconAlertHexagon,
  IconBabyBottle,
  IconCheck,
  IconHelp,
  IconX,
} from "@tabler/icons-react";

const CardStats: React.FC = () => {
  const { lexicon, jwt } = useContext(AppContext);
  const [lookup, setLookup] = useState("");
  const wordvaultClient = useClient(WordVaultService);
  const [cardInfo, setCardInfo] = useState<WordVaultCard | null>(null);

  const lookupAlphagram = useCallback(async () => {
    try {
      const resp = await wordvaultClient.getCardInformation({
        lexicon,
        alphagrams: [lookup],
      });
      if (resp.cards.length === 0) {
        throw new Error("No card found");
      }
      setCardInfo(resp.cards[0]);
    } catch (e) {
      notifications.show({
        color: "red",
        message: String(e),
      });
    }
  }, [lexicon, lookup, wordvaultClient, jwt]);

  const fsrsCard = useMemo(
    () =>
      cardInfo
        ? (JSON.parse(
            new TextDecoder().decode(cardInfo?.cardJsonRepr)
          ) as fsrsCard)
        : null,
    [cardInfo]
  );

  const reviewLog = useMemo(
    () =>
      cardInfo
        ? (JSON.parse(
            new TextDecoder().decode(cardInfo?.reviewLog)
          ) as reviewLogItem[])
        : null,
    [cardInfo]
  );

  return (
    <>
      <Text mb="md">
        Enter an alphagram below to look it up in your WordVault:
      </Text>
      <Stack w={150} mb="xl">
        <TextInput
          label="Alphagram"
          value={lookup}
          onChange={(t) => setLookup(t.currentTarget.value.toLocaleUpperCase())}
        ></TextInput>
        <Button onClick={lookupAlphagram}>Look up</Button>
      </Stack>
      {cardInfo && fsrsCard && reviewLog && (
        <CardInfo
          cardInfo={cardInfo}
          fsrsCard={fsrsCard}
          reviewLog={reviewLog}
          alphagram={lookup}
        />
      )}
    </>
  );
};

type fsrsCard = {
  Due: string;
  Stability: number;
  Difficulty: number;
  Reps: number;
  Lapses: number;
  State: number;
  LastReview: string;
};

type reviewLogItem = {
  Rating: number;
  Review: string; // time
  State: number;
};

interface CardInfoProps {
  fsrsCard: fsrsCard;
  reviewLog: reviewLogItem[];
  alphagram: string;
  cardInfo: WordVaultCard;
}

const CardInfo: React.FC<CardInfoProps> = ({
  fsrsCard,
  reviewLog,
  cardInfo,
  alphagram,
}) => {
  const theme = useMantineTheme();

  const dstr = (datestr: string) =>
    `${new Date(datestr).toLocaleDateString()} ${new Date(
      datestr
    ).toLocaleTimeString()}`;

  const dueDate = dstr(fsrsCard.Due);
  const lastReview = dstr(fsrsCard.LastReview);

  const state = { 0: "New", 1: "Learning", 2: "Review", 3: "Relearning" }[
    fsrsCard.State
  ];

  return (
    <>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{
          maxWidth: 600,
          width: "100%",
          backgroundColor: theme.colors.dark[8],
        }}
      >
        <Stack align="center" gap="md">
          <Text size="xl" fw={700} ta="center">
            {alphagram.toUpperCase()}
          </Text>
          <List>
            <List.Item>Next due: {dueDate}</List.Item>
            <List.Item>Last seen: {lastReview}</List.Item>

            <List.Item>Number of times asked: {fsrsCard.Reps}</List.Item>
            <List.Item>Number of times missed: {fsrsCard.Lapses}</List.Item>

            <List.Item>Current state: {state}</List.Item>
          </List>
          <Text mb="md">FSRS values</Text>
          <IconHelp /> Stability: {fsrsCard.Stability}
          <IconHelp />
          Retrievability: {cardInfo.retrievability}
          <IconHelp />
          Difficulty: {fsrsCard.Difficulty}
        </Stack>
      </Card>
      <Text fw={700} mb="lg" mt="lg">
        Review History
      </Text>
      <Timeline bulletSize={24} lineWidth={2}>
        {reviewLog.map((rl) => {
          let bullet = null;
          switch (rl.Rating) {
            case 1:
              bullet = <IconX />;
              break;
            case 2:
              bullet = <IconAlertHexagon />;
              break;
            case 3:
              bullet = <IconCheck />;
              break;
            case 4:
              bullet = <IconBabyBottle />;
              break;
          }
          return (
            <Timeline.Item
              title={Score[rl.Rating]}
              key={rl.Review}
              bullet={bullet}
            >
              <Text size="xs">{dstr(rl.Review)}</Text>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </>
  );
};

export default CardStats;
