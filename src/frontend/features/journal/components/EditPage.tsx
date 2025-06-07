import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  CircularProgress,
  TextField,
  IconButton,
  Alert,
  Fade,
  useTheme,
  Menu,
  MenuItem,
  Collapse,
  Select,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  MoreVert as MoreVertIcon,
  DragIndicator as DragIndicatorIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import {
  Field,
  Group,
  Journal,
  FieldTypeKind,
  FieldType,
} from "@src-types/journal/journal.types";
import { UseJournalStructureMethods } from "../hooks/useJournalStructure";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FieldTypeFactory from "./fields/FieldTypeFactory";

/**
 * EditPageContent component for editing journal structure
 * Allows users to add, remove, and reorder fields and groups.
 * Receives structure and methods as props.
 */
interface EditPageContentProps {
  structure: Journal | null;
  isLoading: boolean;
  error: string | null;
  hasChanges: boolean;
  methods: UseJournalStructureMethods;
  onExitEditMode: () => void;
}

const EditPageContent: React.FC<EditPageContentProps> = ({
  structure,
  methods,
  isLoading,
  error,
  hasChanges,
  onExitEditMode,
}) => {
  const theme = useTheme();
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<boolean>(false);
  const [openExitConfirmDialog, setOpenExitConfirmDialog] =
    useState<boolean>(false);
  const [showFieldInput, setShowFieldInput] = useState<{
    groupId: string;
    index: number | null;
  } | null>(null);
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [fieldMenuAnchor, setFieldMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [activeField, setActiveField] = useState<{
    field: Field;
    groupId: string;
  } | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renamingFieldId, setRenamingFieldId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [newFieldName, setNewFieldName] = useState<string>("");
  const newFieldInputRef = useRef<HTMLInputElement>(null);
  const newGroupNameInputRef = useRef<HTMLInputElement>(null);
  const addFieldButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {}
  );

  const {
    refreshStructure,
    addGroup,
    addField,
    addFieldType,
    updateField,
    updateGroup,
    updateFieldType,
    removeGroup,
    removeField,
    removeFieldType,
    saveStructure,
    reorderField,
    reorderGroup,
  } = methods;

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Focus on the new field input when it appears
  useEffect(() => {
    if (showFieldInput && newFieldInputRef.current) {
      newFieldInputRef.current.focus();
    }
  }, [showFieldInput]);

  // Focus on the group name input when renaming
  useEffect(() => {
    if (renamingGroupId && newGroupNameInputRef.current) {
      newGroupNameInputRef.current.focus();
    }
  }, [renamingGroupId]);

  // Handle save
  const handleSave = async (): Promise<boolean> => {
    try {
      setSaveSuccess(false);
      setSaveError(false);

      const result = await saveStructure();

      if (result) {
        setSaveSuccess(true);
        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
        return true;
      } else {
        setSaveError(true);
        return false;
      }
    } catch (error) {
      console.error("Error saving journal structure:", error);
      setSaveError(true);
      return false;
    }
  };

  // Confirmation Dialog Handlers
  const handleExitClick = () => {
    if (hasChanges) {
      setOpenExitConfirmDialog(true);
    } else {
      onExitEditMode();
    }
  };

  const handleCloseExitConfirmDialog = () => {
    setOpenExitConfirmDialog(false);
  };

  const handleSaveAndExit = async () => {
    const saved = await handleSave();
    if (saved) {
      // Optionally, wait for saveSuccess animation or just exit
      onExitEditMode();
    }
    // Even if save fails, user chose to exit, so close dialog.
    // User will see the saveError message.
    setOpenExitConfirmDialog(false);
    // If save failed, and we want to keep them on the page, remove onExitEditMode()
    if (!saved) {
      // Potentially keep the dialog open or provide more feedback
      // For now, we close the dialog and they stay on the page with error visible
    } else {
      onExitEditMode();
    }
  };

  const handleExitWithoutSaving = () => {
    onExitEditMode();
    setOpenExitConfirmDialog(false);
    // force refresh to clear any unsaved changes
    refreshStructure();
  };

  // Handle adding a new field
  const handleAddField = async (
    groupId: string,
    index: number | null = null
  ) => {
    setShowFieldInput({ groupId, index });
    setNewFieldName("");
  };

  // Handle field name change
  const handleFieldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFieldName(e.target.value);
  };

  // Handle field name submit
  const handleFieldNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showFieldInput) return;

    const { groupId, index } = showFieldInput;
    const name = newFieldName.trim() || "New Field";

    try {
      await addField(groupId, name, index);

      setShowFieldInput(null);
      setNewFieldName("");
    } catch (error) {
      console.error("Error adding field:", error);
    }
  };

  // Handle field name input blur
  const handleFieldNameInputBlur = () => {
    if (newFieldName.trim()) {
      handleFieldNameSubmit({ preventDefault: () => {} } as React.FormEvent);
    } else {
      setShowFieldInput(null);
    }
  };

  // Handle field deletion
  const handleDeleteField = async () => {
    if (activeField?.field && activeField.groupId) {
      const fieldIdToDelete = activeField.field.id;
      const groupIdOfDeletedField = activeField.groupId; // Capture before activeField is nulled

      try {
        handleFieldMenuClose(); // This will set activeField to null
        await removeField(fieldIdToDelete);

        // Focus management: Move focus to the "Add Field" button of the group
        const buttonRef = addFieldButtonRefs.current[groupIdOfDeletedField];
        if (buttonRef) {
          buttonRef.focus();
        }
      } catch (error) {
        console.error("Error removing field:", error);
      }
    }
  };

  // Handle field rename
  const handleRenameField = () => {
    if (activeField?.field) {
      setRenamingFieldId(activeField.field.id);
      setNewFieldName(activeField.field.name);
      handleFieldMenuClose();
    }
  };

  // Handle field name submit when renaming
  const handleFieldRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!renamingFieldId) return;

    const name = newFieldName.trim();
    if (!name) {
      setRenamingFieldId(null);
      return;
    }

    try {
      await updateField(renamingFieldId, { name });
      setRenamingFieldId(null);
    } catch (error) {
      console.error("Error renaming field:", error);
    }
  };

  // Handle field name input blur when renaming
  const handleFieldRenameInputBlur = () => {
    if (newFieldName.trim()) {
      handleFieldRenameSubmit({ preventDefault: () => {} } as React.FormEvent);
    } else {
      setRenamingFieldId(null);
    }
  };

  // Handle field menu open
  const handleFieldMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    field: Field,
    groupId: string // Added groupId
  ) => {
    setFieldMenuAnchor(event.currentTarget);
    setActiveField({ field, groupId }); // Store field and groupId
  };

  // Handle field menu close
  const handleFieldMenuClose = () => {
    setFieldMenuAnchor(null);
    setActiveField(null);
  };

  // Handle field drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const fieldId = active.id as string;
      const groupId = active.data.current?.groupId as string;

      // Find the group and field indices
      const group = structure?.groups.find((g) => g.id === groupId);
      if (!group) return;

      const oldIndex = group.fields.findIndex((f) => f.id === fieldId);
      const newIndex = group.fields.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        try {
          await reorderField(fieldId, newIndex);
        } catch (error) {
          console.error("Error reordering field:", error);
        }
      }
    }
  };

  // Handle adding a new group
  const handleAddGroup = async () => {
    try {
      await addGroup("New Group");
    } catch (error) {
      console.error("Error adding group:", error);
    }
  };

  // Handle group menu open
  const handleGroupMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    group: Group
  ) => {
    setGroupMenuAnchor(event.currentTarget);
    setActiveGroup(group);
  };

  // Handle group menu close
  const handleGroupMenuClose = () => {
    setGroupMenuAnchor(null);
    setActiveGroup(null);
  };

  // Handle group deletion
  const handleDeleteGroup = async () => {
    if (activeGroup) {
      try {
        await removeGroup(activeGroup.id);
        console.log("Delete group:", activeGroup.id);
        handleGroupMenuClose();
      } catch (error) {
        console.error("Error removing group:", error);
      }
    }
  };

  // Handle group move up
  const handleMoveGroupUp = async () => {
    if (activeGroup) {
      try {
        const currentIndex =
          structure?.groups.findIndex((g) => g.id === activeGroup.id) || 0;
        if (currentIndex > 0) {
          await reorderGroup(activeGroup.id, currentIndex - 1);
        }
        handleGroupMenuClose();
      } catch (error) {
        console.error("Error moving group up:", error);
      }
    }
  };

  // Handle group move down
  const handleMoveGroupDown = async () => {
    if (activeGroup && structure) {
      try {
        const currentIndex = structure.groups.findIndex(
          (g) => g.id === activeGroup.id
        );
        if (currentIndex < structure.groups.length - 1) {
          await reorderGroup(activeGroup.id, currentIndex + 1);
        }
        handleGroupMenuClose();
      } catch (error) {
        console.error("Error moving group down:", error);
      }
    }
  };

  // Handle group rename
  const handleRenameGroup = () => {
    if (activeGroup) {
      setRenamingGroupId(activeGroup.id);
      setNewGroupName(activeGroup.name);
      handleGroupMenuClose();
    }
  };

  // Handle group name change
  const handleGroupNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGroupName(e.target.value);
  };

  // Handle group name submit
  const handleGroupNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!renamingGroupId) return;

    const name = newGroupName.trim();
    if (!name) {
      // If empty, cancel renaming
      setRenamingGroupId(null);
      return;
    }

    try {
      await updateGroup(renamingGroupId, { name });
      setRenamingGroupId(null);
    } catch (error) {
      console.error("Error renaming group:", error);
    }
  };

  // Handle group name input blur
  const handleGroupNameInputBlur = () => {
    if (newGroupName.trim()) {
      handleGroupNameSubmit({ preventDefault: () => {} } as React.FormEvent);
    } else {
      setRenamingGroupId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Loading journal structure...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  // No journal structure
  if (!structure) {
    return (
      <Container maxWidth="md">
        <Box py={4} textAlign="center">
          <Typography variant="h4" gutterBottom>
            Welcome to Journal
          </Typography>
          <Typography variant="body1" paragraph>
            You don't have a journal yet. Let's create one to get started.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => addGroup("My Journal")}
          >
            Create Journal
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              onClick={handleExitClick}
              aria-label="back to journal"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Edit Journal
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            Save Changes
          </Button>
        </Box>

        {/* Save notification */}
        <Fade in={saveSuccess}>
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSaveSuccess(false)}
          >
            Journal structure saved successfully!
          </Alert>
        </Fade>

        <Fade in={saveError}>
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setSaveError(false)}
          >
            Failed to save journal structure. Please try again.
          </Alert>
        </Fade>

        {/* Journal structure editor */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: theme.palette.background.default,
            border: "0px solid",
            borderColor: "divider",
            borderWidth: "1px",
            boxShadow: "none",
          }}
        >
          {structure.groups.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              No groups in your journal. Add a group to get started.
            </Typography>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {structure.groups
                .sort((a, b) => a.order - b.order)
                .map((group) => (
                  <Box key={group.id} mb={4}>
                    {/* Group header */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 2,
                        pb: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      {renamingGroupId === group.id ? (
                        <Box
                          component="form"
                          onSubmit={handleGroupNameSubmit}
                          sx={{ mr: 2, flexGrow: 1 }}
                        >
                          <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={newGroupName}
                            onChange={handleGroupNameChange}
                            onBlur={handleGroupNameInputBlur}
                            inputRef={newGroupNameInputRef}
                            // autoFocus removed
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                fontSize: theme.typography.h6.fontSize,
                                fontWeight: theme.typography.h6.fontWeight,
                              },
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                          {group.name}
                        </Typography>
                      )}

                      <Box sx={{ flexGrow: 1 }} />

                      <IconButton
                        size="small"
                        onClick={(e) => handleGroupMenuOpen(e, group)}
                        aria-label="group options"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Fields */}
                    <SortableContext
                      items={group.fields.map((field) => field.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Box sx={{ mb: 2 }}>
                        {group.fields.length === 0 ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                            sx={{ py: 2 }}
                          >
                            No fields in this group
                          </Typography>
                        ) : (
                          group.fields
                            .sort((a, b) => a.order - b.order)
                            .map((field, index) => (
                              <React.Fragment key={field.id}>
                                {/* Field insertion hover area (now at top) */}
                                <Box
                                  className="field-insert"
                                  sx={{
                                    height: "30px", // Increased height for better usability
                                    mb: 1,
                                    opacity: 0,
                                    transition: "opacity 0.2s",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    "&:hover": {
                                      opacity: 1, // Show the entire area on hover
                                      "& .insert-line": {
                                        height: "4px",
                                      },
                                      "& .insert-button": {
                                        opacity: 1,
                                      },
                                    },
                                  }}
                                >
                                  <Box
                                    className="insert-line"
                                    sx={{
                                      width: "100%",
                                      height: "2px",
                                      bgcolor: "primary.main",
                                      transition: "height 0.2s",
                                      position: "relative",
                                    }}
                                  >
                                    <IconButton
                                      className="insert-button"
                                      size="small"
                                      color="primary"
                                      onClick={
                                        () => handleAddField(group.id, index) // MODIFIED: index + 1 to index
                                      }
                                      sx={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        bgcolor: "background.paper",
                                        opacity: 0,
                                        transition: "opacity 0.2s",
                                        "&:hover": {
                                          bgcolor: "background.paper",
                                        },
                                      }}
                                    >
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>

                                {/* Field insertion point */}
                                {showFieldInput?.groupId === group.id &&
                                  showFieldInput?.index === index && (
                                    <Box
                                      component="form"
                                      onSubmit={handleFieldNameSubmit}
                                      sx={{
                                        p: 2,
                                        mb: 2,
                                        borderRadius: 2,
                                        bgcolor: "background.paper",
                                        border: "1px dashed",
                                        borderColor: "primary.main",
                                      }}
                                    >
                                      <TextField
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        placeholder="Enter field name"
                                        value={newFieldName}
                                        onChange={handleFieldNameChange}
                                        onBlur={handleFieldNameInputBlur}
                                        inputRef={newFieldInputRef}
                                        autoFocus
                                      />
                                    </Box>
                                  )}

                                {/* Field item */}
                                <SortableFieldItem
                                  field={field}
                                  groupId={group.id}
                                  renamingFieldId={renamingFieldId}
                                  newFieldName={newFieldName}
                                  setNewFieldName={setNewFieldName}
                                  handleFieldRenameSubmit={
                                    handleFieldRenameSubmit
                                  }
                                  handleFieldRenameInputBlur={
                                    handleFieldRenameInputBlur
                                  }
                                  handleFieldMenuOpen={handleFieldMenuOpen}
                                  addFieldType={addFieldType}
                                  updateFieldType={updateFieldType}
                                  removeFieldType={removeFieldType}
                                />
                              </React.Fragment>
                            ))
                        )}

                        {/* Last field insertion point */}
                        {showFieldInput?.groupId === group.id &&
                          showFieldInput?.index === null && (
                            <Box
                              component="form"
                              onSubmit={handleFieldNameSubmit}
                              sx={{
                                p: 2,
                                mb: 2,
                                borderRadius: 2,
                                bgcolor: "background.paper",
                                border: "1px dashed",
                                borderColor: "primary.main",
                              }}
                            >
                              <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="Enter field name"
                                value={newFieldName}
                                onChange={handleFieldNameChange}
                                onBlur={handleFieldNameInputBlur}
                                inputRef={newFieldInputRef}
                                autoFocus
                              />
                            </Box>
                          )}
                      </Box>
                    </SortableContext>

                    {/* Add field button */}
                    <Box sx={{ textAlign: "center" }}>
                      <Button
                        ref={(el) => {
                          if (group.id) {
                            // Ensure group.id is valid before using as key
                            addFieldButtonRefs.current[group.id] = el;
                          }
                        }}
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddField(group.id)}
                        sx={{ borderRadius: 2 }}
                      >
                        Add Field
                      </Button>
                    </Box>
                  </Box>
                ))}
            </DndContext>
          )}

          {/* Add group button */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddGroup}
              sx={{ borderRadius: 2 }}
            >
              Add Group
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Group menu */}
      <Menu
        anchorEl={groupMenuAnchor}
        open={Boolean(groupMenuAnchor)}
        onClose={handleGroupMenuClose}
      >
        <MenuItem onClick={handleRenameGroup}>Rename Group</MenuItem>
        <MenuItem onClick={handleMoveGroupUp}>
          <ArrowUpIcon fontSize="small" sx={{ mr: 1 }} />
          Move Up
        </MenuItem>
        <MenuItem onClick={handleMoveGroupDown}>
          <ArrowDownIcon fontSize="small" sx={{ mr: 1 }} />
          Move Down
        </MenuItem>
        <MenuItem
          onClick={handleDeleteGroup}
          sx={{ color: "error.main" }}
          disabled={structure.groups.length <= 1}
        >
          Delete Group
        </MenuItem>
      </Menu>

      {/* Field menu */}
      <Menu
        anchorEl={fieldMenuAnchor}
        open={Boolean(fieldMenuAnchor)}
        onClose={handleFieldMenuClose}
      >
        <MenuItem onClick={handleRenameField}>Rename Field</MenuItem>
        <MenuItem onClick={handleDeleteField} sx={{ color: "error.main" }}>
          Delete Field
        </MenuItem>
      </Menu>

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={openExitConfirmDialog}
        onClose={handleCloseExitConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Unsaved Changes"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You have unsaved changes. Do you want to save them before leaving?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExitConfirmDialog}>Cancel</Button>
          <Button onClick={handleExitWithoutSaving}>Exit Without Saving</Button>
          <Button onClick={handleSaveAndExit} color="primary" autoFocus>
            Save and Exit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Sortable Field Item Component
interface SortableFieldItemProps {
  field: Field;
  groupId: string;
  renamingFieldId: string | null;
  newFieldName: string;
  setNewFieldName: (name: string) => void;
  handleFieldRenameSubmit: (e: React.FormEvent) => Promise<void>;
  handleFieldRenameInputBlur: () => void;
  handleFieldMenuOpen: (
    event: React.MouseEvent<HTMLElement>,
    field: Field,
    groupId: string // Added groupId
  ) => void;
  // Add field type management methods
  addFieldType: (
    fieldId: string,
    kind: FieldTypeKind,
    description?: string,
    dataOptions?: Record<string, string | number>,
    order?: number
  ) => Promise<FieldType | null>;
  updateFieldType: (
    fieldTypeId: string,
    updates: Partial<Omit<FieldType, "id" | "fieldId" | "kind">>
  ) => Promise<boolean>;
  removeFieldType: (fieldTypeId: string) => Promise<boolean>;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({
  field,
  groupId,
  renamingFieldId,
  newFieldName,
  setNewFieldName,
  handleFieldRenameSubmit,
  handleFieldRenameInputBlur,
  handleFieldMenuOpen,
  addFieldType,
  updateFieldType,
  removeFieldType,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: field.id,
      data: {
        groupId,
        fieldId: field.id,
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renamingFieldRef = useRef<HTMLInputElement>(null);
  const [showFieldTypes, setShowFieldTypes] = useState(true);
  const [fieldTypeMenuAnchor, setFieldTypeMenuAnchor] =
    useState<null | HTMLElement>(null);

  // Handle adding a new field type
  const handleAddFieldType = async (fieldTypeKind: FieldTypeKind) => {
    try {
      await addFieldType(field.id, fieldTypeKind);
      // Close the menu
      setFieldTypeMenuAnchor(null);
    } catch (error) {
      console.error("Error adding field type:", error);
    }
  };

  // Handle field type update
  const handleFieldTypeUpdate = async (
    fieldTypeId: string,
    updates: Partial<FieldType>
  ) => {
    try {
      await updateFieldType(fieldTypeId, updates);
    } catch (error) {
      console.error("Error updating field type:", error);
    }
  };

  // Handle field type deletion
  const handleDeleteFieldType = async (fieldTypeId: string) => {
    try {
      await removeFieldType(fieldTypeId);
    } catch (error) {
      console.error("Error deleting field type:", error);
    }
  };

  useEffect(() => {
    if (renamingFieldId === field.id && renamingFieldRef.current) {
      renamingFieldRef.current.focus();
    }
  }, [renamingFieldId, field.id, renamingFieldRef]);

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        "&:hover": {
          "& .field-actions": {
            opacity: 1,
          },
          "& .field-insert": {
            opacity: 1,
          },
        },
      }}
      {...attributes}
    >
      {/* Field header */}
      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
        <Box
          {...listeners}
          sx={{
            mr: 2,
            color: "text.secondary",
            cursor: "grab",
          }}
        >
          <DragIndicatorIcon />
        </Box>

        {renamingFieldId === field.id ? (
          <Box
            component="form"
            onSubmit={handleFieldRenameSubmit}
            sx={{ flexGrow: 1 }}
          >
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onBlur={handleFieldRenameInputBlur}
              inputRef={renamingFieldRef}
            />
          </Box>
        ) : (
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            {field.name}
          </Typography>
        )}

        <Box
          className="field-actions"
          sx={{
            opacity: 0,
            transition: "opacity 0.2s",
            display: "flex",
          }}
        >
          <Button
            size="small"
            onClick={() => setShowFieldTypes(!showFieldTypes)}
            sx={{ mr: 1 }}
          >
            {showFieldTypes ? "Hide Details" : "Show Details"}
          </Button>
          <IconButton
            size="small"
            onClick={(e) => handleFieldMenuOpen(e, field, groupId)} // Pass groupId here
            aria-label="field options"
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Field Types section */}
      <Collapse in={showFieldTypes}>
        <Box sx={{ mt: 2, pl: 4 }}>
          {/* List existing field types */}
          {field.fieldTypes
            .filter((ft) => ft.kind !== "CHECK") // Don't show CHECK field type
            .map((fieldType) => (
              <Box
                key={fieldType.id}
                sx={{
                  mb: 2,
                  p: 1,
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {fieldType.description || fieldType.kind}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteFieldType(fieldType.id)}
                    sx={{ p: 0.5 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                <FieldTypeFactory
                  fieldType={fieldType}
                  value={null} // No value needed in edit mode
                  onChange={() => {}} // No onChange needed in edit mode
                  mode="edit"
                  onFieldTypeUpdate={(updates) =>
                    handleFieldTypeUpdate(fieldType.id, updates)
                  }
                />
              </Box>
            ))}

          {/* Add new field type - centered button */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={(e) => setFieldTypeMenuAnchor(e.currentTarget)}
              sx={{ borderRadius: 2 }}
            >
              Add Field Type
            </Button>
          </Box>

          {/* Field Type selection menu */}
          <Menu
            anchorEl={fieldTypeMenuAnchor}
            open={Boolean(fieldTypeMenuAnchor)}
            onClose={() => setFieldTypeMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleAddFieldType("NUMBER_NAVIGATION")}>
              Number with Navigation
            </MenuItem>
            <MenuItem onClick={() => handleAddFieldType("NUMBER")}>
              Number
            </MenuItem>
            <MenuItem onClick={() => handleAddFieldType("TIME_SELECT")}>
              Time Select
            </MenuItem>
            <MenuItem onClick={() => handleAddFieldType("SEVERITY")}>
              Severity
            </MenuItem>
            <MenuItem onClick={() => handleAddFieldType("RANGE")}>
              Range
            </MenuItem>
          </Menu>
        </Box>
      </Collapse>
    </Box>
  );
};

export default EditPageContent;
