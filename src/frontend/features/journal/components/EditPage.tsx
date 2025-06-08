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
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  MoreVert as MoreVertIcon,
  DragIndicator as DragIndicatorIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Numbers as NumberIcon,
  Schedule as TimeIcon,
  Warning as SeverityIcon,
  LinearScale as RangeIcon,
  Navigation as NavigationIcon,
  Info as InfoIcon,
  Tune as TuneIcon, // Add import for CUSTOM_SCALE icon
  VisibilityOff as VisibilityOffIcon, // New import for collapsed indicator
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
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
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
    groupId: string
  ) => void;
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
  const [editingFieldTypes, setEditingFieldTypes] = useState<string | null>(
    null
  );
  const [addingFieldToGroup, setAddingFieldToGroup] = useState<string | null>(
    null
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<Field | null>(null);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [draggedFromGroupId, setDraggedFromGroupId] = useState<string | null>(
    null
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
    toggleGroupCollapsed,
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

  // Simplified field adding - no more complex insertion points
  const handleAddFieldToGroup = (groupId: string) => {
    setAddingFieldToGroup(groupId);
    setNewFieldName("");
  };

  // Handle field name submit
  const handleFieldNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingFieldToGroup) return;

    const name = newFieldName.trim() || "New Field";
    try {
      await addField(addingFieldToGroup, name);
      setAddingFieldToGroup(null);
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

  // Get field type icon
  const getFieldTypeIcon = (kind: FieldTypeKind) => {
    switch (kind) {
      case "NUMBER":
        return <NumberIcon fontSize="small" />;
      case "NUMBER_NAVIGATION":
        return <NavigationIcon fontSize="small" />;
      case "TIME_SELECT":
        return <TimeIcon fontSize="small" />;
      case "SEVERITY":
        return <SeverityIcon fontSize="small" />;
      case "RANGE":
        return <RangeIcon fontSize="small" />;
      case "CUSTOM_SCALE":
        return <TuneIcon fontSize="small" />;
      default:
        return <SettingsIcon fontSize="small" />;
    }
  };

  // Calculate insertion index based on drag position
  const calculateInsertionIndex = (
    overId: string | null,
    draggedFieldId: string,
    groupFields: Field[]
  ): number | null => {
    if (!overId || !draggedFieldId) return null;

    // Find the index of the field being hovered over
    const overIndex = groupFields.findIndex((f) => f.id === overId);
    const draggedIndex = groupFields.findIndex((f) => f.id === draggedFieldId);

    if (overIndex === -1 || draggedIndex === -1) return null;

    // If dragging down (draggedIndex < overIndex), insert after the target
    // If dragging up (draggedIndex > overIndex), insert before the target
    if (draggedIndex < overIndex) {
      return overIndex; // Insert after target (target moves down)
    } else {
      return overIndex; // Insert before target (target moves up)
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDraggedFromGroupId(event.active.data.current?.groupId as string);

    // Find the dragged field
    const field = structure?.groups
      .flatMap((g) => g.fields)
      .find((f) => f.id === event.active.id);

    setDraggedField(field || null);
  };

  // Handle drag over with precise insertion calculation
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || !active || !draggedFromGroupId) {
      setInsertionIndex(null);
      return;
    }

    // Find the group containing the dragged field
    const group = structure?.groups.find((g) => g.id === draggedFromGroupId);
    if (!group) {
      setInsertionIndex(null);
      return;
    }

    const sortedFields = group.fields.sort((a, b) => a.order - b.order);
    const insertIndex = calculateInsertionIndex(
      over.id as string,
      active.id as string,
      sortedFields
    );

    setInsertionIndex(insertIndex);
  };

  // Handle field drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear drag state
    setActiveId(null);
    setDraggedField(null);
    setInsertionIndex(null);
    setDraggedFromGroupId(null);

    if (!over) return;

    if (active.id !== over.id) {
      const fieldId = active.id as string;
      const groupId = active.data.current?.groupId as string;

      // Find the group and field indices
      const group = structure?.groups.find((g) => g.id === groupId);
      if (!group) return;

      const sortedFields = group.fields.sort((a, b) => a.order - b.order);
      const oldIndex = sortedFields.findIndex((f) => f.id === fieldId);
      const newIndex = calculateInsertionIndex(
        over.id as string,
        fieldId,
        sortedFields
      );

      if (oldIndex !== -1 && newIndex !== null && oldIndex !== newIndex) {
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

  // Handle toggle group collapsed state
  const handleToggleGroupCollapsed = async () => {
    if (activeGroup) {
      try {
        await toggleGroupCollapsed(activeGroup.id);
        handleGroupMenuClose();
      } catch (error) {
        console.error("Error toggling group collapsed state:", error);
      }
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
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2} // Reduced from mb={4}
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
              Edit Journal Structure
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
            sx={{ px: 3, py: 1, borderRadius: 2 }}
          >
            Save Changes
          </Button>
        </Box>

        {/* Save notifications */}
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

        {/* Main editing area */}
        <Stack spacing={4}>
          {structure.groups
            .sort((a, b) => a.order - b.order)
            .map((group) => (
              <Paper
                key={group.id}
                elevation={1}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  bgcolor: "background.paper",
                  // Add visual indicator for collapsed groups
                  opacity: group.collapsedByDefault ? 0.8 : 1,
                  border: group.collapsedByDefault ? "1px dashed" : "none",
                  borderColor: group.collapsedByDefault
                    ? "grey.400"
                    : "transparent",
                }}
              >
                {/* Group Header */}
                <Box
                  sx={{
                    bgcolor: group.collapsedByDefault ? "grey.100" : "grey.50",
                    p: 3,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                    {/* Collapsed indicator */}
                    {group.collapsedByDefault && (
                      <Tooltip title="This group is collapsed by default in journal view">
                        <VisibilityOffIcon
                          sx={{
                            mr: 1,
                            color: "text.secondary",
                            fontSize: "1.1rem",
                          }}
                        />
                      </Tooltip>
                    )}

                    {renamingGroupId === group.id ? (
                      <Box
                        component="form"
                        onSubmit={handleGroupNameSubmit}
                        sx={{ flex: 1, mr: 2 }}
                      >
                        <TextField
                          fullWidth
                          variant="outlined"
                          size="medium"
                          value={newGroupName}
                          onChange={handleGroupNameChange}
                          onBlur={handleGroupNameInputBlur}
                          inputRef={newGroupNameInputRef}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              fontSize: theme.typography.h5.fontSize,
                              fontWeight: theme.typography.h5.fontWeight,
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography
                        variant="h5"
                        component="h2"
                        sx={{
                          fontWeight: 600,
                          color: group.collapsedByDefault
                            ? "text.secondary"
                            : "text.primary",
                        }}
                      >
                        {group.name}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {group.fields.length} Field
                      {group.fields.length !== 1 ? "s" : ""}
                    </Typography>
                    {group.collapsedByDefault && (
                      <Chip
                        label="Collapsed"
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.7rem",
                          height: "20px",
                          color: "text.secondary",
                          borderColor: "grey.400",
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => handleGroupMenuOpen(e, group)}
                      aria-label="group options"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Group Content */}
                <Box sx={{ p: 3 }}>
                  {/* Fields */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={group.fields.map((field) => field.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Stack spacing={2}>
                        {group.fields
                          .sort((a, b) => a.order - b.order)
                          .map((field, index) => {
                            const isBeingDragged = activeId === field.id;
                            const isDragActive = Boolean(
                              activeId && draggedFromGroupId === group.id
                            );

                            // Show drop indicator before this field if insertion index matches
                            const showDropIndicatorBefore =
                              isDragActive &&
                              !isBeingDragged &&
                              insertionIndex === index;

                            // Show drop indicator after last field if inserting at end
                            const isLastField =
                              index === group.fields.length - 1;
                            const showDropIndicatorAfter =
                              isDragActive &&
                              !isBeingDragged &&
                              isLastField &&
                              insertionIndex === group.fields.length;

                            return (
                              <React.Fragment key={field.id}>
                                {/* Drop indicator before current field */}
                                {showDropIndicatorBefore && (
                                  <Box
                                    sx={{
                                      height: "3px",
                                      bgcolor: "primary.main",
                                      borderRadius: "1.5px",
                                      mx: 1,
                                      boxShadow:
                                        "0 0 8px rgba(25, 118, 210, 0.6)",
                                      animation:
                                        "pulse 1.5s ease-in-out infinite",
                                      "@keyframes pulse": {
                                        "0%, 100%": { opacity: 0.8 },
                                        "50%": { opacity: 1 },
                                      },
                                    }}
                                  />
                                )}

                                <Card
                                  variant="outlined"
                                  sx={{
                                    borderRadius: 2,
                                    "&:hover": {
                                      boxShadow: activeId ? 0 : 1,
                                    },
                                    opacity: isBeingDragged ? 0.3 : 1,
                                    transition: "all 0.2s ease",
                                  }}
                                >
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
                                    editingFieldTypes={editingFieldTypes}
                                    setEditingFieldTypes={setEditingFieldTypes}
                                    addFieldType={addFieldType}
                                    updateFieldType={updateFieldType}
                                    removeFieldType={removeFieldType}
                                    getFieldTypeIcon={getFieldTypeIcon}
                                  />
                                </Card>

                                {/* Drop indicator after last field */}
                                {showDropIndicatorAfter && (
                                  <Box
                                    sx={{
                                      height: "3px",
                                      bgcolor: "primary.main",
                                      borderRadius: "1.5px",
                                      mx: 1,
                                      boxShadow:
                                        "0 0 8px rgba(25, 118, 210, 0.6)",
                                      animation:
                                        "pulse 1.5s ease-in-out infinite",
                                      "@keyframes pulse": {
                                        "0%, 100%": { opacity: 0.8 },
                                        "50%": { opacity: 1 },
                                      },
                                    }}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                      </Stack>
                    </SortableContext>

                    {/* Drag Overlay */}
                    <DragOverlay dropAnimation={null}>
                      {activeId && draggedField ? (
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                            bgcolor: "background.paper",
                            border: "2px solid",
                            borderColor: "primary.main",
                            transform: "scale(1.02)",
                            opacity: 0.95,
                          }}
                        >
                          <CardContent>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <DragIndicatorIcon
                                sx={{ color: "primary.main" }}
                              />
                              <Typography variant="h6" sx={{ flex: 1 }}>
                                {draggedField.name}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                {draggedField.fieldTypes
                                  .filter((ft) => ft.kind !== "CHECK")
                                  .map((ft) => (
                                    <Chip
                                      key={ft.id}
                                      icon={getFieldTypeIcon(
                                        ft.kind as FieldTypeKind
                                      )}
                                      label={ft.description || ft.kind}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ) : null}
                    </DragOverlay>
                  </DndContext>

                  {/* Add Field Section */}
                  {addingFieldToGroup === group.id ? (
                    <Card
                      variant="outlined"
                      sx={{
                        mt: 2,
                        borderStyle: "dashed",
                        borderColor: "primary.main",
                        bgcolor: "primary.50",
                      }}
                    >
                      <CardContent>
                        <Box component="form" onSubmit={handleFieldNameSubmit}>
                          <TextField
                            fullWidth
                            variant="outlined"
                            size="medium"
                            placeholder="Enter Field Name..."
                            value={newFieldName}
                            onChange={handleFieldNameChange}
                            onBlur={() => {
                              if (newFieldName.trim()) {
                                handleFieldNameSubmit({
                                  preventDefault: () => {},
                                } as React.FormEvent);
                              } else {
                                setAddingFieldToGroup(null);
                              }
                            }}
                            inputRef={newFieldInputRef}
                            autoFocus
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ) : (
                    <Box
                      sx={{
                        mt: group.fields.length > 0 ? 3 : 0,
                        textAlign: "center",
                      }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddFieldToGroup(group.id)}
                        sx={{ borderRadius: 2 }}
                      >
                        Add Field to {group.name}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            ))}

          {/* Add Group Section */}
          <Box sx={{ textAlign: "center" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleAddGroup}
              sx={{ borderRadius: 2, px: 4, py: 1.5 }}
            >
              Add New Group
            </Button>
          </Box>
        </Stack>

        {/* Field Types Editor Dialog */}
        <Dialog
          open={Boolean(editingFieldTypes)}
          onClose={() => setEditingFieldTypes(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Configure Field Types
            {editingFieldTypes && (
              <Typography variant="body2" color="text.secondary">
                Field:{" "}
                {
                  structure.groups
                    .flatMap((g) => g.fields)
                    .find((f) => f.id === editingFieldTypes)?.name
                }
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            {editingFieldTypes && (
              <FieldTypesEditor
                field={
                  structure.groups
                    .flatMap((g) => g.fields)
                    .find((f) => f.id === editingFieldTypes)!
                }
                addFieldType={addFieldType}
                updateFieldType={updateFieldType}
                removeFieldType={removeFieldType}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingFieldTypes(null)}>Done</Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Group menu */}
      <Menu
        anchorEl={groupMenuAnchor}
        open={Boolean(groupMenuAnchor)}
        onClose={handleGroupMenuClose}
      >
        <MenuItem onClick={handleRenameGroup}>Rename Group</MenuItem>
        <MenuItem onClick={handleToggleGroupCollapsed}>
          {activeGroup?.collapsedByDefault
            ? "Show by Default"
            : "Collapse by Default"}
        </MenuItem>
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

// Simplified Field Item
const SortableFieldItem: React.FC<
  SortableFieldItemProps & {
    editingFieldTypes: string | null;
    setEditingFieldTypes: (fieldId: string | null) => void;
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
    getFieldTypeIcon: (kind: FieldTypeKind) => React.ReactElement;
  }
> = ({
  field,
  groupId,
  renamingFieldId,
  newFieldName,
  setNewFieldName,
  handleFieldRenameSubmit,
  handleFieldRenameInputBlur,
  handleFieldMenuOpen,
  setEditingFieldTypes,
  getFieldTypeIcon,
}) => {
  const { listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: field.id,
      data: { groupId, fieldId: field.id },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renamingFieldRef = useRef<HTMLInputElement>(null);
  const nonCheckFieldTypes = field.fieldTypes.filter(
    (ft) => ft.kind !== "CHECK"
  );
  const isCheckField = nonCheckFieldTypes.length === 0;

  useEffect(() => {
    if (renamingFieldId === field.id && renamingFieldRef.current) {
      renamingFieldRef.current.focus();
    }
  }, [renamingFieldId, field.id]);

  if (isDragging) {
    return <Box ref={setNodeRef} style={style} />;
  }

  return (
    <Box ref={setNodeRef} style={style}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box {...listeners} sx={{ color: "text.secondary", cursor: "grab" }}>
            <DragIndicatorIcon />
          </Box>

          {renamingFieldId === field.id ? (
            <Box
              component="form"
              onSubmit={handleFieldRenameSubmit}
              sx={{ flex: 1 }}
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
            <>
              <Typography variant="h6" sx={{ flex: 1 }}>
                {field.name}
              </Typography>

              {/* Field Type Summary */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {nonCheckFieldTypes.map((ft) => (
                  <Chip
                    key={ft.id}
                    icon={getFieldTypeIcon(ft.kind as FieldTypeKind)}
                    label={ft.description || ft.kind}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </>
          )}

          <IconButton
            size="small"
            onClick={(e) => handleFieldMenuOpen(e, field, groupId)}
            aria-label="field options"
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        {isCheckField ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Simple Field
            </Typography>
            <Tooltip title="A basic field that provides a simple checkbox for binary choices. Users can mark items as complete/incomplete, done/pending, or any other yes/no status. No additional configuration needed.">
              <InfoIcon
                fontSize="small"
                sx={{ color: "text.disabled", cursor: "help" }}
              />
            </Tooltip>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {nonCheckFieldTypes.length} Type
            {nonCheckFieldTypes.length !== 1 ? "s" : ""}
          </Typography>
        )}

        <Button
          size="small"
          startIcon={<SettingsIcon />}
          onClick={() => setEditingFieldTypes(field.id)}
          sx={{ borderRadius: 1 }}
        >
          Configure Types
        </Button>
      </CardActions>
    </Box>
  );
};

// Dedicated Field Types Editor Component
const FieldTypesEditor: React.FC<{
  field: Field;
  addFieldType: (
    fieldId: string,
    kind: FieldTypeKind,
    description?: string
  ) => Promise<FieldType | null>;
  updateFieldType: (
    fieldTypeId: string,
    updates: Partial<FieldType>
  ) => Promise<boolean>;
  removeFieldType: (fieldTypeId: string) => Promise<boolean>;
}> = ({ field, addFieldType, updateFieldType, removeFieldType }) => {
  const [fieldTypeMenuAnchor, setFieldTypeMenuAnchor] =
    useState<null | HTMLElement>(null);

  const handleAddFieldType = async (fieldTypeKind: FieldTypeKind) => {
    try {
      await addFieldType(field.id, fieldTypeKind);
      setFieldTypeMenuAnchor(null);
    } catch (error) {
      console.error("Error adding field type:", error);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Existing Field Types */}
      {field.fieldTypes
        .filter((ft) => ft.kind !== "CHECK")
        .map((fieldType) => (
          <Paper
            key={fieldType.id}
            variant="outlined"
            sx={{ p: 2, borderRadius: 2 }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                {fieldType.description || fieldType.kind}
              </Typography>
              <IconButton
                size="small"
                onClick={() => removeFieldType(fieldType.id)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <FieldTypeFactory
              fieldType={fieldType}
              value={null}
              onChange={() => {}}
              mode="edit"
              onFieldTypeUpdate={(updates) =>
                updateFieldType(fieldType.id, updates)
              }
            />
          </Paper>
        ))}

      {/* Add Field Type */}
      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={(e) => setFieldTypeMenuAnchor(e.currentTarget)}
          sx={{ borderRadius: 2 }}
        >
          Add Field Type
        </Button>
      </Box>

      {/* Field Type Menu */}
      <Menu
        anchorEl={fieldTypeMenuAnchor}
        open={Boolean(fieldTypeMenuAnchor)}
        onClose={() => setFieldTypeMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleAddFieldType("NUMBER_NAVIGATION")}>
          Number with Navigation
        </MenuItem>
        <MenuItem onClick={() => handleAddFieldType("NUMBER")}>Number</MenuItem>
        <MenuItem onClick={() => handleAddFieldType("TIME_SELECT")}>
          Time Select
        </MenuItem>
        <MenuItem onClick={() => handleAddFieldType("SEVERITY")}>
          Severity
        </MenuItem>
        <MenuItem onClick={() => handleAddFieldType("RANGE")}>Range</MenuItem>
        <MenuItem onClick={() => handleAddFieldType("CUSTOM_SCALE")}>
          Custom Scale
        </MenuItem>
      </Menu>
    </Stack>
  );
};

export default EditPageContent;
