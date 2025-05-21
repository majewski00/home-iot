import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemText,
  ListItemButton,
  Collapse,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { UseJournalActionsReturn } from "../../hooks/useJournalActions";
import { FieldTypeKind, Action } from "@src-types/journal/journal.types";

interface SelectFieldModalProps {
  open: boolean;
  onClose: () => void;
  onFieldSelected: (field: {
    fieldId: string;
    fieldName: string;
    fieldTypes: {
      id: string;
      kind: FieldTypeKind;
      description?: string;
      dataOptions?: Record<string, string | number | boolean | undefined>;
    }[];
  }) => void;
  getEligibleFields: UseJournalActionsReturn["getEligibleFields"];
  existingActions?: Action[];
}

const SelectFieldModal: React.FC<SelectFieldModalProps> = ({
  open,
  onClose,
  onFieldSelected,
  getEligibleFields,
  existingActions = [],
}) => {
  const allEligibleFields = getEligibleFields();
  // Add a ref for the dialog
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Filter out fields that already have actions
  const eligibleFields = useMemo(() => {
    // Create a set of fieldIds that already have actions
    const existingFieldIds = new Set(
      existingActions.map((action) => action.fieldId)
    );

    // Filter out fields that are already used in existing actions
    return allEligibleFields.filter(
      (field) => !existingFieldIds.has(field.fieldId)
    );
  }, [allEligibleFields, existingActions]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  // Add a better close handler that manages focus
  const handleClose = () => {
    // Return focus to the document body before closing
    if (document.body) {
      document.body.focus();
    }
    onClose();
  };

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleSelectField = (
    fieldId: string,
    fieldName: string,
    fieldTypes: {
      id: string;
      kind: FieldTypeKind;
      description?: string;
      dataOptions?: Record<string, string | number | boolean | undefined>;
    }[]
  ) => {
    onFieldSelected({
      fieldId,
      fieldName,
      fieldTypes,
    });
  };

  // Group fields by group
  const groupedFields = eligibleFields.reduce((acc, field) => {
    if (!acc[field.groupId]) {
      acc[field.groupId] = {
        groupName: field.groupName,
        fields: [],
      };
    }

    acc[field.groupId].fields.push(field);
    return acc;
  }, {} as Record<string, { groupName: string; fields: typeof eligibleFields }>);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      ref={dialogRef}
      // Add these props to improve accessibility
      keepMounted={false}
      disableRestoreFocus={false}
    >
      <DialogTitle>Select Field</DialogTitle>
      <DialogContent>
        {Object.keys(groupedFields).length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography>
              {eligibleFields.length === 0 && allEligibleFields.length > 0
                ? "All eligible fields already have actions. Create new fields in your journal structure to add more actions."
                : "No eligible fields found. Please create fields with NUMBER, NUMBER_NAVIGATION, or TIME_SELECT types in your journal structure."}
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: "100%" }}>
            {Object.entries(groupedFields).map(
              ([groupId, { groupName, fields }]) => (
                <React.Fragment key={groupId}>
                  <ListItemButton onClick={() => handleToggleGroup(groupId)}>
                    <ListItemText primary={groupName} />
                    {expandedGroups[groupId] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse
                    in={expandedGroups[groupId]}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      {fields.map((field) => (
                        <React.Fragment key={field.fieldId}>
                          <ListItemButton
                            sx={{ pl: 4 }}
                            onClick={() =>
                              handleSelectField(
                                field.fieldId,
                                field.fieldName,
                                field.fieldTypes
                              )
                            }
                          >
                            <ListItemText
                              primary={field.fieldName}
                              secondary={
                                <>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    component="span" // Change from default 'p' to 'span'
                                  >
                                    {field.fieldTypes
                                      .map((ft) =>
                                        ft.kind === "NUMBER"
                                          ? "Number"
                                          : ft.kind === "NUMBER_NAVIGATION"
                                          ? "Number Navigation"
                                          : ft.kind === "TIME_SELECT"
                                          ? "Time Select"
                                          : ft.kind
                                      )
                                      .join(", ")}
                                  </Typography>
                                  {field.fieldTypes.some(
                                    (ft) =>
                                      (ft.kind === "NUMBER" ||
                                        ft.kind === "NUMBER_NAVIGATION") &&
                                      ft.dataOptions &&
                                      (ft.dataOptions.min !== undefined ||
                                        ft.dataOptions.max !== undefined ||
                                        ft.dataOptions.step !== undefined)
                                  ) && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      component="span" // Change from default 'p' to 'span'
                                      sx={{ display: "block", mt: 0.5 }}
                                    >
                                      Constraints:{" "}
                                      {field.fieldTypes
                                        .filter(
                                          (ft) =>
                                            ft.kind === "NUMBER" ||
                                            ft.kind === "NUMBER_NAVIGATION"
                                        )
                                        .map((ft) => {
                                          const constraints = [];
                                          if (ft.dataOptions?.min !== undefined)
                                            constraints.push(
                                              `min: ${ft.dataOptions.min}`
                                            );
                                          if (ft.dataOptions?.max !== undefined)
                                            constraints.push(
                                              `max: ${ft.dataOptions.max}`
                                            );
                                          if (
                                            ft.dataOptions?.step !== undefined
                                          )
                                            constraints.push(
                                              `step: ${ft.dataOptions.step}`
                                            );
                                          if (ft.dataOptions?.unit)
                                            constraints.push(
                                              `unit: ${ft.dataOptions.unit}`
                                            );
                                          return constraints.join(", ");
                                        })
                                        .filter((text) => text.length > 0)
                                        .join("; ")}
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                          </ListItemButton>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              )
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          variant="text"
          color="inherit"
          sx={{
            textTransform: "none",
            fontWeight: "normal",
            color: "text.secondary",
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectFieldModal;
