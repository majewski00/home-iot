import React, { useState } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Collapse,
} from "@mui/material";
import { Field, FieldType, FieldValue } from "@src-types/journal/journal.types";
import NumberField from "./fields/NumberField";

interface JournalFieldInputProps {
  field: Field;
  values: FieldValue[];
  onUpdateValue: (
    fieldData: Omit<FieldValue, "createdAt" | "updatedAt">
  ) => Promise<FieldValue | null>;
  disabled?: boolean;
}

/**
 * Component for displaying and editing a journal field
 * Handles YES/NO toggle and renders appropriate field type inputs
 */
const JournalFieldInput: React.FC<JournalFieldInputProps> = ({
  field,
  values,
  onUpdateValue,
  disabled = false,
}) => {
  // Find if any values are filled
  const isFilled = values.some((value) => value.filled);
  const [expanded, setExpanded] = useState<boolean>(isFilled);

  const handleToggleChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newFilled = event.target.checked;
    setExpanded(newFilled);

    // Update all field types for this field
    for (const fieldType of field.fieldTypes) {
      const value = values.find((v) => v.fieldTypeId === fieldType.id);
      if (value) {
        await onUpdateValue({
          groupId: field.groupId,
          fieldId: field.id,
          fieldTypeId: fieldType.id,
          value: value.value,
          filled: newFilled,
        });
      }
    }
  };

  const handleFieldTypeValueChange = async (
    fieldType: FieldType,
    newValue: string | number | null
  ) => {
    const value = values.find((v) => v.fieldTypeId === fieldType.id);
    if (value) {
      await onUpdateValue({
        groupId: field.groupId,
        fieldId: field.id,
        fieldTypeId: fieldType.id,
        value: newValue,
        filled: true, // If a value is set, mark as filled
      });
    }
  };

  // Render the appropriate field type input component
  const renderFieldTypeInput = (fieldType: FieldType, value: FieldValue) => {
    switch (fieldType.kind) {
      case "NUMBER":
        return (
          <NumberField
            key={fieldType.id}
            value={value.value as number | null}
            onChange={(newValue) =>
              handleFieldTypeValueChange(fieldType, newValue)
            }
            label={fieldType.description}
            dataType={fieldType.dataType}
            disabled={disabled}
          />
        );
      // For now, we'll use NumberField for all types
      // We'll implement the other field types later
      case "CUSTOM_NUMBER":
      case "DATE":
      case "LITERAL":
      case "CHECK":
      default:
        return (
          <NumberField
            key={fieldType.id}
            value={value.value as number | null}
            onChange={(newValue) =>
              handleFieldTypeValueChange(fieldType, newValue)
            }
            label={fieldType.description}
            dataType={fieldType.dataType}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none", // Remove any shadow
        borderWidth: "1px", // Thinner border
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium">
          {field.name}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isFilled}
              onChange={handleToggleChange}
              disabled={disabled}
              color="primary"
            />
          }
          label={isFilled ? "YES" : "NO"}
          labelPlacement="start"
        />
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, pl: 1 }}>
          {field.fieldTypes.map((fieldType) => {
            const value = values.find((v) => v.fieldTypeId === fieldType.id);
            if (!value) return null;
            return renderFieldTypeInput(fieldType, value);
          })}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default JournalFieldInput;
