import { CardStat, FsrsCardJson } from "./types";
import { Text, TextProps } from "@mantine/core";

export interface CardStatsProps {
  card: FsrsCardJson;
  labelProps: TextProps;
  valueProps: TextProps;
  excludeStats?: Set<CardStat>;
}

export function CardStats({
  card,
  labelProps,
  valueProps,
  excludeStats = new Set(),
}: CardStatsProps) {
  // The first time a card is incorrectly answered is not logged as a
  // lapse, so we exclude that from the calculation of recall rate.
  const timesRecalled = Math.min(card.Reps - 1, card.Reps - 1 - card.Lapses);

  let recallPercentageDisplay: string = "N/A";
  if (card.Reps > 1) {
    const recallPercentage = (timesRecalled / (card.Reps - 1)) * 100;
    recallPercentageDisplay =
      recallPercentage.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 0,
      }) + "%";
  }

  const dueDate = new Date(card.Due);
  const lastReview = new Date(card.LastReview);

  return (
    <>
      {!excludeStats.has(CardStat.DUE_DATE) && (
        <Text {...textProps}>
          Next Due Date: {dueDate.toLocaleDateString()}{" "}
          {dueDate.toLocaleTimeString()}
        </Text>
      )}
      {!excludeStats.has(CardStat.LAST_SEEN) && (
        <Text {...textProps}>
          Last Seen: {lastReview.toLocaleDateString()}{" "}
          {lastReview.toLocaleTimeString()}
        </Text>
      )}
      {!excludeStats.has(CardStat.TIMES_SEEN) && (
        <Text {...textProps}>Times Seen: {card.Reps}</Text>
      )}
      {!excludeStats.has(CardStat.RECALL_RATE) && (
        <Text {...textProps}>Recall Rate: {recallPercentageDisplay}</Text>
      )}
    </>
  );
}
