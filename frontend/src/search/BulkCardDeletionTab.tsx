import { Alert, Divider } from "@mantine/core";
import DeleteNewCards from "./DeleteNewCards";
import DeleteAllCards from "./DeleteAllCards";

type AlertValues = {
  shown: boolean;
  color?: string;
  text?: string;
};

type BulkCardDeletionTabProps = {
  onDeleteNewCards: (deckId: bigint | null) => Promise<void>;
  onDeleteAllCards: (deckId: bigint | null) => Promise<void>;
  alert: AlertValues;
  showLoader: boolean;
};

const BulkCardDeletionTab: React.FC<BulkCardDeletionTabProps> = ({
  onDeleteNewCards,
  onDeleteAllCards,
  alert,
  showLoader,
}) => {
  return (
    <>
      <DeleteNewCards onDeleteNewCards={onDeleteNewCards} />

      <Divider m="xl" />

      <DeleteAllCards onDeleteAllCards={onDeleteAllCards} showLoader={showLoader} />

      {alert.shown && (
        <Alert variant="light" color={alert.color} mt="lg">
          {alert.text}
        </Alert>
      )}
    </>
  );
};

export default BulkCardDeletionTab;
