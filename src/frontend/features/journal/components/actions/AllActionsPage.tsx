import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Container,
  Button,
  Paper,
  useTheme,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useLocation } from "react-router-dom";
import { useJournalActions } from "../../hooks/useJournalActions";
import ActionItem from "./ActionItem";
import CreateActionModal from "./CreateActionModal";
import {
  Journal,
  JournalEntry,
  Action,
} from "@src-types/journal/journal.types";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Maximum number of actions to display in the main view
const MAX_VISIBLE_ACTIONS = 4;

interface AllActionsPageProps {
  date: string;
  structure?: Journal | null;
  entry?: JournalEntry | null;
  refreshEntry?: () => Promise<void>;
}

const AllActionsPage: React.FC<AllActionsPageProps> = ({
  date,
  structure,
  entry,
  refreshEntry,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Add toast state
  const [toastState, setToastState] = useState<{
    open: boolean;
    actionName: string;
    actionId: string;
    value?: number;
    timeLeft: number;
  }>({
    open: false,
    actionName: "",
    actionId: "",
    timeLeft: 0,
  });

  const {
    actions,
    loading,
    error,
    createAction,
    getEligibleFields,
    registerAction: originalRegisterAction,
    deleteAction,
    getActionDetails,
    refreshActions,
    updateActionOrder,
    isActionCompletedToday,
  } = useJournalActions(date, structure, entry, refreshEntry);

  const [orderedActions, setOrderedActions] = useState<Action[]>([]);

  // Toast timer effect
  useEffect(() => {
    if (!toastState.open) return;

    const timer = setInterval(() => {
      setToastState((prev) => {
        if (prev.timeLeft <= 100) {
          // Auto-confirm when time runs out
          if (prev.actionId) {
            originalRegisterAction(prev.actionId, prev.value);
          }
          return { ...prev, open: false, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 100 };
      });
    }, 100);

    return () => clearInterval(timer);
  }, [toastState.open, originalRegisterAction]);

  const handleToastConfirm = useCallback(async () => {
    if (toastState.actionId) {
      await originalRegisterAction(toastState.actionId, toastState.value);
    }
    setToastState((prev) => ({ ...prev, open: false }));
  }, [toastState, originalRegisterAction]);

  const handleToastCancel = useCallback(() => {
    setToastState((prev) => ({ ...prev, open: false }));
  }, []);

  // Override the registerAction function to show toast first
  const registerAction = useCallback(
    async (actionId: string, value?: number) => {
      const action = actions.find((a) => a.id === actionId);
      if (!action) return false;

      // If it's a daily action that's already completed today, don't proceed
      if (action.isDailyAction && isActionCompletedToday(action)) {
        return false;
      }

      // Show toast
      setToastState({
        open: true,
        actionName: action.name,
        actionId,
        value,
        timeLeft: 3000,
      });

      return true;
    },
    [actions, isActionCompletedToday]
  );

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize ordered actions when actions are loaded
  useEffect(() => {
    if (actions.length > 0) {
      // Sort actions by order property (if available)
      const sorted = [...actions].sort((a, b) => {
        // If both have order, sort by order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // If only a has order, a comes first
        if (a.order !== undefined) return -1;
        // If only b has order, b comes first
        if (b.order !== undefined) return 1;
        // If neither has order, maintain original order
        return 0;
      });

      // Ensure all actions have an order property
      const withOrder = sorted.map((action, index) => ({
        ...action,
        order: action.order !== undefined ? action.order : index,
      }));

      setOrderedActions(withOrder);
    }
  }, [actions]);

  // Separate valid and invalid actions
  const validActions = orderedActions.filter(
    (action) => !action._validation || action._validation.isValid
  );
  const invalidActions = orderedActions.filter(
    (action) => action._validation && !action._validation.isValid
  );

  // Handle drag end event - only for valid actions
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setOrderedActions((items) => {
        // Only reorder valid actions
        const validItems = items.filter(
          (item) => !item._validation || item._validation.isValid
        );
        const invalidItems = items.filter(
          (item) => item._validation && !item._validation.isValid
        );

        const oldIndex = validItems.findIndex((item) => item.id === active.id);
        const newIndex = validItems.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return items;

        // Apply arrayMove to get the final reordered array
        const reordered = arrayMove(validItems, oldIndex, newIndex).map(
          (item, index) => ({
            ...item,
            order: index,
          })
        );

        // Calculate the correct backend position
        // The backend expects the final position after the splice operations
        // arrayMove simulates: splice(oldIndex, 1) then splice(newIndex, 0, item)
        // So newIndex is the correct position to send
        const draggedActionId = active.id as string;
        updateActionOrder(draggedActionId, newIndex);

        // Combine reordered valid actions with unchanged invalid actions
        return [...reordered, ...invalidItems];
      });
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete("view");
    navigate(`?${searchParams.toString()}`);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleActionCreated = () => {
    refreshActions();
    handleCloseCreateModal();
  };

  // Handle delete all invalid actions
  const handleDeleteAllInvalid = async () => {
    setIsDeletingAll(true);
    try {
      // Delete all invalid actions in parallel
      await Promise.all(
        invalidActions.map((action) => deleteAction(action.id))
      );
      // Refresh actions to update the UI
      refreshActions();
    } catch (error) {
      console.error("Error deleting invalid actions:", error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <Typography>Loading actions...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <Typography color="error">{error}</Typography>
          <Button variant="outlined" onClick={refreshActions} sx={{ mt: 1 }}>
            Retry
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
              onClick={handleBackClick}
              aria-label="back to journal"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              All Quick Actions
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
          >
            Add Action
          </Button>
        </Box>

        {/* Valid Actions Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: theme.palette.background.default,
            border: "1px solid",
            borderColor: "divider",
            mb: invalidActions.length > 0 ? 3 : 0,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Active Actions
          </Typography>

          {validActions.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              No valid actions available. Create some actions to get started.
            </Typography>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={validActions.map((action) => action.id)}
                strategy={rectSortingStrategy}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: `repeat(${MAX_VISIBLE_ACTIONS / 2}, 1fr)`,
                      md: `repeat(${MAX_VISIBLE_ACTIONS}, 1fr)`,
                    },
                    gap: 2,
                  }}
                >
                  {validActions.map((action, index) => (
                    <SortableActionItem
                      key={action.id}
                      action={action}
                      index={index}
                      isHighlighted={index < MAX_VISIBLE_ACTIONS}
                      registerAction={registerAction}
                      deleteAction={deleteAction}
                      getActionDetails={getActionDetails}
                      isActionCompletedToday={isActionCompletedToday}
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          )}
        </Paper>

        {/* Invalid Actions Section */}
        {invalidActions.length > 0 && !loading && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: theme.palette.background.default,
              border: "1px solid",
              borderColor: "warning.main",
              borderStyle: "dashed",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="h6" sx={{ color: "warning.main" }}>
                Invalid Actions
              </Typography>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={handleDeleteAllInvalid}
                disabled={isDeletingAll}
                startIcon={
                  isDeletingAll ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DeleteIcon />
                  )
                }
              >
                {isDeletingAll ? "Deleting..." : "Delete All Invalid"}
              </Button>
            </Box>
            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
              These actions are no longer compatible with your current journal
              structure. You can delete them or wait until the associated fields
              are recreated.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: `repeat(${MAX_VISIBLE_ACTIONS / 2}, 1fr)`,
                  md: `repeat(${MAX_VISIBLE_ACTIONS}, 1fr)`,
                },
                gap: 2,
              }}
            >
              {invalidActions.map((action) => (
                <Box
                  key={action.id}
                  sx={{
                    position: "relative",
                    opacity: 0.6,
                    filter: "grayscale(0.5)",
                  }}
                >
                  <ActionItem
                    action={action}
                    registerAction={async () => false} // Disabled - cannot be triggered
                    deleteAction={deleteAction}
                    getActionDetails={(action) => {
                      // Override getActionDetails to show minimal info
                      return {
                        fieldName: action.name,
                        fieldTypeName: "Invalid Configuration",
                        fieldTypeKind: null,
                        currentValue: null,
                        isCustom: false,
                        validation: action._validation,
                      };
                    }}
                    showDeleteButton={true}
                    isCompletedToday={false}
                  />

                  {/* Disabled overlay - prevents interaction except for delete button */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "transparent",
                      cursor: "not-allowed",
                      zIndex: 1,
                      // Exclude the delete button area from pointer events
                      clipPath:
                        "polygon(0% 0%, 85% 0%, 85% 35%, 100% 35%, 100% 0%, 100% 100%, 0% 100%)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>

      <CreateActionModal
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onActionCreated={handleActionCreated}
        createAction={createAction}
        getEligibleFields={getEligibleFields}
        existingActions={actions}
      />

      {/* Toast Notification */}
      <Snackbar
        open={toastState.open}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: "20px !important" }}
      >
        <Alert
          severity="info"
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button color="inherit" size="small" onClick={handleToastConfirm}>
                Confirm
              </Button>
              <Button color="inherit" size="small" onClick={handleToastCancel}>
                Cancel
              </Button>
            </Box>
          }
          sx={{ minWidth: "300px" }}
        >
          {toastState.actionName} action pressed
          <Box sx={{ width: "100%", mt: 1 }}>
            <Box
              sx={{
                height: 4,
                backgroundColor: "rgba(255,255,255,0.3)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  backgroundColor: "primary.main",
                  width: `${((3000 - toastState.timeLeft) / 3000) * 100}%`,
                  transition: "width 0.1s linear",
                }}
              />
            </Box>
          </Box>
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Sortable Action Item Component
interface SortableActionItemProps {
  action: Action;
  index: number;
  isHighlighted: boolean;
  registerAction: (actionId: string, value?: number) => Promise<boolean>;
  deleteAction: (actionId: string) => Promise<boolean>;
  getActionDetails: (action: Action) => any;
  isActionCompletedToday: (action: Action) => boolean;
}

const SortableActionItem: React.FC<SortableActionItemProps> = ({
  action,
  index,
  isHighlighted,
  registerAction,
  deleteAction,
  getActionDetails,
  isActionCompletedToday,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: action.id,
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
        cursor: "grab",
        position: "relative",
        "&:hover": {
          "& .drag-handle": {
            opacity: 1,
          },
        },
        // Highlight the first row of actions
        ...(isHighlighted && {
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: "2px solid",
            borderColor: "primary.main",
            borderRadius: 2,
            pointerEvents: "none",
            zIndex: 1,
          },
        }),
      }}
      {...attributes}
    >
      <Box
        className="drag-handle"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "20px",
          backgroundColor: "rgba(0, 0, 0, 0.05)",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: 0,
          transition: "opacity 0.2s",
          zIndex: 2,
        }}
        {...listeners}
      >
        <Box
          sx={{
            width: "40px",
            height: "4px",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderRadius: "2px",
          }}
        />
      </Box>

      <ActionItem
        action={action}
        registerAction={registerAction}
        deleteAction={deleteAction}
        getActionDetails={getActionDetails}
        isCompletedToday={
          action.isDailyAction && isActionCompletedToday(action)
        }
      />
    </Box>
  );
};

export default AllActionsPage;
