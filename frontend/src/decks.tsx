import {
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Modal,
  TextInput,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { AppContext } from "./app_context";
import { useContext, useEffect, useState } from "react";
import { Deck, DeckBreakdown } from "./gen/rpc/wordvault/api_pb";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";

interface DeckFormModalProps {
  opened: boolean;
  onClose: () => void;
  deck?: Deck | null;
  existingDeckNames: string[];
  onSubmit: (name: string, deck?: Deck) => Promise<void>;
}

function DeckFormModal({
  opened,
  onClose,
  deck,
  existingDeckNames,
  onSubmit,
}: DeckFormModalProps) {
  const isEditing = !!deck;

  const form = useForm({
    initialValues: {
      name: "",
    },
    validate: {
      name: (value) => {
        if (!value.trim()) {
          return "Deck name is required";
        }
        if (value.trim().length < 2) {
          return "Deck name must be at least 2 characters";
        }

        if (
          !isEditing ||
          value.trim().toLowerCase() !== deck?.name.toLowerCase()
        ) {
          if (existingDeckNames.includes(value.trim().toLowerCase())) {
            return "A deck with this name already exists";
          }
        }
        return null;
      },
    },
  });

  useEffect(() => {
    form.setInitialValues({
      name: deck?.name || "",
    });
    form.reset();
  }, [deck]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (values: { name: string }) => {
    await onSubmit(values.name.trim(), deck || undefined);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? "Edit Deck" : "Add New Deck"}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)} key={deck?.id || "new"}>
        <Stack>
          <TextInput
            label="Deck Name"
            placeholder="Enter deck name"
            {...form.getInputProps("name")}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Deck" : "Create Deck"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

interface DeleteDeckModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deckName: string;
}

function DeleteDeckModal({
  opened,
  onClose,
  onConfirm,
  deckName,
}: DeleteDeckModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Delete Deck" centered>
      <Stack>
        <Text>
          Are you sure you want to delete the deck "{deckName}"? This action
          cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirm}>
            Delete Deck
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function DeckDisplay({
  breakdown,
  name,
  onEdit,
  onDelete,
}: {
  name: string;
  breakdown: DeckBreakdown | null;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const overdue = breakdown?.breakdown["overdue"] ?? 0;
  const total = Object.values(breakdown?.breakdown ?? {}).reduce(
    (a, b) => a + b,
    0
  );

  const canDelete = total === 0;

  return (
    <Card withBorder>
      <Stack>
        <Group justify="space-between" align="flex-start">
          <Text fw={500}>{name}</Text>
          <Group gap="xs">
            {onEdit && (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={onEdit}
                aria-label="Edit deck name"
              >
                <IconEdit size={14} />
              </ActionIcon>
            )}
            {onDelete && (
              <Tooltip
                label="All cards must be moved or deleted from the deck first"
                disabled={canDelete}
              >
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={onDelete}
                  disabled={!canDelete}
                  aria-label="Delete deck"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
        <Text c="dimmed">
          {overdue} {overdue === 1 ? "card" : "cards"} due • {total} total
        </Text>
      </Stack>
    </Card>
  );
}

function DefaultDeckDisplay({
  breakdown,
}: {
  breakdown: DeckBreakdown | null;
}) {
  return <DeckDisplay name="Default Deck" breakdown={breakdown} />;
}

function NonDefaultDeckDisplay({
  deck,
  breakdown,
  onEdit,
  onDelete,
}: {
  deck: Deck;
  breakdown: DeckBreakdown | null;
  onEdit: (deck: Deck) => void;
  onDelete: (deck: Deck) => void;
}) {
  return (
    <DeckDisplay
      name={deck.name}
      breakdown={breakdown}
      onEdit={() => onEdit(deck)}
      onDelete={() => onDelete(deck)}
    />
  );
}

function ManageDecks() {
  const {
    decksById,
    wordVaultClient,
    lexicon,
    addDeck,
    updateDeck,
    removeDeck,
  } = useContext(AppContext);
  const [opened, { open, close }] = useDisclosure(false);
  const [
    deleteModalOpened,
    { open: openDeleteModal, close: closeDeleteModal },
  ] = useDisclosure(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null);

  const [deckBreakdownsByDeckId, setDeckBreakdownsByDeckId] = useState<
    Map<bigint, DeckBreakdown>
  >(new Map());

  const existingDeckNames = [...decksById.values()].map((d) =>
    d.name.toLowerCase()
  );

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
                breakdown.deckId ?? 0n,
                breakdown,
              ])
            )
          );
        }
      } catch (error) {
        console.error("Error fetching card counts:", error);
      }
    };

    fetchOverdueCounts();
  }, [wordVaultClient, lexicon]);

  const handleFormSubmit = async (name: string, deck?: Deck) => {
    if (!wordVaultClient || !lexicon) {
      return;
    }

    try {
      if (deck) {
        const response = await wordVaultClient.editDeck({
          id: deck.id,
          name: name,
        });

        if (response.deck) {
          updateDeck(response.deck);
          notifications.show({
            color: "green",
            message: `Deck renamed to "${name}" successfully!`,
          });
        }
      } else {
        const response = await wordVaultClient.addDeck({
          name: name,
          lexicon,
        });

        if (response.deck) {
          addDeck(response.deck);
          notifications.show({
            color: "green",
            message: `Deck "${name}" created successfully!`,
          });
        }
      }
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Error",
        message: String(error),
      });
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleAddDeck = () => {
    setEditingDeck(null);
    open();
  };

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    open();
  };

  const handleDeleteDeck = (deck: Deck) => {
    setDeletingDeck(deck);
    openDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!wordVaultClient || !deletingDeck) {
      return;
    }

    try {
      await wordVaultClient.deleteDeck({
        id: deletingDeck.id,
      });

      removeDeck(deletingDeck.id);
      notifications.show({
        color: "green",
        message: `Deck "${deletingDeck.name}" deleted successfully!`,
      });
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Error",
        message: String(error),
      });
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleModalClose = () => {
    setEditingDeck(null);
    close();
  };

  const handleDeleteModalClose = () => {
    setDeletingDeck(null);
    closeDeleteModal();
  };

  return (
    <Stack mt="lg">
      <Group>
        <Button
          size="md"
          variant="light"
          leftSection={<IconPlus />}
          onClick={handleAddDeck}
        >
          Add Deck
        </Button>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2 }} maw={1000} spacing="lg">
        <DefaultDeckDisplay
          breakdown={deckBreakdownsByDeckId.get(0n) ?? null}
        />
        {[...decksById.values()].map((deck) => (
          <NonDefaultDeckDisplay
            deck={deck}
            key={deck.id}
            breakdown={deckBreakdownsByDeckId.get(deck.id) ?? null}
            onEdit={handleEditDeck}
            onDelete={handleDeleteDeck}
          />
        ))}
      </SimpleGrid>

      <DeckFormModal
        opened={opened}
        onClose={handleModalClose}
        deck={editingDeck}
        existingDeckNames={existingDeckNames}
        onSubmit={handleFormSubmit}
      />

      <DeleteDeckModal
        opened={deleteModalOpened}
        onClose={handleDeleteModalClose}
        onConfirm={handleConfirmDelete}
        deckName={deletingDeck?.name ?? ""}
      />
    </Stack>
  );
}

function Decks() {
  return <ManageDecks />;
}

export default Decks;
