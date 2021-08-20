import React from 'react';
import { render, mount } from 'enzyme';
import sinon from 'sinon';

import SearchDialogContainer from '../../../newtable/search/dialog_container';
import SearchRow from '../../../newtable/search/row';
import { SearchTypesEnum } from '../../../newtable/search/types';

const props = {
  lexicon: 3,
  desiredTime: 100,
  questionsPerRound: 50,
  // eslint-disable-next-line no-console
  notifyError: (err) => { console.log('Mock notifyError: ', err); },
  redirectUrl: () => {},
  tablenum: 12,
  onLoadNewList: () => {},
  disabled: false,
  showSpinner: () => {},
  hideSpinner: () => {},
  api: () => {},
};

const apiSpy = sinon.stub().returns({
  then: sinon.stub().returns({
    catch: sinon.stub().returns({
      finally: sinon.stub(),
    }),
  }),
});

const propsWithSpy = {
  ...props,
  api: {
    call: apiSpy,
  },
};

describe('<SearchDialogContainer />', () => {
  describe('Static Analysis', () => {
    it('renders two search criteria by default', () => {
      const wrapper = render(<SearchDialogContainer {...props} />);
      expect(wrapper.find('.search-row').length).toBe(2);
    });

    it('does not render single-value word length selector', () => {
      const wrapper = render(<SearchDialogContainer {...props} />);
      const selectOptions = wrapper.find('.search-row').eq(0).find('select option');
      const optionSet = new Set();
      selectOptions.each((idx, el) => {
        optionSet.add(parseInt(el.attribs.value, 10));
      });
      expect(optionSet.has(SearchTypesEnum.FIXED_LENGTH)).toBeFalsy();
      expect(optionSet.has(SearchTypesEnum.LENGTH)).toBeTruthy();
    });
  });

  describe('Data', () => {
    it('submits expected parameters to back-end', () => {
      const wrapper = mount(<SearchDialogContainer {...propsWithSpy} />);
      // Simulate the click.
      wrapper.find('.submit-word-search').simulate('click');

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
      wrapper.unmount();
    });
  });

  describe('Interactions', () => {
    it('adds a search row when button is clicked', () => {
      const wrapper = mount(<SearchDialogContainer {...props} />);
      wrapper.find('.btn-add-search-row').at(0).simulate('click');
      expect(wrapper.find(SearchRow).length).toBe(3);
      wrapper.unmount();
    });

    it('removes a search row when button is clicked', () => {
      const wrapper = mount(<SearchDialogContainer {...props} />);
      wrapper.find('.btn-remove-search-row').at(0).simulate('click');
      expect(wrapper.find(SearchRow).length).toBe(1);
      wrapper.unmount();
    });

    it('submits more search parameters to api after button is clicked', () => {
      const wrapper = mount(<SearchDialogContainer {...propsWithSpy} />);
      wrapper.find('.btn-add-search-row').at(0).simulate('click');
      wrapper.find('.submit-word-search').simulate('click');

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
      wrapper.unmount();
    });

    it('does not ever add single-value word length selector', () => {
      const wrapper = mount(<SearchDialogContainer {...props} />);
      for (let i = 0; i < 15; i += 1) {
        // Click 'add' a whole bunch of times.
        wrapper.find('.btn-add-search-row').at(0).simulate('click');
      }
      expect(wrapper.find(SearchRow).length).toBe(10);
      // And search specifically that fixed length wasn't rendered.
      const selectOptions = wrapper.find('.search-row').at(0).find('select option');
      const optionSet = new Set();
      selectOptions.forEach((node) => optionSet.add(parseInt(node.props().value, 10)));

      expect(optionSet.has(SearchTypesEnum.FIXED_LENGTH)).toBeFalsy();
      expect(optionSet.has(SearchTypesEnum.LENGTH)).toBeTruthy();

      wrapper.unmount();
    });
  });
});
