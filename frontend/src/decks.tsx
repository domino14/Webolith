import {
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { AppContext } from "./app_context";
import { useContext, useEffect, useState } from "react";
import { Deck, DeckBreakdown } from "./gen/rpc/wordvault/api_pb";
import { IconPlus } from "@tabler/icons-react";

function DefaultDeckDisplay({
  breakdown,
}: {
  breakdown: DeckBreakdown | null;
}) {
  const overdue = breakdown?.breakdown["overdue"] ?? 0;
  const total = Object.values(breakdown?.breakdown ?? {}).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <Card withBorder>
      <Stack>
        <Text fw={500}>Default Deck</Text>
        <Text c="dimmed">
          {overdue} cards due || {total} total cards
        </Text>
      </Stack>
    </Card>
  );
}

function DeckDisplay({
  deck,
  breakdown,
}: {
  deck: Deck;
  breakdown: DeckBreakdown | null;
}) {
  const overdue = breakdown?.breakdown["overdue"] ?? 0;
  const total = Object.values(breakdown?.breakdown ?? {}).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <Card withBorder>
      <Stack>
        <Text fw={500}>{deck.name}</Text>
        <Text c="dimmed">
          {overdue} cards due || {total} total cards
        </Text>
      </Stack>
    </Card>
  );
}

function ManageDecks() {
  const { decksById, wordVaultClient, lexicon } = useContext(AppContext);

  const [deckBreakdownsByDeckId, setDeckBreakdownsByDeckId] = useState<
    Map<bigint | null, DeckBreakdown>
  >(new Map());

  useEffect(() => {
    const fetchOverdueCounts = async () => {
      if (!wordVaultClient || !lexicon) {
        return;
      }

      try {
        const response = await wordVaultClient.nextScheduledCountByDeck({
          lexicon,
        });
        if (response.breakdowns) {
          setDeckBreakdownsByDeckId(
            new Map(
              response.breakdowns.map((breakdown) => [
                breakdown.deckId ?? null,
                breakdown,
              ]),
            ),
          );
        }
      } catch (error) {
        console.error("Error fetching card counts:", error);
      }
    };

    fetchOverdueCounts();
  }, [wordVaultClient, lexicon]);

  return (
    <Stack mt="lg">
      <Group>
        <Button size="md" variant="light" leftSection={<IconPlus />}>
          Add Deck
        </Button>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <DefaultDeckDisplay
          breakdown={deckBreakdownsByDeckId.get(null) ?? null}
        />
        {[...decksById.values()].map((deck) => (
          <DeckDisplay
            deck={deck}
            key={deck.id}
            breakdown={deckBreakdownsByDeckId.get(deck.id) ?? null}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

function Decks() {
  return (
    <Tabs variant="default" defaultValue="manage">
      <Tabs.List>
        <Tabs.Tab value="manage">Manage Decks</Tabs.Tab>
        <Tabs.Tab value="move-cards">Move Cards</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="manage">
        <ManageDecks />
      </Tabs.Panel>
      <Tabs.Panel value="move-cards">Move Cards</Tabs.Panel>
    </Tabs>
  );
}

export default Decks;
