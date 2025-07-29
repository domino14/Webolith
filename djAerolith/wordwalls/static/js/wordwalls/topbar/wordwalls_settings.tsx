import React, { useState, useCallback, useEffect } from 'react';

import * as Immutable from 'immutable';
import _ from 'underscore';

import SVGBoard from '../svg_board';
import Checkbox from '../forms/checkbox';
import TextInput from '../forms/text_input';
import Select from '../forms/select';
import Styling from '../style';
import { getBackgroundsByMode } from '../background';

interface WordwallsSettingsProps {
  onOptionsModify: (key: string, value: unknown) => void;
  displayStyle: Styling;
  allowSave: (allow: boolean) => void;
}

interface SelectOption {
  value: string;
  displayValue: string;
}

/**
 * Calculate the letters that are remaining given a tile order.
 * XXX: We need to fix this for Spanish, I guess.
 */
function calculateLettersRemaining(tileOrder: string): string {
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?';
  return _.difference(allLetters.split(''), tileOrder.split('')).join('');
}

function getTileStyleOptions(): SelectOption[] {
  const options: SelectOption[] = [];
  for (let i = 1; i < 10; i += 1) {
    options.push({
      value: String(i),
      displayValue: `Style ${i}`,
    });
  }
  return options;
}

/**
 * Get background options based on the current mode.
 */
function getBackgroundOptions(darkMode: boolean, isBodyBackground = false): SelectOption[] {
  return getBackgroundsByMode(darkMode, isBodyBackground);
}

function getUpscaleOptions(): SelectOption[] {
  return [
    {
      value: 'none',
      displayValue: 'No',
    }, {
      value: 'small',
      displayValue: 'Scale up a little',
    }, {
      value: 'large',
      displayValue: 'Scale up a lot',
    },
  ];
}

function WordwallsSettings({
  onOptionsModify,
  displayStyle,
  allowSave,
}: WordwallsSettingsProps) {
  const [tileOrderLettersRemaining, setTileOrderLettersRemaining] = useState(
    () => calculateLettersRemaining(displayStyle.customTileOrder),
  );
  const [questions] = useState(() => Immutable.fromJS([
    {
      a: 'ADEEMMO?',
      wMap: {
        GAMODEME: {},
        HOMEMADE: {},
      },
      displayedAs: 'ADEEMMO?',
    },
  ]));

  useEffect(() => {
    setTileOrderLettersRemaining(calculateLettersRemaining(displayStyle.customTileOrder));
  }, [displayStyle.customTileOrder]);

  const handleShuffle = useCallback((idx: number) => {
    // XXX: This should be moved into a utility shuffle function or something.
    // For now, we'll keep the questions static since this is just a preview
    // eslint-disable-next-line no-console
    console.log('Shuffle preview question at index:', idx);
  }, []);

  const onTileOrderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // XXX: Check if it has all letters before setting state. If not,
    // set some sort of indicator.

    const letters = _.uniq(event.target.value.toLocaleUpperCase().split('')).join('');
    onOptionsModify('customTileOrder', letters);
    const remaining = calculateLettersRemaining(letters);
    setTileOrderLettersRemaining(remaining);
    if (remaining.length === 0 || remaining.length === 27) {
      allowSave(true);
    } else {
      allowSave(false);
    }
  }, [onOptionsModify, allowSave]);

  /**
   * Depending on the value of displayStyle.tilesOn, different
   * forms must display.
   */
  const getTileDependentForm = useCallback(() => {
    if (displayStyle.tilesOn) {
      return (
        <div>
          <div className="row">
            <div className="col-lg-2">
              <Select
                colSize={12}
                label="Tile Style"
                selectedValue={displayStyle.tileStyle}
                onChange={(event) => {
                  onOptionsModify('tileStyle', event.target.value);
                }}
                options={getTileStyleOptions()}
              />
            </div>
            <div className="col-lg-2">
              <TextInput
                colSize={12}
                label="Blank Character"
                maxLength={1}
                value={displayStyle.blankCharacter}
                onChange={(event) => {
                  onOptionsModify('blankCharacter', event.target.value);
                }}
                onKeyPress={() => {}}
              />
            </div>
            <div className="col-lg-4">
              {/*
                <Checkbox
                on={displayStyle.randomTileOrientation}
                onChange={(event) => {
                  onOptionsModify(
                    'randomTileOrientation',
                    event.target.checked,
                  );
                }}
                label="Orient tiles randomly (Matthew O'Connor mode)"
              /> */}
            </div>
          </div>
        </div>
      );
    }
    return <div />;
  }, [displayStyle.tilesOn, displayStyle.tileStyle, displayStyle.blankCharacter, onOptionsModify]);

  const stateLetRem = tileOrderLettersRemaining;
  let letRem: React.ReactNode;
  // If it's not totally empty (or not totally full)
  if (stateLetRem.length !== 0 && stateLetRem.length !== 27) {
    letRem = (
      <span className="text-danger">
        <strong>
          {`${stateLetRem} (${stateLetRem.length})`}
        </strong>
      </span>
    );
  } else {
    letRem = (
      <span className="text-success">
        <i
          className="bi bi-check"
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <div>
      <div className="row">
        <div className="col-lg-12">
          <SVGBoard
            width={172}
            height={30}
            gridWidth={1}
            gridHeight={1}
            onShuffle={handleShuffle}
            displayStyle={displayStyle}
            questions={questions}
            scaleTransform={1.75}
            isTyping={false}
          />
        </div>
      </div>

      <div className="row" style={{ height: '60vh', overflowY: 'auto' }}>
        <div className="col-lg-12">
          <form>
            <Checkbox
              on={displayStyle.tilesOn}
              onChange={(event) => {
                onOptionsModify('tilesOn', event.target.checked);
              }}
              label="Show tiles"
            />
            {getTileDependentForm()}
            <Checkbox
              on={displayStyle.showBold}
              onChange={(event) => {
                onOptionsModify('showBold', event.target.checked);
              }}
              label="Bold font"
            />
            <Select
              colSize={2}
              label="Font"
              selectedValue={displayStyle.font}
              onChange={(event) => {
                onOptionsModify('font', event.target.value);
              }}
              options={[
                {
                  value: 'sans',
                  displayValue: 'Sans-serif',
                }, {
                  value: 'mono',
                  displayValue: 'Serifed Mono',
                }, {
                  value: 'sansmono',
                  displayValue: 'Sans-serif Mono',
                },
              ]}
            />
            <hr />
            <TextInput
              colSize={6}
              label="Custom Tile Order"
              value={displayStyle.customTileOrder}
              maxLength={30}
              onChange={onTileOrderChange}
              onKeyPress={() => {}}
            />
            <div className="row">
              <div className="col-lg-6">
                Letters remaining:
                {' '}
                {letRem}
              </div>
            </div>
            <hr />
            <div className="row">
              <div className="col-lg-6">
                <Select
                  colSize={10}
                  label="Game board background"
                  selectedValue={displayStyle.background}
                  onChange={(event) => {
                    onOptionsModify('background', event.target.value);
                  }}
                  options={getBackgroundOptions(displayStyle.darkMode)}
                />
              </div>
              <div className="col-lg-6">
                <Select
                  colSize={10}
                  label="Body background"
                  selectedValue={displayStyle.bodyBackground}
                  onChange={(event) => {
                    onOptionsModify('bodyBackground', event.target.value);
                  }}
                  options={getBackgroundOptions(displayStyle.darkMode, true)}
                />
              </div>
            </div>
            <hr />
            <div className="row">
              <div className="col-lg-4">
                <Checkbox
                  on={displayStyle.showBorders}
                  onChange={(event) => {
                    onOptionsModify('showBorders', event.target.checked);
                  }}
                  label="Show borders around questions"
                />
              </div>
              <div className="col-lg-4">
                <Checkbox
                  on={displayStyle.showChips}
                  onChange={(event) => {
                    onOptionsModify('showChips', event.target.checked);
                  }}
                  label="Show number of anagrams"
                />
              </div>
              <div className="col-lg-4">
                <Checkbox
                  on={displayStyle.hideLexiconSymbols}
                  onChange={(event) => {
                    onOptionsModify('hideLexiconSymbols', event.target.checked);
                  }}
                  label="Hide lexicon symbols (such as # or +)"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-lg-6">
                <Select
                  colSize={10}
                  label="Scale size of word grid as window grows"
                  selectedValue={displayStyle.upscaleWithWindowSize}
                  onChange={(event) => {
                    onOptionsModify('upscaleWithWindowSize', event.target.value);
                  }}
                  options={getUpscaleOptions()}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-12 col-sm-6">
                <Checkbox
                  id="showErrors"
                  name="showErrors"
                  label="Hide Errors"
                  helpText="Hide number of errors instead of showing them."
                  on={displayStyle.hideErrors}
                  onChange={(e) => onOptionsModify('hideErrors', e.target.checked)}
                />
              </div>

              <div className="col-12 col-sm-6">
                <Checkbox
                  id="darkMode"
                  name="darkMode"
                  label="Dark Mode"
                  helpText="Enable dark mode for better night-time viewing"
                  on={displayStyle.darkMode}
                  onChange={(e) => onOptionsModify('darkMode', e.target.checked)}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default WordwallsSettings;
