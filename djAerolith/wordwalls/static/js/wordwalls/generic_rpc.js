import WordwallsAPI from './wordwalls_api';

function uniqueId() {
  return Math.random().toString(36).substring(2)
    + (new Date()).getTime().toString(36);
}

class GenericRPC extends WordwallsAPI {
  /**
   * Generate a JSON RPC data packet.
   */
  constructor(rpcURL) {
    super();
    this.RPCURL = rpcURL || null;
  }

  setRPCURL(url) {
    this.RPCURL = url;
  }

  fetchdata(method, params) {
    return {
      ...this.fetchInit,
      body: JSON.stringify({
        id: uniqueId(),
        jsonrpc: '2.0',
        method,
        params,
      }),
    };
  }

  async rpcwrap(method, params) {
    if (!this.RPCURL) {
      await Promise.reject(new Error('No RPC URL was set.'));
    }
    // eslint-disable-next-line compat/compat
    const response = await fetch(this.RPCURL, this.fetchdata(method, params));
    const data = await response.json();
    if (response.ok && data.result) {
      // Use the `result` key - since this is JSONRPC
      return data.result;
    }
    // Otherwise, there's an error.
    throw new Error(data.error.message);
  }
}

export default GenericRPC;
