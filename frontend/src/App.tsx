import "@mantine/core/styles.css";

import {
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
import { AppContext, AppContextProvider } from "./app_context";
import { useContext, useEffect, useState } from "react";

function App() {
  const [opened, { toggle }] = useDisclosure();
  const { lexicon, setLexicon } = useContext(AppContext);

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
          <NavLink href="scheduling" label="Scheduling" />
          <br />
        </AppShell.Section>
        <AppShell.Section>Settings</AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
// console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
