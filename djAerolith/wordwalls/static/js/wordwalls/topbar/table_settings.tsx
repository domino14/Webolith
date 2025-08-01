import React from 'react';
import Checkbox from '../forms/checkbox';

interface TableSettingsProps {
  onSettingsModify: (key: string, value: boolean) => void;
  tablePrivate: boolean;
}

function TableSettings({ onSettingsModify, tablePrivate }: TableSettingsProps) {
  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <form>
            <Checkbox
              on={tablePrivate}
              onChange={(event) => {
                onSettingsModify('private', event.target.checked);
              }}
              label="Private"
            />
            <p>
              Note: To switch between single and multiplayer tables, you
              must instead create a new table.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TableSettings;
