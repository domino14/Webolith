import { createContext, ReactNode, useEffect, useState } from "react";

export interface AppContextType {
  jwt: string;
  username: string;
  lexicon: string;
  setLexicon: (lex: string) => void;
}

const initialContext = {
  jwt: "",
  username: "",
  lexicon: "",
  setLexicon: () => {},
};

export const AppContext = createContext<AppContextType>(initialContext);

interface AppProviderProps {
  children: ReactNode;
}

function getUsnFromJwt(jwt: string): string | null {
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
    return payloadObject.usn || null;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

export const AppContextProvider: React.FC<AppProviderProps> = ({
  children,
}) => {
  const [jwt, setJwt] = useState("");
  const [username, setUsername] = useState("");
  const [lexicon, setLexicon] = useState("");
  useEffect(() => {
    const fetchJwt = async () => {
      try {
        const response = await fetch("/jwt");
        const data = await response.json();
        setJwt(data.token);
        setUsername(getUsnFromJwt(data.token) ?? "");
      } catch (error) {
        console.error("Error fetching JWT:", error);
      }
    };

    fetchJwt();
  }, []);

  return (
    <AppContext.Provider value={{ jwt, username, lexicon, setLexicon }}>
      {children}
    </AppContext.Provider>
  );
};
