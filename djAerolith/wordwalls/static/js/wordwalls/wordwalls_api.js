/**
 * The non-RPC API for general Wordwalls functionality. For the most part,
 * this is limited to stuff like configuring new tables, making word
 * list searches, new challenges, etc.
 *
 * Might move this over to RPC eventually.
 */
import _ from 'underscore';
import qs from 'qs';
import Cookies from 'js-cookie';

class WordwallsAPI {
  constructor() {
    this.fetchInit = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken'),
      }),
      credentials: 'include',
    };
  }

  fetchdata(params) {
    return _.extend(this.fetchInit, {
      body: JSON.stringify(params),
    });
  }

  fetchdataLegacy(params) {
    return _.extend(this.fetchInit, {
      body: qs.stringify(params),
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': Cookies.get('csrftoken'),
      }),
    });
  }

  async call(path, params) {
    // eslint-disable-next-line compat/compat
    const response = await fetch(path, this.fetchdata(params));
    const data = await response.json();
    if (response.ok) {
      return data;
    }
    // Otherwise, there is an error.
    // XXX: TODO standardize error return API.
    throw new Error(data.error || data);
  }

  async callLegacy(path, params) {
    // eslint-disable-next-line compat/compat
    const response = await fetch(path, this.fetchdataLegacy(params));
    const data = await response.json();
    if (response.ok) {
      return data;
    }
    throw new Error(data.error);
  }
}

export default WordwallsAPI;
