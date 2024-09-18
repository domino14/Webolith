import { useMemo } from 'react';

import { createConnectTransport } from '@connectrpc/connect-web';
import {
  createPromiseClient,
} from '@connectrpc/connect';

const loc = window.location;
const apiEndpoint = loc.host;

export const baseURL = `${loc.protocol}//${apiEndpoint}/word_db_server`;

export const transport = createConnectTransport({
  baseUrl: `${baseURL}/api/`,
  //   interceptors: [errorTranslator],
});

export const binaryTransport = createConnectTransport({
  baseUrl: `${loc.protocol}//${apiEndpoint}/api/`,
  useBinaryFormat: true,
});

export function useClient(
  service,
  binary = false,
) {
  const tf = binary ? binaryTransport : transport;
  return useMemo(() => createPromiseClient(service, tf), [service, tf]);
}

export const connectErrorMessage = (e) => e.rawMessage;
