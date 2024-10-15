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

type scheduleBreakdown = { [key: string]: number };

const CardSchedule: React.FC = () => {
  const { lexicon } = useContext(AppContext);
  const [cardSchedule, setCardSchedule] = useState<scheduleBreakdown | null>(
    null
  );
  const [numCards, setNumCards] = useState(0);
  const [cardsToPostpone, setCardsToPostpone] = useState(0);
  const [postponeModalOpened, postponeModalHandlers] = useDisclosure();
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure();
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
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      setNumCards(resp.numCards[lexicon]);
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

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateString = currentDate.toISOString().split("T")[0]; // Format: 'YYYY-MM-DD'

      const count = cardSchedule[dateString] || 0;
      result.push({ date: dateString, "Card Count": count });
    }

    return result;
  }, [cardSchedule]);

  const chartDataWeekly = useMemo(() => {
    if (!cardSchedule) return [];

    // Extract date-count pairs from cardSchedule, excluding 'overdue'
    const dateCounts = Object.entries(cardSchedule)
      .filter(([dateStr]) => dateStr !== "overdue")
      .map(([dateStr, count]) => ({
        date: new Date(dateStr),
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

  const sendDelete = useCallback(async () => {
    try {
      setShowLoader(true);
      const resp = await wordvaultClient.delete({
        lexicon,
        onlyNewQuestions: true,
      });
      notifications.show({
        color: "green",
        message: `Deleted ${resp.numDeleted} cards.`,
      });
      deleteModalHandlers.close();
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
  }, [lexicon, fetchDueQuestions, wordvaultClient, deleteModalHandlers]);

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

      <Modal
        opened={deleteModalOpened}
        onClose={deleteModalHandlers.close}
        title="Delete new cards"
      >
        <Text mb="xl">
          If you've accidentally added too many cards, you can delete the new
          ones here. That is, the ones that you have not yet quizzed on.
        </Text>
        <Text mb="xl" fw={700} c="red">
          This is not undoable. Make sure you want to delete these new cards!
          You can always re-add them later.
        </Text>

        <Button color="pink" onClick={sendDelete}>
          Delete new cards
        </Button>
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
              <Button onClick={deleteModalHandlers.open}>
                Delete new cards
              </Button>
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
