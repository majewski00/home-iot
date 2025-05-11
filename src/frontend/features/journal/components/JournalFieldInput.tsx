import React, { useState } from "react";
import { Box, Typography, Paper, Collapse } from "@mui/material";
import { Field, FieldType, FieldValue } from "@src-types/journal/journal.types";
import FieldTypeFactory from "./fields/FieldTypeFactory";
import { CheckFieldView } from "./fields/types/CheckField";

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
  // Find the CHECK field type
  const checkFieldType = field.fieldTypes.find((ft) => ft.kind === "CHECK");
  const checkValue = checkFieldType
    ? values.find((v) => v.fieldTypeId === checkFieldType.id)
    : null;

  // Other field types
  const otherFieldTypes = field.fieldTypes.filter((ft) => ft.kind !== "CHECK");

  // Check if any values are filled
  const isFilled = checkValue?.filled || false;
  const [expanded, setExpanded] = useState<boolean>(isFilled);

  // Handle toggle change
  const handleToggleChange = async (newFilled: boolean) => {
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

  // Handle field type value change
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

        {/* CHECK field type */}
        {checkFieldType && checkValue && (
          <CheckFieldView
            value={checkValue.filled}
            onChange={handleToggleChange}
            disabled={disabled}
          />
        )}
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, pl: 1 }}>
          {otherFieldTypes.map((fieldType) => {
            const value = values.find((v) => v.fieldTypeId === fieldType.id);
            if (!value) return null;

            return (
              <FieldTypeFactory
                key={fieldType.id}
                fieldType={fieldType}
                value={value.value}
                onChange={(newValue) =>
                  handleFieldTypeValueChange(fieldType, newValue)
                }
                mode="view"
              />
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default JournalFieldInput;
