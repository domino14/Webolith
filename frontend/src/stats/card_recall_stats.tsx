import { dateString } from "../date_string";
import { CardRecallStat, ParsedFsrsCardStats } from "./types";
import { Text, TextProps } from "@mantine/core";

export interface CardRecallStatsProps {
  card: ParsedFsrsCardStats;
  showTime?: boolean;
  textProps?: Exclude<TextProps, "component">;
  valueProps?: Exclude<TextProps, "component">;
  excludeStats?: Set<CardRecallStat>;
}

export function CardRecallStats({
  card,
  textProps,
  valueProps,
  excludeStats = new Set(),
  showTime = false,
}: CardRecallStatsProps) {
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

  return (
    <>
      {!excludeStats.has(CardRecallStat.DUE_DATE) && (
        <Text {...textProps}>
          Next Due Date:{" "}
          <Text component="span" {...valueProps}>
            {dateString(card.Due, showTime)}
          </Text>
        </Text>
      )}
      {!excludeStats.has(CardRecallStat.LAST_SEEN) && (
        <Text {...textProps}>
          Last Seen:{" "}
          <Text component="span" {...valueProps}>
            {dateString(card.LastReview, showTime)}
          </Text>
        </Text>
      )}
      {!excludeStats.has(CardRecallStat.TIMES_SEEN) && (
        <Text {...textProps}>
          Times Seen:{" "}
          <Text component="span" {...valueProps}>
            {card.Reps}
          </Text>
        </Text>
      )}
      {!excludeStats.has(CardRecallStat.RECALL_RATE) && (
        <Text {...textProps}>
          Recall Rate:{" "}
          <Text component="span" {...valueProps}>
            {recallPercentageDisplay}
          </Text>
        </Text>
      )}
    </>
  );
}
