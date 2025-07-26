import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import sinon from 'sinon';

import { SearchTypesEnum } from 'wordvaultapp/search/types';
import SearchDialogContainer from '../../../newtable/search/dialog_container';

interface MockAPI {
  call: sinon.SinonStub;
}

interface SearchDialogProps {
  lexicon: number;
  desiredTime: number;
  questionsPerRound: number;
  notifyError: (err: string) => void;
  redirectUrl: () => void;
  tablenum: number;
  onLoadNewList: () => void;
  disabled: boolean;
  showSpinner: () => void;
  hideSpinner: () => void;
  api: MockAPI | (() => void);
}

const props: SearchDialogProps = {
  lexicon: 3,
  desiredTime: 100,
  questionsPerRound: 50,
  // eslint-disable-next-line no-console
  notifyError: (err: string) => { console.log('Mock notifyError: ', err); },
  redirectUrl: () => { },
  tablenum: 12,
  onLoadNewList: () => { },
  disabled: false,
  showSpinner: () => { },
  hideSpinner: () => { },
  api: () => { },
};

const apiSpy = sinon.stub().returns({
  then: sinon.stub().returns({
    catch: sinon.stub().returns({
      finally: sinon.stub(),
    }),
  }),
});

const propsWithSpy: SearchDialogProps = {
  ...props,
  api: {
    call: apiSpy,
  },
};

describe('<SearchDialogContainer />', () => {
  describe('Static Analysis', () => {
    it('renders correctly', () => {
      const container = render(<SearchDialogContainer {...props} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Data', () => {
    it('submits expected parameters to back-end', () => {
      render(<SearchDialogContainer {...propsWithSpy} />);

      // Simulate the click.
      fireEvent.click(screen.getByText('Play!'));

      sinon.assert.calledWith(apiSpy, '/wordwalls/api/new_search/', {
        lexicon: 3,
        searchCriteria: [{
          searchType: 1,
          minValue: 7,
          maxValue: 7,
        }, {
          searchType: 2,
          minValue: 1,
          maxValue: 200,
        }],
        desiredTime: 100,
        questionsPerRound: 50,
        tablenum: 12,
      });
    });
  });

  describe('Interactions', () => {
    it('adds a search row when button is clicked', () => {
      render(<SearchDialogContainer {...props} />);
      // The very first button should be a `+`
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(screen.getAllByRole('combobox').length).toBe(3);
    });
  });

  it('removes a search row when button is clicked', () => {
    render(<SearchDialogContainer {...props} />);
    // Click the second button (minus)
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(screen.getAllByRole('combobox').length).toBe(1);
  });

  it('submits more search parameters to api after button is clicked', () => {
    render(<SearchDialogContainer {...propsWithSpy} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getByText('Play!'));

    sinon.assert.calledWith(apiSpy, '/wordwalls/api/new_search/', {
      lexicon: 3,
      searchCriteria: [{
        searchType: 1,
        minValue: 7,
        maxValue: 7,
      }, {
        searchType: 2,
        minValue: 1,
        maxValue: 200,
      }, {
        searchType: 8,
        minValue: 2,
        maxValue: 30,
      }],
      desiredTime: 100,
      questionsPerRound: 50,
      tablenum: 12,
    });
  });

  it('does not ever add single-value word length selector', () => {
    render(<SearchDialogContainer {...props} />);
    for (let i = 0; i < 15; i += 1) {
      // Click 'add' a whole bunch of times.
      fireEvent.click(screen.getAllByRole('button')[0]);
    }
    expect(screen.getAllByText('Search Criterion').length).toBe(13);
    // And search specifically that fixed length wasn't rendered.
    // There's an extra searchrow from the hooks search dropdown.
    expect(screen.getAllByTestId(`searchrow-${SearchTypesEnum.LENGTH}`).length).toBe(14);
    expect(screen.findAllByTestId(`searchrow-${SearchTypesEnum.FIXED_LENGTH}`).length).toBe(undefined);
  });
});
