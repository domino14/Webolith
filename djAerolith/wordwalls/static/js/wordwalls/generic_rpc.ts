import WordwallsAPI from './wordwalls_api';

function uniqueId(): string {
  return Math.random().toString(36).substring(2) + new Date().getTime().toString(36);
}

class GenericRPC extends WordwallsAPI {
  private RPCURL: string | null;

  /**
   * Generate a JSON RPC data packet.
   */
  constructor(rpcURL?: string) {
    super();
    this.RPCURL = rpcURL || null;
  }

  setRPCURL(url: string): void {
    this.RPCURL = url;
  }

  private fetchdataRPC(
    method: string,
    params: Record<string, unknown>,
  ): RequestInit & { body: string } {
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

  async rpcwrap(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.RPCURL) {
       
      await Promise.reject(new Error('No RPC URL was set.'));
    }
     
    const response = await fetch(this.RPCURL!, this.fetchdataRPC(method, params));
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
