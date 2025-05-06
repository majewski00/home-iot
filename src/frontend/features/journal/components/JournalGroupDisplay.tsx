import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Group, JournalEntry } from "@src-types/journal/journal.types";
import JournalFieldInput from "./JournalFieldInput";

interface JournalGroupDisplayProps {
  group: Group;
  entry: JournalEntry;
  onUpdateValue: (
    fieldData: Omit<
      import("@src-types/journal/journal.types").FieldValue,
      "createdAt" | "updatedAt"
    >
  ) => Promise<import("@src-types/journal/journal.types").FieldValue | null>;
  disabled?: boolean;
}

/**
 * Component for displaying a collapsible group of journal fields
 */
const JournalGroupDisplay: React.FC<JournalGroupDisplayProps> = ({
  group,
  entry,
  onUpdateValue,
  disabled = false,
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  // Calculate completion percentage for this group
  const calculateCompletionPercentage = () => {
    const fieldsInGroup = group.fields.flatMap((field) =>
      field.fieldTypes.map((fieldType) => ({
        fieldId: field.id,
        fieldTypeId: fieldType.id,
      }))
    );

    if (fieldsInGroup.length === 0) return 0;

    const filledFields = entry.values.filter(
      (value) =>
        value.groupId === group.id &&
        value.filled &&
        fieldsInGroup.some(
          (f) =>
            f.fieldId === value.fieldId && f.fieldTypeId === value.fieldTypeId
        )
    );

    return Math.round((filledFields.length / fieldsInGroup.length) * 100);
  };

  const completionPercentage = calculateCompletionPercentage();

  return (
    <Accordion
      expanded={expanded}
      onChange={handleAccordionChange}
      sx={{
        mb: 3,
        overflow: "hidden",
        "&:before": {
          display: "none",
        },
        boxShadow: "none",
        // Remove all borders around the accordion
        border: "none",
        borderRadius: 0,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: "background.default",
          borderBottom: "none", // Never show bottom border
          padding: "16px 8px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Group name */}
          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            {group.name}
          </Typography>

          {/* Divider that spans all available space */}
          <Box
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", mx: 2 }}
          >
            <Divider
              orientation="horizontal"
              sx={{
                width: "100%",
                borderColor: "divider",
                borderWidth: "1px",
                my: 0,
              }}
            />
          </Box>

          {/* Completion percentage */}
          <Chip
            label={`${completionPercentage}% Complete`}
            color={
              completionPercentage === 100
                ? "success"
                : completionPercentage > 0
                ? "primary"
                : "default"
            }
            size="small"
            variant={completionPercentage > 0 ? "filled" : "outlined"}
            sx={{ mr: 2 }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          p: 3,
          pt: 2, // Slightly less padding at top
          bgcolor: "background.paper",
          // No borders at all
          border: "none",
        }}
      >
        {group.fields.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            No fields in this group
          </Typography>
        ) : (
          group.fields
            .sort((a, b) => a.order - b.order)
            .map((field) => {
              // Get all values for this field
              const fieldValues = entry.values.filter(
                (value) =>
                  value.groupId === group.id && value.fieldId === field.id
              );

              return (
                <JournalFieldInput
                  key={field.id}
                  field={field}
                  values={fieldValues}
                  onUpdateValue={onUpdateValue}
                  disabled={disabled}
                />
              );
            })
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default JournalGroupDisplay;
