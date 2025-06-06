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
import {
  Group,
  JournalEntry,
  FieldValue,
} from "@src-types/journal/journal.types";
import JournalFieldInput from "./JournalFieldInput";

interface JournalGroupDisplayProps {
  group: Group;
  entry: JournalEntry;
  onUpdateValue: (
    fieldData: Omit<FieldValue, "createdAt" | "updatedAt">
  ) => Promise<FieldValue | null>;
  selectedDate: string; // YYYY-MM-DD format
  disabled?: boolean;
}

/**
 * Component for displaying a collapsible group of journal fields
 */
const JournalGroupDisplay: React.FC<JournalGroupDisplayProps> = ({
  group,
  entry,
  onUpdateValue,
  selectedDate,
  disabled = false,
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

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
                  selectedDate={selectedDate}
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
