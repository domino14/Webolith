import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { LoginState } from "./constants";

export interface AppContextType {
  jwt: string;
  username: string;
  lexicon: string;
  defaultLexicon: string;
  setLexicon: (lex: string) => void;
  setDefaultLexicon: (lex: string) => void;
  loggedIn: LoginState;
  fetchJwt: () => Promise<string>;
}

const initialContext = {
  jwt: "",
  jwtExpiry: 0,
  username: "",
  lexicon: "",
  defaultLexicon: "",
  setLexicon: () => {},
  setDefaultLexicon: () => {},
  fetchJwt: async (): Promise<string> => {
    return "";
  },
  loggedIn: LoginState.Unknown,
};

export const AppContext = createContext<AppContextType>(initialContext);

const JWTRenewalMinutes = 10; // Trigger renewal this many minutes before expiry

interface AppProviderProps {
  children: ReactNode;
}

function getUsnAndExp(jwt: string): [string, number] {
  try {
    // Split the JWT into its parts
    const parts = jwt.split(".");

    // The payload is the second part of the JWT
    const payload = parts[1];

    // Decode the Base64URL encoded payload
    const decodedPayload = window.atob(
      payload.replace(/-/g, "+").replace(/_/g, "/")
    );

    // Parse the JSON payload
    const payloadObject = JSON.parse(decodedPayload);

    // Extract the 'usn' claim
    return [payloadObject.usn || "", payloadObject.exp || 0];
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return ["", 0];
  }
}

export const AppContextProvider: React.FC<AppProviderProps> = ({
  children,
}) => {
  const [jwt, setJwt] = useState("");
  const [username, setUsername] = useState("");
  const [tokenExpiry, setTokenExpiry] = useState(0);
  const [lexicon, setLexicon] = useState("");
  const [defaultLexicon, setDefaultLexicon] = useState("");
  const [loginState, setLoginState] = useState(LoginState.Unknown);

  const fetchJwt = useCallback(async () => {
    console.log("Fetching JWT from backend");
    let response;
    try {
      response = await fetch("/jwt");
      if (response?.status === 401) {
        setLoginState(LoginState.NotLoggedIn);
        return "";
      }
      const data = await response.json();
      setJwt(data.token);
      const [usn, exp] = getUsnAndExp(data.token);
      setUsername(usn ?? "");
      setTokenExpiry(exp ?? 0);
      setLoginState(LoginState.LoggedIn);
      return data.token;
    } catch (error) {
      console.error("Error fetching JWT:", error);
    }
    return "";
  }, []);

  const scheduleJwtRenewal = useCallback(() => {
    if (!jwt || tokenExpiry === 0) return;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = tokenExpiry - currentTime;
    if (timeUntilExpiry > 0) {
      const renewalTime = timeUntilExpiry - 60 * JWTRenewalMinutes;
      if (renewalTime > 0) {
        console.log("Renewing JWT in", renewalTime, "seconds");
        setTimeout(fetchJwt, renewalTime * 1000);
      } else {
        // If it's already less than 3 minutes from expiry, renew right away.
        setTimeout(fetchJwt, 1000);
      }
    }
  }, [fetchJwt, jwt, tokenExpiry]);

  useEffect(() => {
    scheduleJwtRenewal();
  }, [scheduleJwtRenewal]);

  useEffect(() => {
    fetchJwt();
  }, [fetchJwt]);

  // Fetch default lexicon on login
  useEffect(() => {
    const fetchDefaultLexicon = async () => {
      try {
        const response = await fetch("/accounts/profile/default_lexicon");
        const data = await response.json();
        setLexicon(data.defaultLexicon);
        setDefaultLexicon(data.defaultLexicon);
      } catch (error) {
        console.error("Error fetching default lexicon:", error);
      }
    };

    if (loginState === LoginState.LoggedIn) {
      fetchDefaultLexicon();
    }
  }, [loginState]);

  return (
    <AppContext.Provider
      value={{
        jwt,
        username,
        lexicon,
        setLexicon,
        setDefaultLexicon,
        loggedIn: loginState,
        fetchJwt,
        defaultLexicon,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
