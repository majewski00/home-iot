import React, { useState } from "react";
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
  refreshEntry?: () => Promise<void>;
}

const ActionGrid: React.FC<ActionGridProps> = ({
  date,
  structure,
  entry,
  refreshEntry,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
  } = useJournalActions(date, structure, entry, refreshEntry);

  // Sort actions by order property (if available)
  const sortedActions = [...actions].sort((a, b) => {
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
  const visibleActions = sortedActions.slice(0, MAX_VISIBLE_ACTIONS);
  const hasMoreActions = sortedActions.length > MAX_VISIBLE_ACTIONS;

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

  if (loading) {
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
          {hasMoreActions && (
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
          {actions.length !== 0 && (
            <Button
              variant="text"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateModal}
            />
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 2, width: "98%", mx: "auto" }} />

      {actions.length === 0 ? (
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
            You don't have any actions yet. Create your first action to quickly
            update your journal.
          </Typography>
          <Button
            variant="text"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
          >
            Create First Action
          </Button>
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap", // Prevent wrapping to ensure single row
              gap: 2,
              overflowX: "hidden", // Hide overflow
            }}
          >
            {visibleActions.map((action) => (
              <Box
                key={action.id}
                sx={{
                  flexGrow: 0,
                  flexShrink: 0,
                  flexBasis: {
                    xs: `calc(50% - ${theme.spacing(1)})`, // 2 items per row on mobile
                    sm: `calc(25% - ${theme.spacing((2 / 4) * 3)})`, // 4 items per row on larger screens
                  },
                  boxSizing: "border-box",
                }}
              >
                <ActionItem
                  action={action}
                  registerAction={registerAction}
                  deleteAction={deleteAction}
                  getActionDetails={getActionDetails}
                  showDeleteButton={!hasMoreActions} // Only show delete buttons if we're not in condensed view
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
    </Box>
  );
};

export default ActionGrid;
