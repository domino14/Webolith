import { createContext, ReactNode, useEffect, useState } from "react";
import { LoginState } from "./constants";

export interface AppContextType {
  jwt: string;
  username: string;
  lexicon: string;
  setLexicon: (lex: string) => void;
  loggedIn: LoginState;
}

const initialContext = {
  jwt: "",
  jwtExpiry: 0,
  username: "",
  lexicon: "",
  setLexicon: () => {},
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
  const [loginState, setLoginState] = useState(LoginState.Unknown);

  useEffect(() => {
    const renewJwt = async () => {
      try {
        const response = await fetch("/jwt_extend/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setJwt(data.token);
          const [usn, exp] = getUsnAndExp(data.token);
          setUsername(usn ?? "");
          setTokenExpiry(exp ?? 0);
        } else {
          console.error("Failed to renew JWT", response.status);
          setLoginState(LoginState.NotLoggedIn); // Log the user out if JWT renewal fails
        }
      } catch (error) {
        console.error("Error renewing JWT:", error);
      }
    };

    const scheduleJwtRenewal = () => {
      if (!jwt || tokenExpiry === 0) return;

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = tokenExpiry - currentTime;

      if (timeUntilExpiry > 0) {
        const renewalTime = timeUntilExpiry - 60 * JWTRenewalMinutes;
        if (renewalTime > 0) {
          console.log("Renewing JWT in", renewalTime, "seconds");
          setTimeout(renewJwt, renewalTime * 1000);
        } else {
          // If it's already less than 3 minutes from expiry, renew immediately
          renewJwt();
        }
      }
    };

    scheduleJwtRenewal(); // Call this when tokenExpiry or jwt changes
  }, [jwt, tokenExpiry]);

  useEffect(() => {
    const fetchJwt = async () => {
      let response;
      try {
        response = await fetch("/jwt");
        if (response?.status === 401) {
          setLoginState(LoginState.NotLoggedIn);
          return;
        }
        const data = await response.json();
        setJwt(data.token);
        const [usn, exp] = getUsnAndExp(data.token);
        setUsername(usn ?? "");
        setTokenExpiry(exp ?? 0);
        setLoginState(LoginState.LoggedIn);
      } catch (error) {
        console.error("Error fetching JWT:", error);
      }
    };

    fetchJwt();
  }, []);

  return (
    <AppContext.Provider
      value={{ jwt, username, lexicon, setLexicon, loggedIn: loginState }}
    >
      {children}
    </AppContext.Provider>
  );
};
