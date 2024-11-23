import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { LoginState } from "./constants";

export enum FontStyle {
  Monospace = "monospace",
  SansSerif = "sans-serif",
}

/**
 * Control the display of the tiles on flashcards, if enabled. Currently only
 * one format is supported but can be extended to allow for more customization
 * in the future.
 */
export enum TileStyle {
  /**
   * Don't render tiles at all -- render as free text
   */
  None = "none",
  /**
   * Match the dark/light mode display setting by default
   */
  MatchDisplay = "match-display",
}

export type DisplaySettings = {
  /**
   * Controls the display of the question text on flash cards
   */
  fontStyle: FontStyle;
  /**
   * If non-null, controls the display of styles according to
   * TileStyle. If null, card will not be rendered as tiles at all.
   */
  tileStyle: TileStyle;
  showNumAnagrams: boolean;
  customOrder: string;
};

export interface AppContextType {
  jwt: string;
  username: string;
  isMember: boolean;
  lexicon: string;
  defaultLexicon: string;
  setLexicon: (lex: string) => void;
  setDefaultLexicon: (lex: string) => void;
  loggedIn: LoginState;
  fetchJwt: () => Promise<string>;
  displaySettings: DisplaySettings;
  setDisplaySettings: (d: DisplaySettings) => void;
}

const initialContext = {
  jwt: "",
  jwtExpiry: 0,
  username: "",
  lexicon: "",
  isMember: false,
  defaultLexicon: "",
  setLexicon: () => {},
  setDefaultLexicon: () => {},
  fetchJwt: async (): Promise<string> => {
    return "";
  },
  loggedIn: LoginState.Unknown,
  displaySettings: {
    fontStyle: FontStyle.Monospace,
    tileStyle: TileStyle.None,
    showNumAnagrams: true,
    customOrder: "",
  },
  setDisplaySettings: () => {},
};

export const AppContext = createContext<AppContextType>(initialContext);

const JWTRenewalMinutes = 10; // Trigger renewal this many minutes before expiry

interface AppProviderProps {
  children: ReactNode;
}

function getUsnAndExp(jwt: string): [string, number, boolean] {
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
    return [
      payloadObject.usn || "",
      payloadObject.exp || 0,
      payloadObject.mbr || false,
    ];
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return ["", 0, false];
  }
}

export const AppContextProvider: React.FC<AppProviderProps> = ({
  children,
}) => {
  const [jwt, setJwt] = useState("");
  const [username, setUsername] = useState("");
  const [tokenExpiry, setTokenExpiry] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [lexicon, setLexicon] = useState("");
  const [defaultLexicon, setDefaultLexicon] = useState("");
  const [loginState, setLoginState] = useState(LoginState.Unknown);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
    initialContext.displaySettings
  );

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
      const [usn, exp, mbr] = getUsnAndExp(data.token);
      setUsername(usn ?? "");
      setTokenExpiry(exp ?? 0);
      setIsMember(mbr);
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

  // Fetch wordvault display settings on login, from the Aerolith API.
  useEffect(() => {
    const fetchDisplaySettings = async () => {
      try {
        const response = await fetch("/accounts/profile/wordvault_settings");
        let data = await response.json();
        if (!Object.keys(data).length) {
          data = {
            ...initialContext.displaySettings,
          };
        } else {
          data = {
            ...data,
            // Coerce tile/display style into correct defaults if the existing
            // value is invalid
            tileStyle: Object.values(TileStyle).includes(data.tileStyle)
              ? data.tileStyle
              : initialContext.displaySettings.tileStyle,
            fontStyle: Object.values(FontStyle).includes(data.fontStyle)
              ? data.fontStyle
              : initialContext.displaySettings.fontStyle,
          };
        }
        setDisplaySettings(data);
      } catch (error) {
        console.error("Error fetching default lexicon:", error);
      }
    };

    if (loginState === LoginState.LoggedIn) {
      fetchDisplaySettings();
    }
  }, [loginState]);

  return (
    <AppContext.Provider
      value={{
        jwt,
        username,
        lexicon,
        isMember,
        setLexicon,
        setDefaultLexicon,
        loggedIn: loginState,
        fetchJwt,
        defaultLexicon,
        displaySettings,
        setDisplaySettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
