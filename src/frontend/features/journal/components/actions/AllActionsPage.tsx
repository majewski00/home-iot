import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Button,
  Paper,
  useTheme,
  IconButton,
  CircularProgress,
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

  const {
    actions,
    loading,
    error,
    createAction,
    getEligibleFields,
    registerAction,
    deleteAction,
    getActionDetails,
    refreshActions,
    updateActionOrder,
  } = useJournalActions(date, structure, entry, refreshEntry);

  // State to track actions with their order
  const [orderedActions, setOrderedActions] = useState<Action[]>([]);

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

        // Update the order property for valid items only
        const reordered = arrayMove(validItems, oldIndex, newIndex).map(
          (item, index) => ({
            ...item,
            order: index,
          })
        );

        // Save the new order to the backend for each action
        reordered.forEach((action) => {
          if (action.order !== undefined) {
            updateActionOrder(action.id, action.order);
          }
        });

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
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          )}
        </Paper>

        {/* Invalid Actions Section */}
        {invalidActions.length > 0 && (
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
}

const SortableActionItem: React.FC<SortableActionItemProps> = ({
  action,
  index,
  isHighlighted,
  registerAction,
  deleteAction,
  getActionDetails,
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
      />
    </Box>
  );
};

export default AllActionsPage;
