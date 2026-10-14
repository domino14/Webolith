import { useCallback, useContext, useMemo, useState } from "react";
import { notifications } from "@mantine/notifications";
import { AppContext } from "./app_context";
import { Score, Card as WordVaultCard } from "./gen/rpc/wordvault/api_pb";
import {
  Alphagram,
  SearchRequest_Condition,
} from "./gen/rpc/wordsearcher/searcher_pb";
import type { fsrsCard, reviewLogItem } from "./card_info";

/**
 * Looks up one card in the current lexicon, along with its probability and
 * words, and lets the user mark it missed. Used by the stats page lookup and
 * the card page.
 */
export function useCardLookup() {
  const { lexicon, wordVaultClient, wordServerClient } = useContext(AppContext);
  const [cardInfo, setCardInfo] = useState<WordVaultCard | null>(null);
  // Probability and words for the looked-up card, if the expansion worked.
  const [expanded, setExpanded] = useState<Alphagram | null>(null);

  // Resolves to whether the card exists.
  const lookupAlphagram = useCallback(
    async (lookup: string, { quiet = false } = {}): Promise<boolean> => {
      if (!wordVaultClient) {
        return false;
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
            .search({
              searchparams: [
                {
                  condition: SearchRequest_Condition.LEXICON,
                  conditionparam: {
                    value: { value: lexicon },
                    case: "stringvalue",
                  },
                },
                {
                  condition: SearchRequest_Condition.ALPHAGRAM_LIST,
                  conditionparam: {
                    value: { values: [alphagram] },
                    case: "stringarray",
                  },
                },
              ],
              expand: true,
            })
            .then((r) => setExpanded(r.alphagrams[0] ?? null))
            .catch((e) => console.error("Error expanding alphagram:", e));
        }
        return true;
      } catch (e) {
        setCardInfo(null);
        setExpanded(null);
        if (!quiet) {
          notifications.show({
            color: "red",
            message: String(e),
          });
        }
        return false;
      }
    },
    [lexicon, wordVaultClient, wordServerClient],
  );

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
      await lookupAlphagram(alphagram);
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

  return { cardInfo, expanded, fsrsCard, reviewLog, lookupAlphagram, markMissed };
}
