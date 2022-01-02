/* eslint-disable import/no-extraneous-dependencies */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
// Setup enzyme's react adapter
Enzyme.configure({ adapter: new Adapter() });
// Mocking the Headers from fetch
global.Headers = () => {};
