import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { UseJournalActionsReturn } from "../../hooks/useJournalActions";
import SelectFieldModal from "./SelectFieldModal";
import { FieldTypeKind, Action } from "@src-types/journal/journal.types";

interface CreateActionModalProps {
  open: boolean;
  onClose: () => void;
  onActionCreated: () => void;
  createAction: UseJournalActionsReturn["createAction"];
  getEligibleFields: UseJournalActionsReturn["getEligibleFields"];
  // Add this prop to receive existing actions
  existingActions?: Action[];
}

interface SelectedField {
  fieldId: string;
  fieldName: string;
  fieldTypes: {
    id: string;
    kind: FieldTypeKind;
    description?: string;
    dataOptions?: Record<string, string | number | boolean | undefined>;
  }[];
}

const CreateActionModal: React.FC<CreateActionModalProps> = ({
  open,
  onClose,
  onActionCreated,
  createAction,
  getEligibleFields,
  existingActions = [], // Provide default empty array
}) => {
  const [name, setName] = useState("");
  const [isSelectFieldModalOpen, setIsSelectFieldModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<SelectedField | null>(
    null
  );
  const [incrementValue, setIncrementValue] = useState<number>(1);
  const [selectedFieldType, setSelectedFieldType] = useState<
    SelectedField["fieldTypes"][0] | null
  >(null);
  const [useCustomValue, setUseCustomValue] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenSelectField = () => {
    setIsSelectFieldModalOpen(true);
  };

  const handleCloseSelectField = () => {
    // First close the dialog to manage focus properly
    setIsSelectFieldModalOpen(false);

    // Wait for the dialog to close before focusing another element
    setTimeout(() => {
      // Focus back on the "Select Field" button in the parent dialog
      const selectButton = document.querySelector(
        '[aria-label="select field"]'
      );
      if (selectButton instanceof HTMLElement) {
        selectButton.focus();
      }
    }, 100);
  };

  const handleFieldSelected = (field: {
    fieldId: string;
    fieldName: string;
    fieldTypes: {
      id: string;
      kind: FieldTypeKind;
      description?: string;
      dataOptions?: Record<string, string | number | boolean | undefined>;
    }[];
  }) => {
    setSelectedField(field);

    // Get the first numeric field type if available, otherwise use the first field type
    const numericFieldTypes = field.fieldTypes.filter(
      (ft) => ft.kind === "NUMBER" || ft.kind === "NUMBER_NAVIGATION"
    );

    const fieldTypeToUse =
      numericFieldTypes.length > 0 ? numericFieldTypes[0] : field.fieldTypes[0];

    setSelectedFieldType(fieldTypeToUse);

    // Set default increment value based on step if available
    if (fieldTypeToUse.dataOptions?.step !== undefined) {
      setIncrementValue(Number(fieldTypeToUse.dataOptions.step));
    } else {
      setIncrementValue(1);
    }

    // If user didn't select name but chosen the field, use field name as action name
    if (!name.trim()) {
      setName(field.fieldName);
    }

    setIsSelectFieldModalOpen(false);
  };

  const handleCreateAction = async () => {
    if (!name.trim()) {
      setError("Please enter a name for the action");
      return;
    }

    if (!selectedField) {
      setError("Please select a field for the action");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      if (!selectedFieldType) {
        setError("No field type selected");
        return;
      }

      await createAction(
        name.trim(),
        selectedField.fieldId,
        selectedFieldType.id,
        useCustomValue ? undefined : incrementValue
      );

      onActionCreated();
      resetForm();
    } catch (err) {
      setError("Failed to create action");
      console.error("Error creating action:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedField(null);
    setSelectedFieldType(null);
    setIncrementValue(1);
    setUseCustomValue(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Action</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Action Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              error={!!error && !name.trim()}
              helperText={!name.trim() && error ? "Name is required" : ""}
            />

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Associated Field
              </Typography>

              {selectedField ? (
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle1">
                    {selectedField.fieldName}
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleOpenSelectField}
                    sx={{ color: "text.secondary" }}
                  >
                    Change
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="text"
                  onClick={handleOpenSelectField}
                  fullWidth
                  aria-label="select field"
                  sx={{
                    py: 1,
                    border: "1px dashed",
                    borderColor:
                      !!error && !selectedField ? "error.main" : "divider",
                    color:
                      !!error && !selectedField
                        ? "error.main"
                        : "text.secondary",
                    "&:hover": {
                      backgroundColor: "action.hover",
                      borderStyle: "solid",
                    },
                  }}
                >
                  Select Field
                </Button>
              )}
            </Box>

            {selectedField &&
              selectedField.fieldTypes.some(
                (ft) => ft.kind === "NUMBER" || ft.kind === "NUMBER_NAVIGATION"
              ) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Value Options
                  </Typography>

                  <Box sx={{ display: "flex", mb: 2 }}>
                    <Button
                      variant="text"
                      onClick={() => setUseCustomValue(false)}
                      sx={{
                        mr: 1,
                        flex: 1,
                        backgroundColor: !useCustomValue
                          ? "action.selected"
                          : "transparent",
                        color: "text.primary",
                        border: "1px solid",
                        borderColor: "divider",
                        "&:hover": {
                          backgroundColor: !useCustomValue
                            ? "action.selected"
                            : "action.hover",
                        },
                      }}
                    >
                      Fixed Increment
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => setUseCustomValue(true)}
                      sx={{
                        flex: 1,
                        backgroundColor: useCustomValue
                          ? "action.selected"
                          : "transparent",
                        color: "text.primary",
                        border: "1px solid",
                        borderColor: "divider",
                        "&:hover": {
                          backgroundColor: useCustomValue
                            ? "action.selected"
                            : "action.hover",
                        },
                      }}
                    >
                      Custom Value
                    </Button>
                  </Box>

                  {useCustomValue && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1, mb: 2 }}
                    >
                      You will be prompted to enter a custom value each time you
                      use this action.
                    </Typography>
                  )}

                  {!useCustomValue && (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          label={
                            selectedFieldType?.description
                              ? `Increment Value (${selectedFieldType.description})`
                              : "Increment Value"
                          }
                          type="number"
                          value={incrementValue}
                          onChange={(e) =>
                            setIncrementValue(Number(e.target.value))
                          }
                          fullWidth
                          InputProps={{
                            endAdornment: selectedFieldType?.dataOptions
                              ?.unit && (
                              <Typography
                                variant="body1"
                                sx={{ ml: 1, color: "text.secondary" }}
                              >
                                {selectedFieldType.dataOptions.unit}
                              </Typography>
                            ),
                          }}
                          inputProps={{
                            min:
                              selectedFieldType?.dataOptions?.min !== undefined
                                ? Number(selectedFieldType.dataOptions.min)
                                : 0,
                            max:
                              selectedFieldType?.dataOptions?.max !== undefined
                                ? Number(selectedFieldType.dataOptions.max)
                                : undefined,
                            step:
                              selectedFieldType?.dataOptions?.step !== undefined
                                ? Number(selectedFieldType.dataOptions.step)
                                : 1,
                          }}
                        />
                        {selectedFieldType?.dataOptions && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {[
                                `Min: ${
                                  selectedFieldType.dataOptions.min || 0
                                }`,
                                selectedFieldType.dataOptions.max !== undefined
                                  ? `Max: ${selectedFieldType.dataOptions.max}`
                                  : null,
                                selectedFieldType.dataOptions.step !== undefined
                                  ? `Step: ${selectedFieldType.dataOptions.step}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              )}

            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            variant="text"
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateAction}
            variant="outlined"
            disabled={isCreating}
            sx={{
              ml: 1,
              px: 3,
              "&:not(:disabled)": {
                backgroundColor: "background.paper",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              },
            }}
          >
            {isCreating ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <SelectFieldModal
        open={isSelectFieldModalOpen}
        onClose={handleCloseSelectField}
        onFieldSelected={handleFieldSelected}
        getEligibleFields={getEligibleFields}
        existingActions={existingActions} // Pass existing actions to the modal
      />
    </>
  );
};

export default CreateActionModal;
