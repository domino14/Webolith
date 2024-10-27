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
  Tooltip,
  useMantineColorScheme,
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
import { LineChart } from "@mantine/charts";

const CardStats: React.FC = () => {
  const { lexicon } = useContext(AppContext);
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
  }, [lexicon, lookup, wordvaultClient]);

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
        Enter a word or alphagram below to look it up in your WordVault:
      </Text>
      <Stack w={200} mb="xl">
        <TextInput
          label="Alphagram"
          value={lookup}
          onChange={(t) =>
            setLookup(
              t.currentTarget.value
                .toLocaleUpperCase()
                .split("")
                .sort()
                .join("")
            )
          }
        ></TextInput>
        <Button onClick={lookupAlphagram}>Look up</Button>
      </Stack>
      {cardInfo && fsrsCard && reviewLog && (
        <CardInfo
          cardInfo={cardInfo}
          fsrsCard={fsrsCard}
          reviewLog={reviewLog}
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
  cardInfo: WordVaultCard;
}

const CardInfo: React.FC<CardInfoProps> = ({
  fsrsCard,
  reviewLog,
  cardInfo,
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const dstr = (datestr: string, showTime?: boolean) =>
    `${new Date(datestr).toLocaleDateString()}${
      showTime ? " " + new Date(datestr).toLocaleTimeString() : ""
    }`;

  const dueDate = dstr(fsrsCard.Due, true);
  const lastReview = dstr(fsrsCard.LastReview, true);

  const forgettingCurve = useMemo(() => {
    // return math.Pow(1+factor*elapsedDays/stability, decay)
    // 	var Decay = -0.5
    // var Factor = math.Pow(0.9, 1/Decay) - 1
    const curve = [];
    const today = new Date();

    // Get these from FSRS parameters once we make that configurable, if ever.
    const decay = -0.5;
    const factor = Math.pow(0.9, 1 / decay) - 1;
    for (let i = 0; i < 365; i++) {
      curve.push({
        Recall: Math.pow(1 + (factor * i) / fsrsCard.Stability, decay) * 100,
        date: new Date(today.getTime() + 86400000 * i).toLocaleDateString(),
      });
    }
    return curve;
  }, [fsrsCard.Stability]);

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
          backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.gray[1],
        }}
      >
        <Stack align="center" gap="md">
          <Text size="xl" fw={700} ta="center" c={theme.colors.blue[4]}>
            {cardInfo.alphagram?.alphagram.toUpperCase()}
          </Text>
          <List spacing="xs" withPadding>
            <List.Item>
              <Text c={isDark ? theme.colors.gray[4] : theme.colors.gray[9]}>
                Next due:{" "}
                <Text component="span" fw={500}>
                  {dueDate}
                </Text>
              </Text>
            </List.Item>
            <List.Item>
              <Text c={isDark ? theme.colors.gray[4] : theme.colors.gray[9]}>
                Last seen:{" "}
                <Text component="span" fw={500}>
                  {lastReview}
                </Text>
              </Text>
            </List.Item>
            <List.Item>
              <Text c={isDark ? theme.colors.gray[4] : theme.colors.gray[9]}>
                Number of times asked:{" "}
                <Text component="span" fw={500}>
                  {fsrsCard.Reps}
                </Text>
              </Text>
            </List.Item>
            <List.Item>
              <Text c={isDark ? theme.colors.gray[4] : theme.colors.gray[9]}>
                Number of times forgotten:{" "}
                <Text component="span" fw={500}>
                  {fsrsCard.Lapses}
                </Text>
              </Text>
            </List.Item>
          </List>

          <Text size="lg" fw={700} mt="md" c={theme.colors.blue[4]}>
            FSRS values
          </Text>

          <Stack gap="xs">
            <Text>
              <Tooltip
                multiline
                w={450}
                label="Stability refers to how long you can retain a word before needing a review. Specifically, it is the time, in days, required for Retrievability to decrease from 100% to 90%. "
                withArrow
                events={{ hover: true, focus: false, touch: true }}
              >
                <IconHelp
                  size={18}
                  style={{ marginRight: 8, marginBottom: -3 }}
                />
              </Tooltip>
              Stability:{" "}
              <Text component="span" fw={500}>
                {fsrsCard.Stability.toFixed(2)}
              </Text>
            </Text>

            <Text>
              <Tooltip
                multiline
                w={450}
                label="Retrievability is the probability that you can recall this alphagram at this given time. This value decreases with time."
                withArrow
              >
                <IconHelp
                  size={18}
                  style={{ marginRight: 8, marginBottom: -3 }}
                />
              </Tooltip>
              Retrievability:{" "}
              <Text component="span" fw={500}>
                {(cardInfo.retrievability * 100).toFixed(2)}%
              </Text>
            </Text>

            <Text>
              <Tooltip
                multiline
                w={450}
                label="Difficulty estimates how hard it is for you to remember the alphagram. It is a number between 0 and 10."
                withArrow
              >
                <IconHelp
                  size={18}
                  style={{ marginRight: 8, marginBottom: -3 }}
                />
              </Tooltip>
              Difficulty:{" "}
              <Text component="span" fw={500}>
                {fsrsCard.Difficulty.toFixed(2)}
              </Text>
            </Text>
          </Stack>
        </Stack>
      </Card>

      <Text size="lg" fw={700} mt="md" c={theme.colors.blue[4]} m="sm">
        Forgetting Curve
      </Text>
      <Text size="sm">
        This is your predicted recall of this card, as a percentage, plotted vs
        time. This assumes you would never see the card again, which is
        hopefully not the case.
      </Text>
      <LineChart
        m="md"
        pr="xl"
        h={350}
        data={forgettingCurve}
        dataKey="date"
        yAxisLabel="Recall"
        series={[{ name: "Recall", color: "blue" }]}
        referenceLines={[{ x: dstr(fsrsCard.Due), label: "Next review" }]}
        yAxisProps={{ domain: [0, 100] }}
        unit="%"
        withDots={false}
        valueFormatter={(value: number) => value.toFixed(1)}
        tickLine="x"
      />

      <Text fw={700} mb="lg" mt="lg" size="lg" c={theme.colors.blue[4]}>
        Review History
      </Text>

      <Timeline
        bulletSize={24}
        lineWidth={2}
        active={reviewLog.length}
        color="blue"
      >
        {reviewLog.map((rl) => {
          let bullet = null;
          switch (rl.Rating) {
            case 1:
              bullet = <IconX color={theme.colors.red[6]} />;
              break;
            case 2:
              bullet = <IconAlertHexagon color={theme.colors.yellow[6]} />;
              break;
            case 3:
              bullet = <IconCheck color={theme.colors.green[6]} />;
              break;
            case 4:
              bullet = <IconBabyBottle color={theme.colors.pink[6]} />;
              break;
          }

          return (
            <Timeline.Item
              title={Score[rl.Rating]}
              key={rl.Review}
              bullet={bullet}
            >
              <Text size="xs" c={theme.colors.gray[6]}>
                {dstr(rl.Review, true)}
              </Text>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </>
  );
};

export default CardStats;
