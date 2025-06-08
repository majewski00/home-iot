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
  selectedDate: string; // YYYY-MM-DD format
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
  selectedDate,
  disabled = false,
}) => {
  // Find the CHECK field type
  const checkFieldType = field.fieldTypes.find((ft) => ft.kind === "CHECK");
  const checkValue = checkFieldType
    ? values.find((v) => v.fieldTypeId === checkFieldType.id)
    : null;
  // Check if Field is checked
  const isChecked = Boolean(checkValue?.value) || false;
  const [expanded, setExpanded] = useState<boolean>(isChecked);

  // Other field types
  const otherFieldTypes = field.fieldTypes.filter((ft) => ft.kind !== "CHECK");

  // Handle toggle change
  const handleToggleChange = async (newIsChecked: boolean) => {
    setExpanded(newIsChecked);

    if (checkFieldType) {
      await onUpdateValue({
        groupId: field.groupId,
        fieldId: field.id,
        fieldTypeId: checkFieldType.id,
        value: newIsChecked,
      });
    } else {
      // TODO: how to handle this? Maybe propagate callback to set error?
      console.error("Check field type or value not found");
    }
  };

  // Handle field type value change
  const handleFieldTypeValueChange = async (
    fieldType: FieldType,
    newValue: string | boolean | number | null
  ) => {
    await onUpdateValue({
      groupId: field.groupId,
      fieldId: field.id,
      fieldTypeId: fieldType.id,
      value: newValue,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        bgcolor: "background.paper",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h6"
          fontWeight="500"
          sx={{ color: "text.primary" }}
        >
          {field.name}
        </Typography>

        {/* CHECK field type */}
        {checkFieldType && (
          <CheckFieldView
            value={!!checkValue?.value || false}
            onChange={handleToggleChange}
            disabled={disabled}
          />
        )}
      </Box>

      {/* Only render Collapse if there are other field types to show */}
      {otherFieldTypes.length > 0 && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              mt: 3,
              pl: 0,
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            {otherFieldTypes.map((fieldType) => {
              const fieldValue = values.find(
                (v) => v.fieldTypeId === fieldType.id
              );

              return (
                <FieldTypeFactory
                  key={fieldType.id}
                  fieldType={fieldType}
                  value={fieldValue ? fieldValue.value : null}
                  onChange={(newValue) =>
                    handleFieldTypeValueChange(fieldType, newValue)
                  }
                  mode="view"
                  selectedDate={selectedDate}
                />
              );
            })}
          </Box>
        </Collapse>
      )}
    </Paper>
  );
};

export default JournalFieldInput;
