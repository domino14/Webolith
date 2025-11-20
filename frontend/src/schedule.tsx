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

type scheduleBreakdown = { [key: string]: number };

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

const DAYS_TO_SHOW_FOR_DAILY_SCHEDULE = 30;

// Module-scoped date helpers
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getLocalISODate(date: Date): string {
  const localTimeOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - localTimeOffset);
  return localDate.toISOString().split("T")[0];
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return start;
}

function getEndOfWeek(date: Date): Date {
  const end = new Date(date);
  end.setDate(date.getDate() + (6 - date.getDay()));
  return end;
}

function getWeeklyRangeForDates(
  dates: Date[]
): { startOfWeek: Date; totalWeeks: number; oneWeekMs: number } | null {
  if (!dates || dates.length === 0) return null;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const earliestDate = sorted[0];
  const latestDate = sorted[sorted.length - 1];

  const startOfWeek = getStartOfWeek(earliestDate);
  const endOfWeek = getEndOfWeek(latestDate);

  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks =
    Math.floor((endOfWeek.getTime() - startOfWeek.getTime()) / oneWeekMs) + 1;

  return { startOfWeek, totalWeeks, oneWeekMs };
}

function buildWeekRanges(
  startOfWeek: Date,
  totalWeeks: number,
  oneWeekMs: number
): Array<{ weekStart: Date; weekEnd: Date; label: string }> {
  const ranges: Array<{ weekStart: Date; weekEnd: Date; label: string }> = [];
  for (let i = 0; i < totalWeeks; i++) {
    const weekStart = new Date(startOfWeek.getTime() + i * oneWeekMs);
    const weekEnd = new Date(weekStart.getTime() + oneWeekMs - 1);
    const weekLabel = `${weekStart.toISOString().split("T")[0]}`;
    ranges.push({ weekStart, weekEnd, label: `Week of ${weekLabel}` });
  }
  return ranges;
}

function forEachDateStringInNextNDays(
  n: number,
  callback: (dateString: string) => void
) {
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    const dateString = getLocalISODate(currentDate);
    callback(dateString);
  }
}

const CardSchedule: React.FC = () => {
  const { lexicon, wordVaultClient, decksById } = useContext(AppContext);
  const [cardSchedule, setCardSchedule] = useState<scheduleBreakdown | null>(
    null
  );
  const [deckSchedules, setDeckSchedules] = useState<Map<
    bigint | null,
    scheduleBreakdown
  > | null>(null);
  const [numCards, setNumCards] = useState(0);
  const [cardsToPostpone, setCardsToPostpone] = useState(0);
  const [postponeModalOpened, postponeModalHandlers] = useDisclosure();
  const [showLoader, setShowLoader] = useState(false);

  // Helpers
  const getDeckLabel = useCallback(
    (id: bigint | null) => {
      if (id === null || !decksById || !decksById.has(id))
        return "Default Deck";
      return decksById.get(id)!.name;
    },
    [decksById]
  );

  const sortedDeckEntries: [bigint | null, scheduleBreakdown][] =
    useMemo(() => {
      if (!deckSchedules) return [];
      const entries = Array.from(deckSchedules.entries());
      entries.sort(([aId], [bId]) => {
        if (aId === null) return -1;
        if (bId === null) return 1;

        const an = getDeckLabel(aId);
        const bn = getDeckLabel(bId);

        return an.localeCompare(bn);
      });
      return entries;
    }, [deckSchedules, getDeckLabel]);

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
      const breakdownsByDeckId = new Map<bigint | null, scheduleBreakdown>();

      for (const deckBreakdown of resp.breakdowns ?? []) {
        const deckId = deckBreakdown.deckId ?? null;
        const breakdown = (deckBreakdown.breakdown ?? {}) as scheduleBreakdown;
        breakdownsByDeckId.set(deckId, breakdown);

        for (const [date, countForDateAndDeck] of Object.entries(breakdown)) {
          aggregated[date] =
            (aggregated[date] ?? 0) + (countForDateAndDeck ?? 0);
        }
      }

      setDeckSchedules(breakdownsByDeckId);
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

      const seriesNext30Days = sortedDeckEntries.map(([id], idx) => ({
        name: getDeckLabel(id),
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      }));

      const chartDataNext30Days: Array<Record<string, number | string>> = [];

      forEachDateStringInNextNDays(
        DAYS_TO_SHOW_FOR_DAILY_SCHEDULE,
        (dateString) => {
          const row: Record<string, number | string> = { date: dateString };
          for (const [id, breakdown] of sortedDeckEntries) {
            const label = getDeckLabel(id);
            row[label] = breakdown[dateString] ?? 0;
          }
          chartDataNext30Days.push(row);
        }
      );

      // Compute total overdue across decks
      let totalOverdue = 0;
      for (const [, breakdown] of sortedDeckEntries) {
        totalOverdue += breakdown["overdue"] ?? 0;
      }

      return { chartDataNext30Days, seriesNext30Days, totalOverdue };
    }, [sortedDeckEntries, getDeckLabel]);

  const chartDataWeekly = useMemo(() => {
    if (sortedDeckEntries.length === 0) return [];

    // Gather all dates across decks (excluding 'overdue')
    const allDates: Date[] = [];
    for (const [, breakdown] of sortedDeckEntries) {
      for (const key of Object.keys(breakdown)) {
        if (key === "overdue") continue;
        allDates.push(parseLocalDate(key));
      }
    }

    const range = getWeeklyRangeForDates(allDates);
    if (!range) return [];

    const ranges = buildWeekRanges(
      range.startOfWeek,
      range.totalWeeks,
      range.oneWeekMs
    );
    const weeklyData: Array<Record<string, number | string>> = [];

    for (const { weekStart, weekEnd, label } of ranges) {
      const row: Record<string, number | string> = { week: label };

      for (const [id, breakdown] of sortedDeckEntries) {
        const deckLabel = getDeckLabel(id);
        let sum = 0;
        for (const [dateStr, count] of Object.entries(breakdown)) {
          if (dateStr === "overdue") continue;
          const d = parseLocalDate(dateStr);
          if (d >= weekStart && d <= weekEnd) {
            sum += count ?? 0;
          }
        }
        row[deckLabel] = sum;
      }

      weeklyData.push(row);
    }

    return weeklyData;
  }, [sortedDeckEntries, getDeckLabel]);

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
        data={chartDataNext30Days}
        dataKey="date"
        series={seriesNext30Days}
        tickLine="x"
        type="stacked"
      />

      <Center mt="xl">
        <Text>Weekly schedule</Text>
      </Center>

      <BarChart
        h={300}
        data={chartDataWeekly}
        dataKey="week"
        series={seriesNext30Days}
        tickLine="x"
        type="stacked"
      />
    </div>
  );
};

export default CardSchedule;
