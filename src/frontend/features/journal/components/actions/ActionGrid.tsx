import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
  IconButton,
  Alert,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate, useLocation } from "react-router-dom";
import { useJournalActions } from "../../hooks/useJournalActions";
import ActionItem from "./ActionItem";
import CreateActionModal from "./CreateActionModal";
import { Journal, JournalEntry } from "@src-types/journal/journal.types";

// Maximum number of actions to display in the main view
const MAX_VISIBLE_ACTIONS = 4;

interface ActionGridProps {
  date: string;
  structure?: Journal | null;
  entry?: JournalEntry | null;
  isStructureLoading: boolean;
  refreshEntry?: () => Promise<void>;
}

const ActionGrid: React.FC<ActionGridProps> = ({
  date,
  structure,
  entry,
  isStructureLoading,
  refreshEntry,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    registerAction: originalRegisterAction, // Rename to distinguish
    deleteAction,
    getActionDetails,
    refreshActions,
    isActionCompletedToday,
  } = useJournalActions(date, structure, entry, refreshEntry);

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

  const handleToastCancel = useCallback(() => {
    setToastState((prev) => ({ ...prev, open: false }));
  }, []);

  // Filter out invalid actions for the main grid view
  const validActions = actions.filter((action) => {
    // Only show valid actions in the main grid
    return !action._validation || action._validation.isValid;
  });

  // Sort valid actions by order property
  const sortedValidActions = [...validActions].sort((a, b) => {
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

  // Get visible actions (first MAX_VISIBLE_ACTIONS)
  const visibleActions = sortedValidActions.slice(0, MAX_VISIBLE_ACTIONS);
  const hasMoreActions =
    sortedValidActions.length > MAX_VISIBLE_ACTIONS ||
    actions.length > validActions.length; // Show "more" if there are hidden actions or invalid actions

  // Handle view all actions
  const handleViewAllActions = () => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("view", "all-actions");
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

  if (loading || isStructureLoading) {
    return (
      <Box sx={{ mt: 2, p: 2 }}>
        <Typography>Loading actions...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2, p: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button variant="outlined" onClick={refreshActions} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mt: 2,
        pb: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Quick Actions</Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Always show "View All Actions" button if there are actions or if we want to allow access */}
          {(actions.length > 0 || true) && ( // Changed to always show
            <Tooltip title="View All Actions">
              <IconButton
                onClick={handleViewAllActions}
                sx={{
                  mr: 1,
                  color: theme.palette.text.secondary,
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Tooltip>
          )}
          {validActions.length !== 0 && (
            <Button
              variant="text"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateModal}
            />
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 2, width: "98%", mx: "auto" }} />

      {validActions.length === 0 ? (
        <Paper
          sx={{
            p: 3,
            textAlign: "center",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
          elevation={0}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            {actions.length === 0
              ? "You don't have any actions yet. Create your first action to quickly update your journal."
              : "No valid actions available for the current journal structure."}
          </Typography>
          <Button
            variant="text"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
          >
            {actions.length === 0 ? "Create First Action" : "Create New Action"}
          </Button>
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              gap: 2,
              overflowX: "hidden",
            }}
          >
            {visibleActions.map((action) => (
              <Box
                key={action.id}
                sx={{
                  flexGrow: 0,
                  flexShrink: 0,
                  flexBasis: {
                    xs: `calc(50% - ${theme.spacing(1)})`,
                    sm: `calc(25% - ${theme.spacing((2 / 4) * 3)})`,
                  },
                  boxSizing: "border-box",
                }}
              >
                <ActionItem
                  action={action}
                  registerAction={registerAction}
                  deleteAction={deleteAction}
                  getActionDetails={getActionDetails}
                  showDeleteButton={!hasMoreActions}
                  isCompletedToday={
                    action.isDailyAction && isActionCompletedToday(action)
                  }
                />
              </Box>
            ))}
          </Box>
        </>
      )}

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
            <Button color="inherit" size="small" onClick={handleToastCancel}>
              Cancel
            </Button>
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
    </Box>
  );
};

export default ActionGrid;
