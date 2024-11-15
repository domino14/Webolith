import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useClient } from "./use_client";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
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

type scheduleBreakdown = { [key: string]: number };

const CardSchedule: React.FC = () => {
  const { lexicon } = useContext(AppContext);
  const [cardSchedule, setCardSchedule] = useState<scheduleBreakdown | null>(
    null
  );
  const [numCards, setNumCards] = useState(0);
  const [cardsToPostpone, setCardsToPostpone] = useState(0);
  const [postponeModalOpened, postponeModalHandlers] = useDisclosure();
  const [showLoader, setShowLoader] = useState(false);

  const wordvaultClient = useClient(WordVaultService);

  const fetchDueQuestions = useCallback(async () => {
    if (!lexicon) {
      return;
    }
    try {
      setShowLoader(true);
      const resp = await wordvaultClient.nextScheduledCount({
        lexicon,
        timezone: getBrowserTimezone(),
      });
      setCardSchedule(resp.breakdown);
    } catch (e) {
      notifications.show({
        color: "red",
        title: "Error",
        message: String(e),
      });
    } finally {
      setShowLoader(false);
    }
  }, [lexicon, wordvaultClient]);

  useEffect(() => {
    fetchDueQuestions();
  }, [fetchDueQuestions]);

  const fetchTotalQuestions = useCallback(async () => {
    if (!lexicon) {
      return;
    }
    try {
      setShowLoader(true);
      const resp = await wordvaultClient.getCardCount({});
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
  }, [lexicon, wordvaultClient]);

  useEffect(() => {
    fetchTotalQuestions();
  }, [fetchTotalQuestions]);

  const chartDataNext30Days = useMemo(() => {
    if (!cardSchedule) return [];

    const result = [];
    const today = new Date();
    const localTimeOffset = today.getTimezoneOffset() * 60000; // Offset in milliseconds

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      // Adjust for the local timezone offset
      const localDate = new Date(currentDate.getTime() - localTimeOffset); // Adjusted date
      const dateString = localDate.toISOString().split("T")[0]; // Format: 'YYYY-MM-DD'

      const count = cardSchedule[dateString] || 0;
      result.push({ date: dateString, "Card Count": count });
    }

    return result;
  }, [cardSchedule]);

  const chartDataWeekly = useMemo(() => {
    if (!cardSchedule) return [];

    // Helper function to create a date in the user's local timezone from 'YYYY-MM-DD'
    // Note that the data that comes back from the API is in the user's local
    // timezone.
    const toLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed in JavaScript Date
    };

    // Extract date-count pairs from cardSchedule, excluding 'overdue'
    const dateCounts = Object.entries(cardSchedule)
      .filter(([dateStr]) => dateStr !== "overdue")
      .map(([dateStr, count]) => ({
        date: toLocalDate(dateStr), // Adjust to local timezone
        "Card Count": count,
      }));

    // Sort the dates in ascending order
    dateCounts.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Determine the date range
    const earliestDate = dateCounts[0]?.date || new Date();
    const latestDate = dateCounts[dateCounts.length - 1]?.date || new Date();

    // Calculate the number of weeks between earliest and latest dates
    const startOfWeek = new Date(earliestDate);
    startOfWeek.setDate(earliestDate.getDate() - earliestDate.getDay()); // Adjust to start of the week (Sunday)

    const endOfWeek = new Date(latestDate);
    endOfWeek.setDate(latestDate.getDate() + (6 - latestDate.getDay())); // Adjust to end of the week (Saturday)

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000; // Milliseconds in one week
    const totalWeeks = Math.ceil(
      (endOfWeek.getTime() - startOfWeek.getTime()) / oneWeekMs
    );

    const weeklyData = [];

    // Loop through each week in the date range
    for (let i = 0; i <= totalWeeks; i++) {
      const weekStart = new Date(startOfWeek.getTime() + i * oneWeekMs);
      const weekEnd = new Date(weekStart.getTime() + oneWeekMs - 1);

      // Sum counts for dates within this week
      const weekCount = dateCounts
        .filter((d) => d.date >= weekStart && d.date <= weekEnd)
        .reduce((sum, d) => sum + d["Card Count"], 0);
      const weekLabel = `${weekStart.toISOString().split("T")[0]}`;

      weeklyData.push({
        week: `Week of ${weekLabel}`,
        "Card Count": weekCount,
      });
    }

    return weeklyData;
  }, [cardSchedule]);

  const sendPostponement = useCallback(async () => {
    try {
      setShowLoader(true);
      const resp = await wordvaultClient.postpone({
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
    wordvaultClient,
    postponeModalHandlers,
  ]);

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
            max={cardSchedule?.overdue}
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
        {cardSchedule?.overdue && (
          <div>
            <Text c="red" fw={700} mb="sm">
              Overdue cards:&nbsp;
              {cardSchedule.overdue}
            </Text>
            <Group gap="xl">
              <Button onClick={postponeModalHandlers.open}>Postpone</Button>
            </Group>
          </div>
        )}
      </>
      <Center mt="xl">
        <Text>Daily schedule (next 30 days)</Text>
      </Center>
      <BarChart
        h={300}
        data={chartDataNext30Days}
        dataKey="date"
        series={[{ name: "Card Count", color: "blue" }]}
        tickLine="x"
      />

      <Center mt="xl">
        <Text>Weekly schedule</Text>
      </Center>

      <BarChart
        h={300}
        data={chartDataWeekly}
        dataKey="week"
        series={[{ name: "Card Count", color: "blue" }]}
        tickLine="x"
      />
    </div>
  );
};

export default CardSchedule;
