import { Divider } from "@mantine/core";
import DeleteNewCards from "./DeleteNewCards";
import DeleteAllCards from "./DeleteAllCards";

type BulkCardDeletionTabProps = {
  onDeleteNewCards: (deckId: bigint | null) => Promise<void>;
  onDeleteAllCards: (deckId: bigint | null) => Promise<void>;
  showLoader: boolean;
};

const BulkCardDeletionTab: React.FC<BulkCardDeletionTabProps> = ({
  onDeleteNewCards,
  onDeleteAllCards,
  showLoader,
}) => {
  return (
    <>
      <DeleteNewCards onDeleteNewCards={onDeleteNewCards} />

      <Divider m="xl" />

      <DeleteAllCards onDeleteAllCards={onDeleteAllCards} showLoader={showLoader} />
    </>
  );
};

export default BulkCardDeletionTab;
