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
  Divider,
  Select,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { BarChart } from "@mantine/charts";
import { getBrowserTimezone } from "./timezones";
import { CardInfo } from "./card_info";
import { useCardLookup } from "./use_card_lookup";

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
  const { jwt, wordVaultClient, decksById } = useContext(AppContext);
  const [lookup, setLookup] = useState("");
  const [todayStats, setTodayStats] = useState<{
    [key: string]: number;
  }>({});
  const [deckProgressStats, setDeckProgressStats] =
    useState<Map<bigint | null, { [key: string]: number }>>();
  const [aggregatedStats, setAggregatedStats] = useState<{
    [key: string]: number;
  }>({});

  const { cardInfo, expanded, fsrsCard, reviewLog, lookupAlphagram, markMissed } =
    useCardLookup();

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
        <Button onClick={() => lookupAlphagram(lookup)}>Look up</Button>
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
