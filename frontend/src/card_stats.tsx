import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppContext } from "./app_context";
import {
  Button,
  Card,
  Divider,
  Select,
  Group,
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
import { Alphagram } from "./gen/rpc/wordsearcher/searcher_pb";
import {
  IconAlertHexagon,
  IconBabyBottle,
  IconCheck,
  IconDatabaseImport,
  IconHelp,
  IconX,
} from "@tabler/icons-react";
import { BarChart, LineChart } from "@mantine/charts";
import { getBrowserTimezone } from "./timezones";
import { fsrsRecall, useFsrsVersion } from "./fsrs_version";
import ReviewHeatmap from "./review_heatmap";
import { LeechBadge } from "./leech";

const COLOR_PALETTE = [
  "blue.6",
  "teal.6",
  "orange.6",
  "grape.6",
  "cyan.6",
  "red.6",
  "yellow.6",
  "violet.6",
  "green.6",
  "pink.6",
  "indigo.6",
  "lime.6",
];

const ALL_DECKS_OPTION_VALUE = "ALL";
const DEFAULT_DECK_OPTION_VALUE = "DEFAULT";

const CardStats: React.FC = () => {
  const { lexicon, jwt, wordVaultClient, wordServerClient, decksById } =
    useContext(AppContext);
  const [lookup, setLookup] = useState("");
  const [todayStats, setTodayStats] = useState<{
    [key: string]: number;
  }>({});
  const [deckProgressStats, setDeckProgressStats] =
    useState<Map<bigint | null, { [key: string]: number }>>();
  const [aggregatedStats, setAggregatedStats] = useState<{
    [key: string]: number;
  }>({});

  const [cardInfo, setCardInfo] = useState<WordVaultCard | null>(null);
  // Probability and words for the looked-up card, if the expansion worked.
  const [expanded, setExpanded] = useState<Alphagram | null>(null);

  // Default deck has null ID, so indicate no selected deck with a separate
  // bool
  const [allDecksSelected, setAllDecksSelected] = useState<boolean>(true);
  const [selectedDeckId, setSelectedDeckId] = useState<bigint | null>(null);

  const EMPTY_STATS: { [key: string]: number } = useMemo(
    () => ({
      New: 0,
      Reviewed: 0,
      NewMissed: 0,
      ReviewedMissed: 0,
      NewHard: 0,
      ReviewedHard: 0,
      NewGood: 0,
      ReviewedGood: 0,
      NewEasy: 0,
      ReviewedEasy: 0,
      Repeats: 0,
    }),
    []
  );

  const fetchTodayStats = useCallback(async () => {
    if (!wordVaultClient) {
      return;
    }
    try {
      const resp = await wordVaultClient.getDailyProgressByDeck({
        timezone: getBrowserTimezone(),
      });

      const byDeck = new Map<bigint | null, { [key: string]: number }>();
      const aggregated: { [key: string]: number } = {};

      for (const item of resp.items ?? []) {
        const deckId: bigint | null = item.deckId ?? null;
        const stats = (item.progressStats ?? {}) as { [key: string]: number };
        byDeck.set(deckId, stats);
        for (const [k, v] of Object.entries(stats)) {
          aggregated[k] = (aggregated[k] ?? 0) + (v ?? 0);
        }
      }
      if ((resp.items?.length ?? 0) === 0) {
        setDeckProgressStats(new Map());
        setAggregatedStats({ ...EMPTY_STATS });
        return;
      }
      setDeckProgressStats(byDeck);
      setAggregatedStats(aggregated);
    } catch (e) {
      notifications.show({
        color: "red",
        message: String(e),
      });
    }
  }, [wordVaultClient, EMPTY_STATS]);

  useEffect(() => {
    if (!jwt) {
      return;
    }
    fetchTodayStats();
  }, [fetchTodayStats, jwt]);

  const getDeckLabel = useCallback(
    (id: bigint | null): string => {
      if (id === null || !decksById || !decksById.has(id))
        return "Default Deck";
      return decksById.get(id)!.name;
    },
    [decksById]
  );

  // Build Select options when decks are enabled
  const deckOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: ALL_DECKS_OPTION_VALUE, label: "All decks" },
    ];

    const idSet = new Set<bigint | null>();
    idSet.add(null);
    for (const id of decksById.keys()) idSet.add(id);
    for (const id of deckProgressStats?.keys() ?? []) idSet.add(id);

    const entries = Array.from(idSet.values());
    entries.sort((a, b) => {
      if (a === null && b !== null) return -1;
      if (a !== null && b === null) return 1;
      if (a === null && b === null) return 0;
      const an = getDeckLabel(a as bigint);
      const bn = getDeckLabel(b as bigint);
      return an.localeCompare(bn);
    });

    for (const id of entries) {
      if (id === null) {
        opts.push({ value: "DEFAULT", label: "Default Deck" });
      } else {
        const label = decksById.get(id)?.name ?? `Deck ${id.toString()}`;
        opts.push({ value: id.toString(), label });
      }
    }
    return opts;
  }, [deckProgressStats, decksById, getDeckLabel]);

  // Update the displayed stats based on the selected deck
  useEffect(() => {
    if (!deckProgressStats) return;
    if (allDecksSelected) {
      setTodayStats(
        Object.keys(aggregatedStats).length ? aggregatedStats : EMPTY_STATS
      );
      return;
    }
    if (!selectedDeckId || selectedDeckId === null) {
      setTodayStats(deckProgressStats.get(null) ?? { ...EMPTY_STATS });
      return;
    }

    const id = selectedDeckId;
    setTodayStats(deckProgressStats.get(id) ?? { ...EMPTY_STATS });
  }, [
    allDecksSelected,
    selectedDeckId,
    deckProgressStats,
    aggregatedStats,
    EMPTY_STATS,
  ]);

  // Build per-deck rating breakdown for "All decks"
  const deckIdsForBreakdown = useMemo(() => {
    const idSet = new Set<bigint | null>();
    idSet.add(null);
    for (const id of decksById.keys()) idSet.add(id);
    for (const id of deckProgressStats?.keys() ?? []) idSet.add(id);
    return Array.from(idSet.values());
  }, [decksById, deckProgressStats]);

  const {
    deckBreakdownChartData,
    deckBreakdownSeries,
  }: {
    deckBreakdownChartData: Array<Record<string, number | string>>;
    deckBreakdownSeries: { name: string; color: string }[];
  } = useMemo(() => {
    if (!allDecksSelected || (deckIdsForBreakdown?.length ?? 0) <= 1) {
      return { deckBreakdownChartData: [], deckBreakdownSeries: [] };
    }

    const sortedIds = [...deckIdsForBreakdown].sort((a, b) => {
      if (a === null && b !== null) return -1;
      if (a !== null && b === null) return 1;
      if (a === null && b === null) return 0;
      const an = getDeckLabel(a as bigint);
      const bn = getDeckLabel(b as bigint);
      return an.localeCompare(bn);
    });

    const rows: Array<Record<string, number | string>> = [];
    const ratingKeys = ["Missed", "Hard", "Good", "Easy"] as const;
    const series: { name: string; color: string }[] = [];

    sortedIds.forEach((id, idx) => {
      series.push({
        name: getDeckLabel(id as bigint | null),
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      });
    });

    for (const rating of ratingKeys) {
      const row: Record<string, number | string> = { rating };
      for (const id of sortedIds) {
        const stats = (deckProgressStats?.get(id ?? null) ?? EMPTY_STATS) as {
          [key: string]: number;
        };
        const val =
          (stats[`New${rating}`] ?? 0) + (stats[`Reviewed${rating}`] ?? 0);
        row[getDeckLabel(id as bigint | null)] = val;
      }
      rows.push(row);
    }

    return { deckBreakdownChartData: rows, deckBreakdownSeries: series };
  }, [
    allDecksSelected,
    deckIdsForBreakdown,
    deckProgressStats,
    getDeckLabel,
    EMPTY_STATS,
  ]);

  const lookupAlphagram = useCallback(async () => {
    if (!wordVaultClient) {
      return;
    }
    try {
      const resp = await wordVaultClient.getCardInformation({
        lexicon,
        alphagrams: [lookup],
      });
      if (resp.cards.length === 0) {
        throw new Error("No card found");
      }
      setCardInfo(resp.cards[0]);
      setExpanded(null);
      const alphagram = resp.cards[0].alphagram?.alphagram;
      if (wordServerClient && alphagram) {
        wordServerClient
          .expand({ lexicon, alphagrams: [{ alphagram }] })
          .then((r) => setExpanded(r.alphagrams[0] ?? null))
          .catch((e) => console.error("Error expanding alphagram:", e));
      }
    } catch (e) {
      notifications.show({
        color: "red",
        message: String(e),
      });
    }
  }, [lexicon, lookup, wordVaultClient, wordServerClient]);

  // E.g. after missing the word in a tournament: schedule it as a miss now.
  const markMissed = useCallback(async () => {
    const alphagram = cardInfo?.alphagram?.alphagram;
    if (!wordVaultClient || !alphagram) {
      return;
    }
    try {
      await wordVaultClient.scoreCard({
        lexicon,
        alphagram,
        score: Score.AGAIN,
      });
      notifications.show({
        color: "green",
        message: `Marked ${alphagram.toUpperCase()} as missed. You'll see it again soon.`,
      });
      await lookupAlphagram();
    } catch (e) {
      notifications.show({
        color: "red",
        message: String(e),
      });
    }
  }, [cardInfo, lexicon, wordVaultClient, lookupAlphagram]);

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
      {deckOptions.length > 0 && (
        <Stack w={300} mb="sm">
          <Select
            label="Deck"
            value={selectedDeckId?.toString() ?? ALL_DECKS_OPTION_VALUE}
            onChange={(val) => {
              if (val === ALL_DECKS_OPTION_VALUE || !val) {
                setAllDecksSelected(true);
                setSelectedDeckId(null);
              } else if (val === DEFAULT_DECK_OPTION_VALUE) {
                setAllDecksSelected(false);
                setSelectedDeckId(null);
              } else {
                setAllDecksSelected(false);
                setSelectedDeckId(BigInt(val));
              }
            }}
            data={deckOptions}
            renderOption={({ option }) => {
              let studied = 0;
              if (option.value === "ALL") {
                studied =
                  (aggregatedStats.New ?? 0) + (aggregatedStats.Reviewed ?? 0);
              } else {
                const id =
                  option.value === "DEFAULT" ? null : BigInt(option.value);
                const s = deckProgressStats?.get(id ?? null) ?? EMPTY_STATS;
                studied = (s.New ?? 0) + (s.Reviewed ?? 0);
              }
              return (
                <Group>
                  <Text>
                    {option.label}
                    <Text size="sm" c="dimmed">
                      ({studied} studied today)
                    </Text>
                  </Text>
                </Group>
              );
            }}
          />
        </Stack>
      )}
      <TodayStats
        stats={Object.keys(todayStats).length ? todayStats : EMPTY_STATS}
      />

      {allDecksSelected && deckBreakdownSeries.length > 1 && (
        <>
          <Text mt="lg" fw={700}>
            Today's answers by deck
          </Text>
          <BarChart
            h={300}
            maw={1000}
            orientation="vertical"
            mt="lg"
            data={deckBreakdownChartData}
            dataKey="rating"
            series={deckBreakdownSeries}
            tickLine="x"
          />
        </>
      )}

      <Divider m="lg" />
      <Text mb="md">
        Enter a word or alphagram below to look it up in your WordVault:
      </Text>
      <Stack w={200} mb="xl">
        <TextInput
          label="Alphagram"
          value={lookup}
          size="lg"
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
          expanded={expanded}
          onMarkMissed={markMissed}
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

type importLog = {
  ImportedDate: string;
  CardboxAtImport: number;
};

type reviewLogItem = {
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

const CardInfo: React.FC<CardInfoProps> = ({
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
                Number of times forgotten:{" "}
                <Text component="span" fw={500}>
                  {fsrsCard.Lapses}
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

interface TodayStatsProps {
  stats: { [key: string]: number };
}

const TodayStats: React.FC<TodayStatsProps> = ({ stats }) => {
  return (
    <Stack gap="md">
      <Text>
        New cards today:
        <Text c="dimmed">
          {stats.New}{" "}
          {stats.New > 0
            ? `(Get rate: ${(
                ((stats.New - stats.NewMissed) / stats.New) *
                100
              ).toFixed(2)}%)`
            : ""}{" "}
        </Text>
      </Text>
      <Text>
        Reviewed cards today:
        <Text c="dimmed">
          {stats.Reviewed}{" "}
          {stats.Reviewed > 0
            ? `(Recall rate: ${(
                ((stats.Reviewed - stats.ReviewedMissed) / stats.Reviewed) *
                100
              ).toFixed(2)}%)`
            : ""}
        </Text>
      </Text>
      {stats.Repeats > 0 && (
        <Text>
          Repeat reviews today:
          <Text c="dimmed">
            {stats.Repeats} (cards seen again the same day, like after a
            miss; the rates above only count each card's first try)
          </Text>
        </Text>
      )}
      <Text>Score breakdown</Text>
      <BarChart
        h={300}
        maw={1000}
        orientation="vertical"
        mt="lg"
        data={[
          {
            rating: "Missed",
            "New Cards": stats["NewMissed"],
            "Reviewed Cards": stats["ReviewedMissed"],
          },
          {
            rating: "Hard",
            "New Cards": stats["NewHard"],
            "Reviewed Cards": stats["ReviewedHard"],
          },
          {
            rating: "Good",
            "New Cards": stats["NewGood"],
            "Reviewed Cards": stats["ReviewedGood"],
          },
          {
            rating: "Easy",
            "New Cards": stats["NewEasy"],
            "Reviewed Cards": stats["ReviewedEasy"],
          },
        ]}
        dataKey="rating"
        series={[
          { name: "New Cards", color: "violet.6" },
          { name: "Reviewed Cards", color: "blue.6" },
        ]}
        tickLine="x"
      />
    </Stack>
  );
};

export default CardStats;
