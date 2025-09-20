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
      if (!deckSchedules) {
        return {
          chartDataNext30Days: [],
          seriesNext30Days: [],
          totalOverdue: 0,
        };
      }

      const colorPalette = [
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

      const getDeckLabel = (id: bigint | null) => {
        if (id === null) return "Default Deck";
        const deck = decksById.get(id as unknown as bigint);
        return deck?.name ?? "Default Deck";
      };

      // Determine deck order: Default first, then others by name
      const deckEntries = Array.from(deckSchedules.entries());
      deckEntries.sort((a, b) => {
        if (a[0] === null) return -1;
        if (b[0] === null) return 1;
        const an = getDeckLabel(a[0]);
        const bn = getDeckLabel(b[0]);
        return an.localeCompare(bn);
      });

      const seriesNext30Days = deckEntries.map(([id], idx) => ({
        name: getDeckLabel(id),
        color: colorPalette[idx % colorPalette.length],
      }));

      const today = new Date();
      const localTimeOffset = today.getTimezoneOffset() * 60000;
      const chartDataNext30Days: Array<Record<string, number | string>> = [];

      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const localDate = new Date(currentDate.getTime() - localTimeOffset);
        const dateString = localDate.toISOString().split("T")[0];

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
    }, [deckSchedules, decksById]);

  // Non-stacked daily data (single series) from aggregated schedule
  const chartDataNext30DaysSimple = useMemo(() => {
    if (!cardSchedule) return [];

    const result = [] as Array<{ date: string; "Card Count": number }>;
    const today = new Date();
    const localTimeOffset = today.getTimezoneOffset() * 60000;

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const localDate = new Date(currentDate.getTime() - localTimeOffset);
      const dateString = localDate.toISOString().split("T")[0];

      const count = cardSchedule[dateString] || 0;
      result.push({ date: dateString, "Card Count": count });
    }

    return result;
  }, [cardSchedule]);

  const chartDataWeekly = useMemo(() => {
    if (!deckSchedules) return [];

    const getDeckLabel = (id: bigint | null) => {
      if (id === null) return "Default Deck";
      const deck = decksById.get(id as unknown as bigint);
      return deck?.name ?? `Deck ${id.toString()}`;
    };

    // Sort decks consistently with daily
    const deckEntries = Array.from(deckSchedules.entries());
    deckEntries.sort((a, b) => {
      if (a[0] === null) return -1;
      if (b[0] === null) return 1;
      const an = getDeckLabel(a[0]);
      const bn = getDeckLabel(b[0]);
      return an.localeCompare(bn);
    });

    // Gather all dates across decks (excluding 'overdue')
    const allDates: Date[] = [];
    const toLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    };
    for (const [, breakdown] of deckEntries) {
      for (const key of Object.keys(breakdown)) {
        if (key === "overdue") continue;
        allDates.push(toLocalDate(key));
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
    const totalWeeks = Math.ceil(
      (endOfWeek.getTime() - startOfWeek.getTime()) / oneWeekMs
    );

    const weeklyData: Array<Record<string, number | string>> = [];

    for (let i = 0; i <= totalWeeks; i++) {
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
          const d = toLocalDate(dateStr);
          if (d >= weekStart && d <= weekEnd) {
            sum += count ?? 0;
          }
        }
        row[label] = sum;
      }

      weeklyData.push(row);
    }

    return weeklyData;
  }, [deckSchedules, decksById]);

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
        data={chartDataWeekly}
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
