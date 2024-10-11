import "@mantine/core/styles.css";

import {
  Alert,
  AppShell,
  Burger,
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
import { useContext, useEffect } from "react";
import { LoginState } from "./constants";

function App() {
  const [opened, { toggle }] = useDisclosure();
  const { lexicon, setLexicon, loggedIn } = useContext(AppContext);
  const loginURL = `${window.location.protocol}//${window.location.host}/accounts/login?next=/wordvault`;
  useEffect(() => {
    const fetchDefaultLexicon = async () => {
      try {
        const response = await fetch("/accounts/profile/default_lexicon");
        const data = await response.json();
        setLexicon(data.defaultLexicon);
      } catch (error) {
        console.error("Error fetching default lexicon:", error);
      }
    };
    fetchDefaultLexicon();
  }, [setLexicon]);

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
            data={["NWL23", "CSW21"]}
            value={lexicon}
            onChange={(val) => setLexicon(val ?? "")}
          />

          <NavLink
            href="load-scheduled-questions"
            label="Load scheduled questions"
          />
          <NavLink href="word-search" label="Add to WordVault" />
          <NavLink href="card-schedules" label="Scheduling" />
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
