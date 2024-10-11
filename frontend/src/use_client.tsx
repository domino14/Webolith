import { ServiceType } from "@bufbuild/protobuf";
import { createConnectTransport } from "@connectrpc/connect-web";
import { PromiseClient, createPromiseClient } from "@connectrpc/connect";
import { useMemo } from "react";

const loc = window.location;
const apiEndpoint = loc.host;

export const baseURL = `${loc.protocol}//${apiEndpoint}`;

export const transport = createConnectTransport({
  baseUrl: `${baseURL}/word_db_server/api`,
  //   interceptors: [errorTranslator],
});

export const binaryTransport = createConnectTransport({
  baseUrl: `${baseURL}/word_db_server/api`,
  useBinaryFormat: true,
});

export function useClient<T extends ServiceType>(
  service: T,
  binary = false
): PromiseClient<T> {
  const tf = binary ? binaryTransport : transport;
  return useMemo(() => createPromiseClient(service, tf), [service, tf]);
}
