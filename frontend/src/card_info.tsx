import React, { useMemo } from "react";
import {
  Button,
  Card,
  List,
  Stack,
  Text,
  Timeline,
  Tooltip,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { Score, Card as WordVaultCard } from "./gen/rpc/wordvault/api_pb";
import { Alphagram } from "./gen/rpc/wordsearcher/searcher_pb";
import {
  IconAlertHexagon,
  IconBabyBottle,
  IconCheck,
  IconDatabaseImport,
  IconHelp,
  IconX,
} from "@tabler/icons-react";
import { LineChart } from "@mantine/charts";
import { fsrsRecall, useFsrsVersion } from "./fsrs_version";
import ReviewHeatmap from "./review_heatmap";
import { LeechBadge } from "./leech";

export type fsrsCard = {
  Due: string;
  Stability: number;
  Difficulty: number;
  Reps: number;
  Lapses: number;
  State: number;
  LastReview: string;
};

type importLog = {
  ImportedDate: string;
  CardboxAtImport: number;
};

export type reviewLogItem = {
  Rating: number;
  Review: string; // time
  State: number;
  ImportLog: importLog;
};

interface CardInfoProps {
  fsrsCard: fsrsCard;
  reviewLog: reviewLogItem[];
  cardInfo: WordVaultCard;
  expanded: Alphagram | null;
  onMarkMissed: () => void;
}

export const CardInfo: React.FC<CardInfoProps> = ({
  fsrsCard,
  reviewLog,
  cardInfo,
  expanded,
  onMarkMissed,
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
  // Every Again rating. FSRS's Lapses only counts misses of cards in the
  // Review state, not of new cards or during (re)learning steps.
  const timesMissed = reviewLog.filter(
    (rl) => !rl.ImportLog && rl.Rating === Score.AGAIN,
  ).length;

  const [fsrsVersion] = useFsrsVersion();

  const forgettingCurve = useMemo(() => {
    if (fsrsVersion === null) {
      return [];
    }
    const curve = [];
    const today = new Date();
    // Recall depends on the time since the last review, so the curve starts
    // at today's retrievability.
    const elapsedToday = Math.max(
      (today.getTime() - new Date(fsrsCard.LastReview).getTime()) / 86400000,
      0,
    );
    for (let i = 0; i < 365; i++) {
      curve.push({
        Recall:
          fsrsRecall(fsrsVersion, fsrsCard.Stability, elapsedToday + i) * 100,
        date: new Date(today.getTime() + 86400000 * i).toLocaleDateString(),
      });
    }
    return curve;
  }, [fsrsCard.Stability, fsrsCard.LastReview, fsrsVersion]);

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
          <LeechBadge lapses={fsrsCard.Lapses} />
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
                Number of times missed:{" "}
                <Text component="span" fw={500}>
                  {timesMissed}
                </Text>
              </Text>
            </List.Item>
            {expanded && expanded.probability > 0 && (
              <List.Item>
                <Text c={isDark ? theme.colors.gray[4] : theme.colors.gray[9]}>
                  Probability:{" "}
                  <Text component="span" fw={500}>
                    #{expanded.probability}
                  </Text>
                </Text>
              </List.Item>
            )}
            {expanded && expanded.difficulty > 0 && (
              <List.Item>
                <Text c={isDark ? theme.colors.gray[4] : theme.colors.gray[9]}>
                  <Tooltip
                    multiline
                    w={350}
                    withArrow
                    label="How hard this bingo is for players in general, compared with other 7s and 8s: 1 is easiest, 100 is hardest. Not the same as FSRS difficulty below, which is about you."
                  >
                    <IconHelp
                      size={16}
                      style={{ marginRight: 6, marginBottom: -3 }}
                    />
                  </Tooltip>
                  Aerolith difficulty:{" "}
                  <Text
                    component="span"
                    fw={500}
                    c={expanded.difficulty > 80 ? "red" : undefined}
                  >
                    {expanded.difficulty}/100
                  </Text>
                </Text>
              </List.Item>
            )}
            {expanded && expanded.words.length > 0 && (
              <List.Item>
                <Text c={isDark ? theme.colors.gray[4] : theme.colors.gray[9]}>
                  Words:{" "}
                  <Text component="span" fw={500}>
                    {expanded.words.map((w) => w.word).join(", ")}
                  </Text>
                </Text>
              </List.Item>
            )}
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

          <Tooltip
            multiline
            w={300}
            withArrow
            label="Score this card as missed right now, e.g. if you missed the word in a game. It goes back into relearning."
          >
            <Button variant="light" color="red" onClick={onMarkMissed}>
              Mark as missed
            </Button>
          </Tooltip>
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

      <ReviewHeatmap reviewLog={reviewLog} />

      <Text fw={700} mb="lg" mt="lg" size="md">
        All reviews
      </Text>

      <Timeline
        bulletSize={24}
        lineWidth={2}
        active={reviewLog.length}
        color="blue"
      >
        {reviewLog.map((rl) => {
          let bullet = null;

          if (rl.ImportLog) {
            bullet = <IconDatabaseImport color={theme.colors.yellow[3]} />;
            return (
              <Timeline.Item title="Imported" key="import" bullet={bullet}>
                <Text size="xs" c={theme.colors.gray[6]}>
                  {`${dstr(rl.ImportLog.ImportedDate, true)} from cardbox ${
                    rl.ImportLog.CardboxAtImport
                  }`}
                </Text>
              </Timeline.Item>
            );
          } else {
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
          }
        })}
      </Timeline>
    </>
  );
};

