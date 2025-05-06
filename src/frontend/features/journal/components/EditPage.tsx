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
} from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  MoreVert as MoreVertIcon,
  DragIndicator as DragIndicatorIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useJournalStructure } from "../hooks/useJournalStructure";
import { Field, Group } from "@src-types/journal/journal.types";
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

/**
 * EditPage component for editing journal structure
 * Allows users to add, remove, and reorder fields and groups
 */
const EditPage: React.FC = () => {
  const theme = useTheme();
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<boolean>(false);
  const [newFieldName, setNewFieldName] = useState<string>("");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showFieldInput, setShowFieldInput] = useState<{
    groupId: string;
    index: number | null;
  } | null>(null);
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState<string>("");
  const newFieldInputRef = useRef<HTMLInputElement>(null);
  const newGroupNameInputRef = useRef<HTMLInputElement>(null);

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get journal structure
  const {
    structure,
    isLoading,
    error,
    hasChanges,
    addGroup,
    addField,
    updateField,
    updateGroup,
    removeField,
    saveStructure,
    reorderField,
  } = useJournalStructure();

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
  const handleSave = async () => {
    try {
      setSaveSuccess(false);
      setSaveError(false);

      const result = await saveStructure();

      if (result) {
        setSaveSuccess(true);
        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(true);
      }
    } catch (error) {
      console.error("Error saving journal structure:", error);
      setSaveError(true);
    }
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
      const newField = await addField(groupId, name);

      if (newField && index !== null) {
        // If we're inserting at a specific index, reorder the field
        const group = structure?.groups.find((g) => g.id === groupId);
        if (group) {
          await reorderField(newField.id, index);
        }
      }

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
  const handleDeleteField = async (fieldId: string) => {
    try {
      await removeField(fieldId);
    } catch (error) {
      console.error("Error removing field:", error);
    }
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
        // This would need to be implemented in useJournalStructure -- I will take care of it
        // TODO: await removeGroup(activeGroup.id);
        console.log("Delete group:", activeGroup.id);
        handleGroupMenuClose();
      } catch (error) {
        console.error("Error removing group:", error);
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
          <Typography variant="h4" component="h1">
            Edit Journal
          </Typography>

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
            border: "1px solid",
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
                            autoFocus
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
                                  onDelete={handleDeleteField}
                                />

                                {/* Field insertion hover area */}
                                <Box
                                  className="field-insert"
                                  sx={{
                                    height: "20px",
                                    mb: 1,
                                    opacity: 0,
                                    transition: "opacity 0.2s",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    "&:hover": {
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
                                      onClick={() =>
                                        handleAddField(group.id, index + 1)
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
        <MenuItem onClick={handleDeleteGroup} sx={{ color: "error.main" }}>
          Delete Group
        </MenuItem>
      </Menu>
    </Container>
  );
};

// Sortable Field Item Component
interface SortableFieldItemProps {
  field: Field;
  groupId: string;
  onDelete: (fieldId: string) => void;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({
  field,
  groupId,
  onDelete,
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
        alignItems: "center",
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

      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
        {field.name}
      </Typography>

      <Box
        className="field-actions"
        sx={{
          opacity: 0,
          transition: "opacity 0.2s",
        }}
      >
        <IconButton
          size="small"
          onClick={() => onDelete(field.id)}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default EditPage;
