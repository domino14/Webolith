import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader, Text } from "@mantine/core";
import { AppContext } from "./app_context";
import { CardInfo } from "./card_info";
import { useCardLookup } from "./use_card_lookup";

// A single card's stats, at /card/:alphagram. Other apps (e.g. Wordwalls)
// link here, adding ?lexicon= to pick the lexicon.
const CardPage: React.FC = () => {
  const { alphagram = "" } = useParams();
  const { lexicon, jwt } = useContext(AppContext);
  const { cardInfo, expanded, fsrsCard, reviewLog, lookupAlphagram, markMissed } =
    useCardLookup();
  const [found, setFound] = useState<boolean | null>(null);

  useEffect(() => {
    if (!jwt || !lexicon || !alphagram) {
      return;
    }
    setFound(null);
    lookupAlphagram(alphagram.toLocaleUpperCase(), { quiet: true }).then(setFound);
  }, [jwt, lexicon, alphagram, lookupAlphagram]);

  if (found === null) {
    return <Loader />;
  }
  if (!found || !cardInfo || !fsrsCard || !reviewLog) {
    return (
      <Text>
        {alphagram.toLocaleUpperCase()} is not in your {lexicon} WordVault.
      </Text>
    );
  }
  return (
    <CardInfo
      cardInfo={cardInfo}
      expanded={expanded}
      onMarkMissed={markMissed}
      fsrsCard={fsrsCard}
      reviewLog={reviewLog}
    />
  );
};

export default CardPage;
