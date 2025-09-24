import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppContext } from "./app_context";
import { notifications } from "@mantine/notifications";
import { BarChart } from "@mantine/charts";
import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  NumberInput,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { getBrowserTimezone } from "./timezones";
import { useNavigate } from "react-router-dom";
import { useIsDecksEnabled } from "./use_is_decks_enabled";

type scheduleBreakdown = { [key: string]: number };
type DeckEntry = [bigint | null, scheduleBreakdown];

const COLOR_PALETTE = [
  "blue",
  "teal",
  "orange",
  "grape",
  "cyan",
  "red",
  "yellow",
  "violet",
  "green",
  "pink",
  "indigo",
  "lime",
];

const CardSchedule: React.FC = () => {
  const { lexicon, wordVaultClient, decksById } = useContext(AppContext);
  const [cardSchedule, setCardSchedule] = useState<scheduleBreakdown | null>(
    null
  );
  const [deckSchedules, setDeckSchedules] = useState<Map<
    bigint | null,
    scheduleBreakdown
  > | null>(null);
  const isDecksEnabled = useIsDecksEnabled();
  const [numCards, setNumCards] = useState(0);
  const [cardsToPostpone, setCardsToPostpone] = useState(0);
  const [postponeModalOpened, postponeModalHandlers] = useDisclosure();
  const [showLoader, setShowLoader] = useState(false);

  // Helpers
  const getDeckLabel = useCallback(
    (id: bigint | null) => {
      if (id === null) return "Default Deck";
      const deck = decksById.get(id as unknown as bigint);
      return deck?.name ?? "Default Deck";
    },
    [decksById]
  );

  const sortedDeckEntries: DeckEntry[] = useMemo(() => {
    if (!deckSchedules) return [];
    const entries = Array.from(deckSchedules.entries());
    entries.sort((a, b) => {
      if (a[0] === null) return -1;
      if (b[0] === null) return 1;
      const an = getDeckLabel(a[0]);
      const bn = getDeckLabel(b[0]);
      return an.localeCompare(bn);
    });
    return entries as DeckEntry[];
  }, [deckSchedules, getDeckLabel]);

  const parseLocalDate = useCallback((dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, []);

  const getLocalISODate = useCallback((date: Date) => {
    const localTimeOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - localTimeOffset);
    return localDate.toISOString().split("T")[0];
  }, []);

  const fetchDueQuestions = useCallback(async () => {
    if (!lexicon || !wordVaultClient) {
      return;
    }
    try {
      setShowLoader(true);
      const resp = await wordVaultClient.nextScheduledCountByDeck({
        lexicon,
        timezone: getBrowserTimezone(),
      });

      // Aggregate per-deck breakdowns into a single per-day breakdown
      const aggregated: scheduleBreakdown = {};
      const map = new Map<bigint | null, scheduleBreakdown>();
      for (const deckBreakdown of resp.breakdowns ?? []) {
        const deckId = deckBreakdown.deckId ?? null;
        const bd = (deckBreakdown.breakdown ?? {}) as scheduleBreakdown;
        map.set(deckId, bd);
        for (const [key, value] of Object.entries(bd)) {
          aggregated[key] = (aggregated[key] ?? 0) + (value ?? 0);
        }
      }

      setDeckSchedules(map);
      setCardSchedule(aggregated);
    } catch (e) {
      notifications.show({
        color: "red",
        title: "Error",
        message: String(e),
      });
    } finally {
      setShowLoader(false);
    }
  }, [lexicon, wordVaultClient]);

  useEffect(() => {
    fetchDueQuestions();
  }, [fetchDueQuestions]);

  const fetchTotalQuestions = useCallback(async () => {
    if (!lexicon || !wordVaultClient) {
      return;
    }
    try {
      setShowLoader(true);
      const resp = await wordVaultClient.getCardCount({});
      setNumCards(resp.numCards[lexicon] ?? 0);
    } catch (e) {
      notifications.show({
        color: "red",
        title: "Error",
        message: String(e),
      });
    } finally {
      setShowLoader(false);
    }
  }, [lexicon, wordVaultClient]);

  useEffect(() => {
    fetchTotalQuestions();
  }, [fetchTotalQuestions]);

  // Build stacked daily data per deck for next 30 days
  const { chartDataNext30Days, seriesNext30Days, totalOverdue } =
    useMemo(() => {
      if (sortedDeckEntries.length === 0) {
        return {
          chartDataNext30Days: [],
          seriesNext30Days: [],
          totalOverdue: 0,
        };
      }

      const deckEntries = sortedDeckEntries;

      const seriesNext30Days = deckEntries.map(([id], idx) => ({
        name: getDeckLabel(id),
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      }));

      const today = new Date();
      const chartDataNext30Days: Array<Record<string, number | string>> = [];

      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateString = getLocalISODate(currentDate);

        const row: Record<string, number | string> = { date: dateString };
        for (const [id, breakdown] of deckEntries) {
          const label = getDeckLabel(id);
          row[label] = breakdown[dateString] ?? 0;
        }
        chartDataNext30Days.push(row);
      }

      // Compute total overdue across decks
      let totalOverdue = 0;
      for (const [, breakdown] of deckEntries) {
        totalOverdue += breakdown["overdue"] ?? 0;
      }

      return { chartDataNext30Days, seriesNext30Days, totalOverdue };
    }, [sortedDeckEntries, getDeckLabel, getLocalISODate]);

  // Non-stacked daily data (single series) from aggregated schedule
  const chartDataNext30DaysSimple = useMemo(() => {
    if (!cardSchedule) return [];

    const result = [] as Array<{ date: string; "Card Count": number }>;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateString = getLocalISODate(currentDate);

      const count = cardSchedule[dateString] || 0;
      result.push({ date: dateString, "Card Count": count });
    }

    return result;
  }, [cardSchedule, getLocalISODate]);

  const chartDataWeekly = useMemo(() => {
    if (sortedDeckEntries.length === 0) return [];

    const deckEntries = sortedDeckEntries;

    // Gather all dates across decks (excluding 'overdue')
    const allDates: Date[] = [];
    for (const [, breakdown] of deckEntries) {
      for (const key of Object.keys(breakdown)) {
        if (key === "overdue") continue;
        allDates.push(parseLocalDate(key));
      }
    }

    if (allDates.length === 0) return [];

    allDates.sort((a, b) => a.getTime() - b.getTime());
    const earliestDate = allDates[0];
    const latestDate = allDates[allDates.length - 1];

    const startOfWeek = new Date(earliestDate);
    startOfWeek.setDate(earliestDate.getDate() - earliestDate.getDay());
    const endOfWeek = new Date(latestDate);
    endOfWeek.setDate(latestDate.getDate() + (6 - latestDate.getDay()));

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks =
      Math.floor((endOfWeek.getTime() - startOfWeek.getTime()) / oneWeekMs) + 1;

    const weeklyData: Array<Record<string, number | string>> = [];

    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(startOfWeek.getTime() + i * oneWeekMs);
      const weekEnd = new Date(weekStart.getTime() + oneWeekMs - 1);
      const weekLabel = `${weekStart.toISOString().split("T")[0]}`;

      const row: Record<string, number | string> = {
        week: `Week of ${weekLabel}`,
      };

      for (const [id, breakdown] of deckEntries) {
        const label = getDeckLabel(id);
        let sum = 0;
        for (const [dateStr, count] of Object.entries(breakdown)) {
          if (dateStr === "overdue") continue;
          const d = parseLocalDate(dateStr);
          if (d >= weekStart && d <= weekEnd) {
            sum += count ?? 0;
          }
        }
        row[label] = sum;
      }

      weeklyData.push(row);
    }

    return weeklyData;
  }, [sortedDeckEntries, getDeckLabel, parseLocalDate]);

  // Aggregated weekly data (single series) from aggregated schedule
  const chartDataWeeklySimple = useMemo(() => {
    if (!cardSchedule) return [];

    // Collect all dates from aggregated schedule (excluding 'overdue')

    const dateKeys = Object.keys(cardSchedule).filter((k) => k !== "overdue");
    if (dateKeys.length === 0) return [];

    const dates = dateKeys
      .map(parseLocalDate)
      .sort((a, b) => a.getTime() - b.getTime());

    const earliestDate = dates[0];
    const latestDate = dates[dates.length - 1];

    const startOfWeek = new Date(earliestDate);
    startOfWeek.setDate(earliestDate.getDate() - earliestDate.getDay());
    const endOfWeek = new Date(latestDate);
    endOfWeek.setDate(latestDate.getDate() + (6 - latestDate.getDay()));

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks =
      Math.floor((endOfWeek.getTime() - startOfWeek.getTime()) / oneWeekMs) + 1;

    const weeklyData: Array<{ week: string; "Card Count": number }> = [];

    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(startOfWeek.getTime() + i * oneWeekMs);
      const weekEnd = new Date(weekStart.getTime() + oneWeekMs - 1);
      const weekLabel = `${weekStart.toISOString().split("T")[0]}`;

      let sum = 0;
      for (const dateStr of dateKeys) {
        const d = parseLocalDate(dateStr);
        if (d >= weekStart && d <= weekEnd) {
          sum += cardSchedule[dateStr] ?? 0;
        }
      }

      weeklyData.push({ week: `Week of ${weekLabel}`, "Card Count": sum });
    }

    return weeklyData;
  }, [cardSchedule, parseLocalDate]);

  const sendPostponement = useCallback(async () => {
    if (!wordVaultClient) {
      return;
    }
    try {
      setShowLoader(true);
      const resp = await wordVaultClient.postpone({
        lexicon,
        numToPostpone: cardsToPostpone,
      });
      notifications.show({
        color: "green",
        message: `Postponed ${resp.numPostponed} cards.`,
      });
      postponeModalHandlers.close();
      // re-render graphs
      fetchDueQuestions();
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
    cardsToPostpone,
    lexicon,
    fetchDueQuestions,
    wordVaultClient,
    postponeModalHandlers,
  ]);

  const navigate = useNavigate();

  return (
    <div>
      {showLoader && <Loader type="bars"></Loader>}
      <Modal
        opened={postponeModalOpened}
        onClose={postponeModalHandlers.close}
        title="Postpone schedule"
      >
        <Text mb="xl">
          Sometimes life gets in the way and you have to postpone some cards.
          Note: You cannot postpone cards that you haven't seen at least once
          yet.
        </Text>
        <Text mb="xl" fw={700} c="red">
          This is not undoable. Make sure you want to postpone!
        </Text>
        <Stack>
          <NumberInput
            label="Cards to postpone"
            value={cardsToPostpone}
            min={0}
            max={totalOverdue || cardSchedule?.overdue}
            onChange={(v) => setCardsToPostpone(v as number)}
          />
          <Button color="pink" onClick={sendPostponement}>
            Postpone {cardsToPostpone} cards
          </Button>
        </Stack>
        {!isNaN(cardsToPostpone) && (
          <Text mt="xl">
            After postponement, you would have{" "}
            {Math.min(
              Math.max((cardSchedule?.overdue ?? 0) - cardsToPostpone, 0),
              cardSchedule?.overdue ?? 0
            )}{" "}
            cards due.{" "}
          </Text>
        )}
      </Modal>

      <>
        <Text mb="sm">
          You have {numCards} cards in lexicon {lexicon}.
        </Text>
        {totalOverdue || cardSchedule?.overdue ? (
          <div>
            <Text c="red" fw={700} mb="sm">
              Cards currently due:&nbsp;
              {totalOverdue || cardSchedule?.overdue}
            </Text>
            <Group gap="xl">
              <Button onClick={() => navigate("/load-scheduled-questions")}>
                Study
              </Button>
              <Button
                variant="light"
                color="red"
                onClick={postponeModalHandlers.open}
              >
                Postpone
              </Button>
            </Group>
          </div>
        ) : null}
      </>
      <Center mt="xl">
        <Text>Daily schedule (next 30 days)</Text>
      </Center>
      <BarChart
        h={300}
        data={isDecksEnabled ? chartDataNext30Days : chartDataNext30DaysSimple}
        dataKey="date"
        series={
          isDecksEnabled
            ? seriesNext30Days
            : [{ name: "Card Count", color: "blue" }]
        }
        tickLine="x"
        type={isDecksEnabled ? "stacked" : "default"}
      />

      <Center mt="xl">
        <Text>Weekly schedule</Text>
      </Center>

      <BarChart
        h={300}
        data={isDecksEnabled ? chartDataWeekly : chartDataWeeklySimple}
        dataKey="week"
        series={
          isDecksEnabled
            ? seriesNext30Days
            : [{ name: "Card Count", color: "blue" }]
        }
        tickLine="x"
        type={isDecksEnabled ? "stacked" : "default"}
      />
    </div>
  );
};

export default CardSchedule;
