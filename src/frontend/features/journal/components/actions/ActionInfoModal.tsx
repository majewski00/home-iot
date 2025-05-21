import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import { Action } from "@src-types/journal/journal.types";

interface ActionInfoModalProps {
  open: boolean;
  onClose: () => void;
  action: Action;
  actionDetails: any;
}

const ActionInfoModal: React.FC<ActionInfoModalProps> = ({
  open,
  onClose,
  action,
  actionDetails,
}) => {
  if (!actionDetails) return null;

  const getFieldTypeLabel = (kind: string) => {
    switch (kind) {
      case "NUMBER":
        return "Number";
      case "NUMBER_NAVIGATION":
        return "Number Navigation";
      case "TIME_SELECT":
        return "Time Select";
      default:
        return kind;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Action Details</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Typography variant="h6" gutterBottom>
            {action.name}
          </Typography>

          {action.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {action.description}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Associated Field
          </Typography>
          <Typography variant="body1" paragraph>
            {actionDetails.fieldName}
          </Typography>

          <Typography variant="subtitle2" gutterBottom>
            Field Type
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Chip
              label={getFieldTypeLabel(actionDetails.fieldTypeKind)}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Action Behavior
          </Typography>
          <Typography variant="body1">
            {actionDetails.isCustom
              ? "Prompts for custom value input"
              : actionDetails.incrementValue !== undefined
              ? `Increments value by ${actionDetails.incrementValue}`
              : "Records completion"}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Current Value
          </Typography>
          <Typography variant="body1">
            {actionDetails.currentValue !== null &&
            actionDetails.currentValue !== undefined
              ? actionDetails.currentValue.toString()
              : "Not set"}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Created: {new Date(action.createdAt).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActionInfoModal;
