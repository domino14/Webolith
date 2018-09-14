/**
 * The non-RPC API for general Wordwalls functionality. For the most part,
 * this is limited to stuff like configuring new tables, making word
 * list searches, new challenges, etc.
 *
 * Might move this over to RPC eventually.
 */
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

  fetchdata(params, method) {
    // Note that we default to POST. A lot of these API requests are not
    // idempotent, for example, making a new search should look like a GET,
    // but a lot of the time it can result in creating a new table.
    return {
      ...this.fetchInit,
      body: method !== 'GET' ? JSON.stringify(params) : null,
      method: method || 'POST',
    };
  }

  fetchdataLegacy(params) {
    return {
      ...this.fetchInit,
      body: qs.stringify(params),
      headers: new Headers({
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': Cookies.get('csrftoken'),
      }),
    };
  }

  async call(path, params, method) {
    let p = '';
    if (method === 'GET') {
      p = `?${qs.stringify(params)}`;
    }
    // eslint-disable-next-line compat/compat
    const response = await fetch(`${path}${p}`, this.fetchdata(params, method));
    const data = await response.json();
    if (response.ok) {
      return data;
    }
    // Otherwise, there is an error.
    // XXX: TODO standardize error return API.
    throw new Error(data.error || data);
  }

  /**
   * Aerolith has a legacy API that I need to slowly get rid of. It uses
   * a x-www-form-urlencoded content type and POST.
   * @param {string} path
   * @param {Object} params
   */
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
