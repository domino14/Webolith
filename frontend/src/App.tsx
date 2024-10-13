import "@mantine/core/styles.css";

import {
  Alert,
  AppShell,
  Burger,
  Button,
  Group,
  NavLink,
  ScrollArea,
  Select,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import wordvault from "./assets/wordvault.png";
import { Text } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { AppContext } from "./app_context";
import { useContext, useEffect, useState } from "react";
import { LoginState } from "./constants";
import { IconUserQuestion } from "@tabler/icons-react";
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
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <img src={wordvault} width={76} />
          <Text size="xl">WordVault</Text>
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
          />
          <NavLink href="word-search" label="Add to WordVault" />
          <NavLink href="card-schedules" label="Scheduling" />
          <NavLink href="card-stats" label="Card statistics" />
          <NavLink
            href="help"
            label={
              <>
                <IconUserQuestion />
                &nbsp; What is WordVault?
              </>
            }
          />
          <br />
        </AppShell.Section>
        <AppShell.Section>Settings</AppShell.Section>
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
