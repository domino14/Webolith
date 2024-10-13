import "@mantine/core/styles.css";

import {
  ActionIcon,
  Alert,
  AppShell,
  Burger,
  Button,
  Group,
  NavLink,
  ScrollArea,
  Select,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import wordvault from "./assets/wordvault.png";
import { Text } from "@mantine/core";
import { Outlet, useLocation, useMatch } from "react-router-dom";
import { AppContext } from "./app_context";
import { useContext, useEffect, useState } from "react";
import { LoginState } from "./constants";
import { IconMoon, IconSun, IconUserQuestion } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import Cookies from "js-cookie";

// this can come from the backend later in some other way.
const lexMap = {
  NWL23: 24,
  CSW21: 18,
  FRA24: 23,
  Deutsch: 17,
};

function App() {
  const [opened, { toggle }] = useDisclosure();
  const { lexicon, defaultLexicon, setLexicon, loggedIn, setDefaultLexicon } =
    useContext(AppContext);
  const [showChangeLexLink, setShowChangeLexLink] = useState(false);
  const loginURL = `${window.location.protocol}//${window.location.host}/accounts/login?next=/wordvault`;
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (lexicon === "" || defaultLexicon === "") {
      return;
    }
    setShowChangeLexLink(lexicon !== defaultLexicon);
  }, [lexicon, defaultLexicon]);

  const changeDefaultLexicon = async (lexicon: string) => {
    const lexID = lexMap[lexicon as keyof typeof lexMap];
    try {
      const response = await fetch("/accounts/profile/set_default_lexicon/", {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
          "X-CSRFToken": Cookies.get("csrftoken") ?? "",
        }),
        body: JSON.stringify({ defaultLexicon: lexID }),
      });
      if (response?.status !== 200) {
        throw new Error("Got status " + response?.status);
      }
      setDefaultLexicon(lexicon);
    } catch (e) {
      notifications.show({
        color: "red",
        title: "Error",
        message: String(e),
      });
    }
  };
  const location = useLocation();
  const match = useMatch(location.pathname);

  return (
    <AppShell
      header={{ height: 72 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <img src={wordvault} width={48} />
            <Text size="xl">WordVault</Text>
          </Group>

          {/* Dark/Light mode toggle icon */}
          <ActionIcon
            variant="outline"
            color={isDark ? "yellow" : "blue"}
            onClick={() => toggleColorScheme()}
            title="Toggle color scheme"
          >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Select
            label="Lexicon"
            data={["NWL23", "CSW21", "FRA24", "Deutsch"]}
            value={lexicon}
            onChange={(val) => setLexicon(val ?? "")}
          />
          {showChangeLexLink && (
            <Button
              variant="transparent"
              onClick={() => changeDefaultLexicon(lexicon)}
            >
              Make default
            </Button>
          )}

          <NavLink
            href="load-scheduled-questions"
            label="Load scheduled questions"
            active={match?.pathname === "/load-scheduled-questions"}
          />
          <NavLink
            href="word-search"
            label="Add to WordVault"
            active={match?.pathname === "/word-search"}
          />
          <NavLink
            href="card-schedules"
            label="Scheduling"
            active={match?.pathname === "/card-schedules"}
          />
          <NavLink
            href="card-stats"
            label="Card statistics"
            active={match?.pathname === "/card-stats"}
          />
          <NavLink
            href="help"
            label={
              <>
                <IconUserQuestion />
                &nbsp; What is WordVault?
              </>
            }
            active={match?.pathname === "/help"}
          />
          <br />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {loggedIn === LoginState.NotLoggedIn ? (
          <Alert variant="light" color="red" title="Not logged in">
            You don't appear to be logged in to Aerolith. Please log in here:{" "}
            <a href={loginURL}>{loginURL}</a>
          </Alert>
        ) : null}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
