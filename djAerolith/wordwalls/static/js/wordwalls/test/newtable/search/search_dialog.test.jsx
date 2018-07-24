import React from 'react';
import { render, shallow } from 'enzyme';
import sinon from 'sinon';

import SearchDialogContainer from '../../../newtable/search/dialog_container';
import SearchDialog from '../../../newtable/search/dialog';
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
      const apiSpy = sinon.spy();
      const propsWithSpy = {
        ...props,
        api: apiSpy,
      };
      const wrapper = shallow(<SearchDialogContainer {...propsWithSpy} />);

      wrapper
        .find(SearchDialog)
        .shallow().find('.submit-word-search')
        .simulate('click');
      expect(apiSpy).toHaveProperty('callCount', 1);
    });
  });
});
