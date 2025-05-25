import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Action } from "@src-types/journal/journal.types";
import { UseJournalActionsReturn } from "../../hooks/useJournalActions";
import NumberInputModal from "./NumberInputModal";

interface ActionItemProps {
  action: Action;
  registerAction: UseJournalActionsReturn["registerAction"];
  deleteAction: UseJournalActionsReturn["deleteAction"];
  getActionDetails: UseJournalActionsReturn["getActionDetails"];
  showDeleteButton?: boolean;
  isCompletedToday?: boolean;
}

const ActionItem: React.FC<ActionItemProps> = ({
  action,
  registerAction,
  deleteAction,
  getActionDetails,
  showDeleteButton = true,
  isCompletedToday = false,
}) => {
  const [isNumberModalOpen, setIsNumberModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const actionDetails = getActionDetails(action);

  const handleRegisterAction = async (customValue?: number) => {
    setIsRegistering(true);
    try {
      await registerAction(action.id, customValue);
    } finally {
      setIsRegistering(false);
      setIsNumberModalOpen(false);
    }
  };

  const handleDeleteAction = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent action click when deleting
    setIsDeleting(true);
    try {
      await deleteAction(action.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActionClick = () => {
    if (isCompletedToday) return; // Don't proceed if daily action is completed

    if (!actionDetails) return;

    // For NUMBER_NAVIGATION or NUMBER with custom value, open the number input modal
    if (
      (actionDetails.fieldTypeKind === "NUMBER_NAVIGATION" ||
        actionDetails.fieldTypeKind === "NUMBER") &&
      actionDetails.isCustom
    ) {
      setIsNumberModalOpen(true);
      return;
    }

    // Otherwise, register the action
    handleRegisterAction();
  };

  return (
    <>
      <Paper
        sx={{
          p: 2,
          height: 120,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          border: "1px solid rgba(0, 0, 0, 0.12)",
          borderRadius: 2,
          boxShadow: "none",
          transition: "all 0.2s ease-in-out",
          boxSizing: "border-box",
          opacity: isCompletedToday ? 0.5 : 1,
          cursor: isCompletedToday ? "not-allowed" : "pointer",
          "&:hover": isCompletedToday
            ? {} // No hover effect when completed
            : {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                transform: "translateY(-2px)",
              },
        }}
        elevation={0}
        onClick={handleActionClick}
      >
        {showDeleteButton && (
          <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex" }}>
            <Tooltip title="Delete Action">
              <IconButton
                size="small"
                onClick={handleDeleteAction}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <CircularProgress size={20} />
                ) : (
                  <DeleteIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Typography
          variant="subtitle1"
          sx={{
            mb: 1,
            fontWeight: "bold",
            pr: showDeleteButton ? 5 : 1, // Adjust padding based on delete button presence
          }}
        >
          {action.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {actionDetails?.fieldTypeName || ""}
        </Typography>

        {/* Optional: Add visual indicator for completed daily actions */}
        {isCompletedToday && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ position: "absolute", bottom: 8, right: 8 }}
          >
            Completed today
          </Typography>
        )}

        <Box
          sx={{
            mt: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 40,
          }}
        >
          {isRegistering && <CircularProgress size={24} />}
        </Box>
      </Paper>

      {actionDetails && (
        <NumberInputModal
          open={isNumberModalOpen}
          onClose={() => setIsNumberModalOpen(false)}
          onSubmit={handleRegisterAction}
          fieldTypeKind={actionDetails.fieldTypeKind || "NUMBER"}
          currentValue={actionDetails.currentValue}
          min={
            actionDetails.fieldTypeDataOptions?.min !== undefined
              ? Number(actionDetails.fieldTypeDataOptions.min)
              : 0
          }
          max={
            actionDetails.fieldTypeDataOptions?.max !== undefined
              ? Number(actionDetails.fieldTypeDataOptions.max)
              : undefined
          }
          step={
            actionDetails.fieldTypeDataOptions?.step !== undefined
              ? Number(actionDetails.fieldTypeDataOptions.step)
              : 1
          }
          unit={actionDetails.fieldTypeDataOptions?.unit}
          description={actionDetails.fieldTypeName || "Enter Value"}
        />
      )}
    </>
  );
};

export default ActionItem;
