import { useForm } from "@mantine/form";
import React, { useContext, useEffect } from "react";
import {
  AppContext,
  FontStyle,
  DisplaySettings,
  TileStyle,
} from "./app_context";
import { Button, Select, Switch, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";

const Settings: React.FC = () => {
  const settingsForm = useForm<DisplaySettings>({
    initialValues: {
      fontStyle: FontStyle.Monospace,
      tileStyle: TileStyle.None,
      showNumAnagrams: true,
      customOrder: "",
    },
  });
  const { displaySettings, setDisplaySettings } = useContext(AppContext);
  const { setValues } = settingsForm;
  // When displaySettings change, update the form with the new values
  useEffect(() => {
    if (displaySettings) {
      setValues(displaySettings);
    }
  }, [displaySettings, setValues]);

  return (
    <div style={{ maxWidth: 400 }}>
      <Text size="xl">Display Settings</Text>
      <form
        onSubmit={settingsForm.onSubmit(async (values) => {
          const response = await fetch("/accounts/profile/wordvault_settings", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          });

          if (!response.ok) {
            throw new Error("Failed to save settings.");
          }

          notifications.show({
            message: "Settings saved successfully!",
            color: "green",
            title: "Success",
          });
          setDisplaySettings(values);
        })}
      >
        {/* Add form fields here, for example: */}
        <Select
          data={[
            {
              value: FontStyle.Monospace,
              label: "Monospace",
            },
            {
              value: FontStyle.SansSerif,
              label: "Sans-serif",
            },
          ]}
          label="Question font style"
          {...settingsForm.getInputProps("fontStyle")}
          mt="lg"
        />
        <Select
          data={[
            {
              value: TileStyle.None,
              label: "None",
            },
            {
              value: TileStyle.MatchDisplay,
              label: "Match dark/light mode",
            },
            {
              value: TileStyle.Blue,
              label: "Blue",
            },
            {
              value: TileStyle.Orange,
              label: "Orange",
            },
            {
              value: TileStyle.Yellow,
              label: "Yellow",
            },
            {
              value: TileStyle.Green,
              label: "Green",
            },
            {
              value: TileStyle.Pink,
              label: "Pink",
            },
            {
              value: TileStyle.Violet,
              label: "Violet",
            },
            {
              value: TileStyle.Red,
              label: "Red",
            },
          ]}
          label="Question tile style"
          {...settingsForm.getInputProps("tileStyle")}
          mt="lg"
        />
        <Switch
          checked={settingsForm.values.showNumAnagrams} // Bind to checked
          {...settingsForm.getInputProps("showNumAnagrams")}
          mt="lg"
          label="Show number of words in cards"
        />
        <TextInput
          type="text"
          {...settingsForm.getInputProps("customOrder")}
          label="Custom letter order. Leave blank to use alphabetical. All letters not specified will be in alphabetical order."
          placeholder="AEIOU..."
          mt="lg"
          size="lg"
        />
        <Button type="submit" mt="lg">
          Save
        </Button>
      </form>
    </div>
  );
};

export default Settings;
