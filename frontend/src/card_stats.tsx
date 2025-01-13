import { dateString } from "./date_string";
import { CardStat, ParsedFsrsCard } from "./types";
import { Text, TextProps } from "@mantine/core";

export interface CardStatsProps {
  card: ParsedFsrsCard;
  showTime?: boolean;
  textProps?: Exclude<TextProps, "component">;
  valueProps?: Exclude<TextProps, "component">;
  excludeStats?: Set<CardStat>;
}

export function CardStats({
  card,
  textProps,
  valueProps,
  excludeStats = new Set(),
  showTime = false,
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

  return (
    <>
      {!excludeStats.has(CardStat.DUE_DATE) && (
        <Text {...textProps}>
          Next Due Date:{" "}
          <Text component="span" {...valueProps}>
            {dateString(card.Due, showTime)}
          </Text>
        </Text>
      )}
      {!excludeStats.has(CardStat.LAST_SEEN) && (
        <Text {...textProps}>
          Last Seen:{" "}
          <Text component="span" {...valueProps}>
            {dateString(card.LastReview, showTime)}
          </Text>
        </Text>
      )}
      {!excludeStats.has(CardStat.TIMES_SEEN) && (
        <Text {...textProps}>
          Times Seen:{" "}
          <Text component="span" {...valueProps}>
            {card.Reps}
          </Text>
        </Text>
      )}
      {!excludeStats.has(CardStat.RECALL_RATE) && (
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
