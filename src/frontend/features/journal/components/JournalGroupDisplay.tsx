import React, { useState } from "react";
import { Box, Collapse, Paper, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
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
  // Initialize expanded state based on collapsedByDefault property
  const [expanded, setExpanded] = useState<boolean>(!group.collapsedByDefault);

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  return (
    <Paper
      elevation={1}
      sx={{
        mb: 4,
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "background.paper",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        },
        // Add visual indicator for collapsed groups
        opacity: group.collapsedByDefault && !expanded ? 0.8 : 1,
        border: group.collapsedByDefault && !expanded ? "1px dashed" : "none",
        borderColor:
          group.collapsedByDefault && !expanded ? "grey.400" : "transparent",
      }}
    >
      <Box
        onClick={(e) => handleAccordionChange(e, !expanded)}
        sx={{
          bgcolor:
            group.collapsedByDefault && !expanded ? "grey.100" : "grey.50",
          p: 3,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background-color 0.2s ease",
          "&:hover": {
            bgcolor:
              group.collapsedByDefault && !expanded ? "grey.200" : "grey.100",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flex: 1,
          }}
        >
          {/* Collapsed indicator when group is collapsed by default and currently collapsed */}
          {group.collapsedByDefault && !expanded && (
            <VisibilityOffIcon
              sx={{
                mr: 1,
                color: "text.secondary",
                fontSize: "1.1rem",
              }}
            />
          )}

          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 500,
              color:
                group.collapsedByDefault && !expanded
                  ? "text.secondary"
                  : "text.primary",
              mr: 3,
            }}
          >
            {group.name}
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              mx: 2,
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "1px",
                bgcolor: "divider",
                opacity: 0.6,
              }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            {group.fields.length} Field{group.fields.length !== 1 ? "s" : ""}
          </Typography>
        </Box>

        <ExpandMoreIcon
          sx={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: "text.secondary",
          }}
        />
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            p: 4,
            pt: 3,
            bgcolor: "background.paper",
          }}
        >
          {group.fields.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 4 }}
            >
              No fields in this group
            </Typography>
          ) : (
            <Box sx={{ "& > *:last-child": { mb: 0 } }}>
              {group.fields
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
                })}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default JournalGroupDisplay;
