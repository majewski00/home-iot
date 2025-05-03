import React, { useState, useEffect } from "react";
import { useJournalEntry } from "../hooks/useJournalEntry";
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { Journal, Group, Field, FieldValue } from "../types/journal.types";

interface JournalDayViewProps {
  journal: Journal;
  date: string;
  onEdit: () => void;
}

/**
 * Component for viewing a journal entry for a specific day
 */
const JournalDayView: React.FC<JournalDayViewProps> = ({
  journal,
  date,
  onEdit,
}) => {
  const { entry, isLoading, error } = useJournalEntry(journal, date);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

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

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Get field value from entry
  const getFieldValue = (
    fieldId: string,
    fieldTypeId: string
  ): FieldValue | undefined => {
    if (!entry || !entry.values) return undefined;

    return entry.values.find(
      (v) => v.fieldId === fieldId && v.fieldTypeId === fieldTypeId
    );
  };

  // Format field value based on field type
  const formatFieldValue = (
    value: string | number | null,
    fieldType: string
  ): string => {
    if (value === null) return "--";

    switch (fieldType) {
      case "NUMBER":
      case "CUSTOM_NUMBER":
        return value.toString();
      case "DATE":
        try {
          return new Date(value.toString()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch (e) {
          return value.toString();
        }
      case "LITERAL":
        return value.toString();
      default:
        return value.toString();
    }
  };

  // Calculate completion for a group
  const calculateGroupCompletion = (
    group: Group
  ): { filled: number; total: number } => {
    if (!entry || !entry.values) {
      return { filled: 0, total: 0 };
    }

    let totalFields = 0;
    let filledFields = 0;

    group.fields.forEach((field) => {
      field.fieldTypes.forEach((fieldType) => {
        totalFields++;
        const value = getFieldValue(field.id, fieldType.id);
        if (value && value.filled) {
          filledFields++;
        }
      });
    });

    return { filled: filledFields, total: totalFields };
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

  const isEmptyEntry = !entry || !entry.values || entry.values.length === 0;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Journal Entry</Typography>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
          Edit
        </Button>
      </Box>

      {isEmptyEntry ? (
        <Paper elevation={0} sx={{ p: 3, bgcolor: "background.default" }}>
          <Typography align="center" color="textSecondary">
            No journal entry for this day. Click Edit to create one.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {journal.groups.map((group) => {
            const { filled, total } = calculateGroupCompletion(group);
            const hasFields = group.fields.length > 0;

            if (!hasFields) return null;

            return (
              <Accordion
                key={group.id}
                expanded={expandedGroups[group.id] || false}
                onChange={() => toggleGroupExpansion(group.id)}
                sx={{ mb: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    width="100%"
                    pr={2}
                  >
                    <Typography variant="subtitle1">{group.name}</Typography>
                    <Chip
                      label={`${filled}/${total}`}
                      color={filled === total ? "success" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid sx={{ display: "grid", gap: 2 }}>
                    {group.fields.map((field) => (
                      <Grid key={field.id}>
                        <Box mb={2}>
                          <Typography variant="subtitle2">
                            {field.name}
                          </Typography>
                          <Divider sx={{ my: 1 }} />

                          {field.fieldTypes.map((fieldType) => {
                            const value = getFieldValue(field.id, fieldType.id);
                            const displayValue = value
                              ? formatFieldValue(value.value, fieldType.kind)
                              : "--";
                            const isFilled = value ? value.filled : false;

                            return (
                              <Box
                                key={fieldType.id}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                py={1}
                              >
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                >
                                  {fieldType.name || field.name}
                                  {fieldType.dataType &&
                                    ` (${fieldType.dataType})`}
                                  :
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color={
                                    isFilled ? "textPrimary" : "textSecondary"
                                  }
                                  fontWeight={isFilled ? "bold" : "normal"}
                                >
                                  {displayValue}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default JournalDayView;
