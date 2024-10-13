import { ServiceType } from "@bufbuild/protobuf";
import { createConnectTransport } from "@connectrpc/connect-web";
import {
  Code,
  ConnectError,
  Interceptor,
  PromiseClient,
  createPromiseClient,
} from "@connectrpc/connect";
import { useContext, useMemo } from "react";
import { AppContext } from "./app_context";

const loc = window.location;
const apiEndpoint = loc.host;

export const baseURL = `${loc.protocol}//${apiEndpoint}`;

const authInterceptor = (
  resolveJwt: () => string,
  fetchJwt: () => Promise<string>
): Interceptor => {
  return (next) => async (request) => {
    let jwt = resolveJwt();
    // Set the Authorization header directly on request.header
    if (jwt) {
      request.header.set("Authorization", `Bearer ${jwt}`);
    }

    let retried = false;

    const makeRequest = async () => {
      try {
        return await next(request);
      } catch (err) {
        if (
          err instanceof ConnectError &&
          err.code === Code.Unauthenticated &&
          !retried
        ) {
          retried = true;
          jwt = await fetchJwt(); // Refresh the JWT
          if (jwt) {
            request.header.set("Authorization", `Bearer ${jwt}`);
          }
          return await next(request); // Retry the request
        } else {
          throw err;
        }
      }
    };

    return await makeRequest();
  };
};

export function useClient<T extends ServiceType>(
  service: T,
  binary = false
): PromiseClient<T> {
  const { jwt, fetchJwt } = useContext(AppContext);
  const tf = useMemo(() => {
    const transportOptions = {
      baseUrl: `${baseURL}/word_db_server/api`,
      interceptors: [authInterceptor(() => jwt, fetchJwt)],
      useBinaryFormat: binary,
    };
    return createConnectTransport(transportOptions);
  }, [jwt, binary, fetchJwt]);

  return useMemo(() => createPromiseClient(service, tf), [service, tf]);
}
