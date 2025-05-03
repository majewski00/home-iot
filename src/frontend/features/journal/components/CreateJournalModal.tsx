import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";

interface CreateJournalModalProps {
  onCreateJournal: (name: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal for creating a new journal
 */
const CreateJournalModal: React.FC<CreateJournalModalProps> = ({
  onCreateJournal,
  onClose,
}) => {
  const [journalName, setJournalName] = useState<string>("My Journal");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!journalName.trim()) {
      setError("Journal name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateJournal(journalName);
    } catch (err) {
      setError("Failed to create journal");
      console.error("Error in CreateJournalModal:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Your Journal</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="body1" paragraph>
              Welcome to Journal! Let's create your first journal to start
              tracking your daily activities.
            </Typography>
            <Typography variant="body2" paragraph>
              You can customize your journal later by adding fields and groups.
            </Typography>
          </Box>

          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Journal Name"
            type="text"
            fullWidth
            variant="outlined"
            value={journalName}
            onChange={(e) => setJournalName(e.target.value)}
            error={!!error}
            helperText={error}
            disabled={isSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Journal"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateJournalModal;
