import { useForm } from "@mantine/form";
import React, { useCallback, useContext, useEffect } from "react";
import { AppContext } from "./app_context";
import { Button, Select, Switch, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";

const Settings: React.FC = () => {
  const settingsForm = useForm({
    initialValues: {
      fontStyle: "monospace",
      tileStyle: "",
      showNumAnagrams: true,
      customOrder: "",
    },
  });
  const { displaySettings } = useContext(AppContext);
  const { setValues } = settingsForm;
  // When displaySettings change, update the form with the new values
  useEffect(() => {
    if (displaySettings) {
      setValues(displaySettings);
    }
  }, [displaySettings, setValues]);

  return (
    <div style={{ maxWidth: 400 }}>
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
        })}
      >
        {/* Add form fields here, for example: */}
        <Select
          data={["monospace", "sans-serif"]}
          label="Question display style"
          {...settingsForm.getInputProps("fontStyle")}
        />
        <Switch
          checked={settingsForm.values.showNumAnagrams} // Bind to checked
          {...settingsForm.getInputProps("showNumAnagrams")}
          mt="md"
          label="Show number of words in cards"
        />
        <TextInput
          type="text"
          {...settingsForm.getInputProps("customOrder")}
          label="Custom letter order. Leave blank to use alphabetical."
          placeholder="AEIOU..."
          mt="md"
        />
        <Button type="submit" mt="md">
          Save
        </Button>
      </form>
    </div>
  );
};

export default Settings;
