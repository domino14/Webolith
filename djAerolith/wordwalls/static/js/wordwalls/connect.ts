import { useMemo } from 'react';

import { createConnectTransport } from '@connectrpc/connect-web';
import {
  createPromiseClient,
  PromiseClient,
  ConnectError,
} from '@connectrpc/connect';
import type { ServiceType } from '@bufbuild/protobuf';

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

export function useClient<T extends ServiceType>(
  service: T,
  binary = false,
): PromiseClient<T> {
  const tf = binary ? binaryTransport : transport;
  return useMemo(() => createPromiseClient(service, tf), [service, tf]);
}

export const connectErrorMessage = (e: unknown): string => {
  if (e instanceof ConnectError) {
    return e.rawMessage;
  }
  return String(e);
};