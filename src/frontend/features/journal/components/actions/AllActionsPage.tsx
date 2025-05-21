import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Button,
  Paper,
  useTheme,
  IconButton,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
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

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setOrderedActions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        // Update the order property for all items
        const reordered = arrayMove(items, oldIndex, newIndex).map(
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

        return reordered;
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

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: theme.palette.background.default,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {orderedActions.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              No actions available. Create some actions to get started.
            </Typography>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedActions.map((action) => action.id)}
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
                  {orderedActions.map((action, index) => (
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
