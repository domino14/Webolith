/* eslint-disable jsx-a11y/anchor-is-valid */
 
 
import React, { useCallback } from 'react';

import Pills from './pills';
import Select from '../forms/select';
import NumberInput from '../forms/number_input';
import Notifications from '../notifications';

interface Lexicon {
  id: number;
  lexicon: string;
  description: string;
}

interface SelectOption {
  value: string;
  displayValue: string;
}

/**
 * Get lexicon options from the given object in a Select-friendly format.
 */
function getLexiconOptions(lexicaObject: Lexicon[]): SelectOption[] {
  return lexicaObject.map((obj) => ({
    value: String(obj.id),
    displayValue: obj.lexicon,
  }));
}

interface MakeDefaultLexLinkProps {
  defaultLexicon: number;
  selectedLexicon: number;
  setDefaultLexicon: (lexicon: number) => void;
  availableLexica: Lexicon[];
}

function MakeDefaultLexLink({
  defaultLexicon,
  selectedLexicon,
  setDefaultLexicon,
  availableLexica,
}: MakeDefaultLexLinkProps) {
  const confirmNewDefault = useCallback(() => {
    const selectedLex = availableLexica.find((lex) => lex.id === selectedLexicon);
    if (!selectedLex) return;

    const userFriendlyName = selectedLex.lexicon;

    Notifications.confirm(
      'Are you sure?',
      `Are you sure you wish to change the default lexicon to ${userFriendlyName}?`,
      () => setDefaultLexicon(selectedLexicon),
    );
  }, [availableLexica, selectedLexicon, setDefaultLexicon]);

  if (defaultLexicon === selectedLexicon) {
    return null;
  }

  return (
    <div
      className="defaultLink"
      style={{ marginTop: '-10px', marginBottom: '10px' }}
    >
      <a onClick={confirmNewDefault}>
        Make default
      </a>
    </div>
  );
}

interface SidebarProps {
  gameTypes: string[];
  activeGameType: string;
  setGameType: (gameType: string) => void;
  currentLexicon: number;
  defaultLexicon: number;
  setLexicon: (lexicon: number) => void;
  setDefaultLexicon: (lexicon: number) => void;
  desiredTime: string;
  setTime: (time: string) => void;
  questionsPerRound: number;
  setQuestionsPerRound: (questions: number) => void;
  disabledInputs: boolean;
  availableLexica: Lexicon[];
}

function Sidebar({
  gameTypes,
  activeGameType,
  setGameType,
  currentLexicon,
  defaultLexicon,
  setLexicon,
  setDefaultLexicon,
  desiredTime,
  setTime,
  questionsPerRound,
  setQuestionsPerRound,
  disabledInputs,
  availableLexica,
}: SidebarProps) {
  const handleLexiconChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLexicon(parseInt(e.target.value, 10));
  }, [setLexicon]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  }, [setTime]);

  const handleQuestionsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestionsPerRound(parseInt(e.target.value, 10));
  }, [setQuestionsPerRound]);

  return (
    <div>
      <Pills
        stacked
        options={gameTypes}
        activePill={activeGameType}
        onPillClick={setGameType}
      />

      <div className="row" style={{ marginTop: 10 }}>
        <div className="col-sm-12">
          <form>
            <Select
              colSize={10}
              label="Lexicon"
              selectedValue={String(currentLexicon)}
              options={getLexiconOptions(availableLexica)}
              onChange={handleLexiconChange}
            />
            <MakeDefaultLexLink
              defaultLexicon={defaultLexicon}
              setDefaultLexicon={setDefaultLexicon}
              selectedLexicon={currentLexicon}
              availableLexica={availableLexica}
            />
            <NumberInput
              colSize={10}
              label="Minutes"
              value={desiredTime}
              onChange={handleTimeChange}
              disabled={disabledInputs}
            />
            <NumberInput
              colSize={10}
              label="Questions Per Round"
              value={String(questionsPerRound)}
              onChange={handleQuestionsChange}
              disabled={disabledInputs}
            />
          </form>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
