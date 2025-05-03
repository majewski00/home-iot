import React, { useState, useEffect } from "react";
import { useJournalEntry } from "../hooks/useJournalEntry";
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { Journal, Field, FieldType, FieldValue } from "../types/journal.types";
import NumberField from "./fields/NumberField";
import CustomNumberField from "./fields/CustomNumberField";
import DateField from "./fields/DateField";
import LiteralField from "./fields/LiteralField";

interface JournalEntryFormProps {
  journal: Journal;
  date: string;
  onSave: () => void;
}

/**
 * Component for filling in a journal entry for a specific day
 */
const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  journal,
  date,
  onSave,
}) => {
  const { entry, isLoading, error, saveEntry } = useJournalEntry(journal, date);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>(
    {}
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize expanded state for all groups
  useEffect(() => {
    if (journal && journal.groups) {
      const initialExpandedState: Record<string, boolean> = {};
      journal.groups.forEach((group) => {
        initialExpandedState[group.id] = true;
      });
      setExpandedGroups(initialExpandedState);
    }
  }, [journal]);

  // Initialize field values from entry
  useEffect(() => {
    if (entry && entry.values) {
      const initialValues: Record<string, FieldValue> = {};
      entry.values.forEach((value) => {
        const key = `${value.fieldId}-${value.fieldTypeId}`;
        initialValues[key] = value;
      });
      setFieldValues(initialValues);
    } else {
      // Initialize empty values
      const initialValues: Record<string, FieldValue> = {};
      journal.groups.forEach((group) => {
        group.fields.forEach((field) => {
          field.fieldTypes.forEach((fieldType) => {
            const key = `${field.id}-${fieldType.id}`;
            initialValues[key] = {
              id: "",
              entryId: "",
              fieldId: field.id,
              fieldTypeId: fieldType.id,
              value: null,
              filled: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          });
        });
      });
      setFieldValues(initialValues);
    }
  }, [entry, journal]);

  // Toggle group expansion
  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Handle field filled state change
  const handleFilledChange = (
    fieldId: string,
    fieldTypeId: string,
    filled: boolean
  ) => {
    const key = `${fieldId}-${fieldTypeId}`;
    setFieldValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        filled,
      },
    }));
  };

  // Handle field value change
  const handleValueChange = (
    fieldId: string,
    fieldTypeId: string,
    value: string | number | null
  ) => {
    const key = `${fieldId}-${fieldTypeId}`;
    setFieldValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  // Save journal entry
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      // Convert field values to array
      const values = Object.values(fieldValues);

      // Save entry
      const result = await saveEntry(values);
      if (result) {
        onSave();
      } else {
        setSaveError("Failed to save journal entry");
      }
    } catch (err) {
      setSaveError("An error occurred while saving");
      console.error("Error saving journal entry:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Render field input based on field type
  const renderFieldInput = (field: Field, fieldType: FieldType) => {
    const key = `${field.id}-${fieldType.id}`;
    const fieldValue = fieldValues[key];

    if (!fieldValue) return null;

    const { filled, value } = fieldValue;

    if (!filled) return null;

    switch (fieldType.kind) {
      case "NUMBER":
        return (
          <NumberField
            value={value as number | null}
            onChange={(newValue) =>
              handleValueChange(field.id, fieldType.id, newValue)
            }
            label={fieldType.name || field.name}
            dataType={fieldType.dataType}
          />
        );
      case "CUSTOM_NUMBER":
        return (
          <CustomNumberField
            value={value as number | null}
            onChange={(newValue) =>
              handleValueChange(field.id, fieldType.id, newValue)
            }
            label={fieldType.name || field.name}
            dataType={fieldType.dataType}
          />
        );
      case "DATE":
        return (
          <DateField
            value={value as string | null}
            onChange={(newValue) =>
              handleValueChange(field.id, fieldType.id, newValue)
            }
            label={fieldType.name || field.name}
            date={date}
          />
        );
      case "LITERAL":
        return (
          <LiteralField
            value={value as string | null}
            onChange={(newValue) =>
              handleValueChange(field.id, fieldType.id, newValue)
            }
            label={fieldType.name || field.name}
          />
        );
      default:
        return (
          <TextField
            fullWidth
            label={fieldType.name || field.name}
            value={value || ""}
            onChange={(e) =>
              handleValueChange(field.id, fieldType.id, e.target.value)
            }
            margin="normal"
            size="small"
          />
        );
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Fill in Your Journal</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onSave}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
        <Typography variant="body2" color="textSecondary" paragraph>
          Fill in the fields below for your journal entry. Toggle the YES/NO
          checkbox to fill in a field. Fields are optional and will default to
          "--" if not filled.
        </Typography>
      </Paper>

      <Box mt={3}>
        {journal.groups.map((group) => {
          const hasFields = group.fields.length > 0;
          if (!hasFields) return null;

          return (
            <Accordion
              key={group.id}
              expanded={expandedGroups[group.id] || false}
              onChange={() => handleToggleGroup(group.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{group.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {group.fields.map((field) => (
                  <Box key={field.id} mb={3}>
                    <Typography variant="subtitle2">{field.name}</Typography>
                    <Divider sx={{ my: 1 }} />

                    {field.fieldTypes.map((fieldType) => {
                      const key = `${field.id}-${fieldType.id}`;
                      const fieldValue = fieldValues[key];

                      if (!fieldValue) return null;

                      return (
                        <Box key={fieldType.id} mb={2}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={fieldValue.filled}
                                  onChange={(e) =>
                                    handleFilledChange(
                                      field.id,
                                      fieldType.id,
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label={
                                <Typography variant="body2">
                                  {fieldType.name || field.name}
                                  {fieldType.dataType &&
                                    ` (${fieldType.dataType})`}
                                </Typography>
                              }
                            />
                          </Box>

                          {fieldValue.filled && (
                            <Box ml={4}>
                              {renderFieldInput(field, fieldType)}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Journal Entry"}
        </Button>
      </Box>
    </Box>
  );
};

export default JournalEntryForm;
