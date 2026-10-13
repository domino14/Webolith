import { useContext, useEffect, useState } from "react";
import { AppContext } from "./app_context";

export const LATEST_FSRS_VERSION = 6;

// The user's FSRS version (5 or 6), or null while loading. word_db_server
// picks the weights from it.
export const useFsrsVersion = () => {
  const { wordVaultClient } = useContext(AppContext);
  const [version, setVersion] = useState<number | null>(null);

  useEffect(() => {
    if (!wordVaultClient) {
      return;
    }
    wordVaultClient
      .getFsrsParameters({})
      .then((resp) => setVersion(resp.fsrsVersion))
      .catch((e) => console.error("Error fetching FSRS version:", e));
  }, [wordVaultClient]);

  return [version, setVersion] as const;
};

// The forgetting curve's decay: FSRS-5 uses a fixed -0.5, FSRS-6 uses -W[20]
// of its default weights.
const fsrsDecay = (version: number) => (version >= 6 ? -0.1542 : -0.5);

// Predicted recall (0-1) of a card with the given stability, elapsedDays after
// its last review. Matches go-fsrs's Retrievability.
export const fsrsRecall = (
  version: number,
  stability: number,
  elapsedDays: number,
) => {
  const decay = fsrsDecay(version);
  const factor = Math.pow(0.9, 1 / decay) - 1;
  return Math.pow(1 + (factor * elapsedDays) / stability, decay);
};
