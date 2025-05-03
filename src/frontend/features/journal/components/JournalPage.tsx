import React, { useState, useEffect } from "react";
import { useJournal } from "../hooks/useJournal";
import CreateJournalModal from "./CreateJournalModal";
import JournalEntryForm from "./JournalEntryForm";
import JournalDayView from "./JournalDayView";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Container,
  Divider,
  IconButton,
  Chip,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

/**
 * Main Journal page component
 * Handles different states:
 * - New user (no journal)
 * - Existing user with journal
 */
const JournalPage: React.FC = () => {
  const {
    journal,
    isLoading,
    error,
    stats,
    createNewJournal,
    addGroup,
    addField,
    addFieldType,
  } = useJournal();

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [view, setView] = useState<"view" | "edit">("view");

  // Show create modal if user doesn't have a journal
  useEffect(() => {
    if (!isLoading && !journal && !error) {
      setShowCreateModal(true);
    }
  }, [isLoading, journal, error]);

  // Handle journal creation
  const handleCreateJournal = async (name: string) => {
    const result = await createNewJournal(name);
    if (result) {
      setShowCreateModal(false);
    }
  };

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Handle view toggle
  const handleViewToggle = () => {
    setView(view === "view" ? "edit" : "view");
  };

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
          Loading journal...
        </Typography>
      </Box>
    );
  }

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

  const isToday = selectedDate === new Date().toISOString().split("T")[0];
  const formattedDate = isToday
    ? "Today"
    : new Date(selectedDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Journal
        </Typography>

        {/* Journal creation modal */}
        {showCreateModal && (
          <CreateJournalModal
            onCreateJournal={handleCreateJournal}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {/* Journal content */}
        {journal && (
          <Paper elevation={2}>
            <Box p={3}>
              {/* Journal header */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h4">{journal.name}</Typography>
                {stats && (
                  <Box display="flex" gap={2}>
                    <Chip
                      label={`Streak: ${stats.streak} days`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`Completion: ${stats.completionRate}%`}
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Date navigation */}
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                mb={3}
              >
                <IconButton
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() - 1);
                    handleDateChange(date.toISOString().split("T")[0]);
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h5" sx={{ mx: 2 }}>
                  {formattedDate}
                </Typography>
                <IconButton
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() + 1);
                    const today = new Date().toISOString().split("T")[0];
                    if (date.toISOString().split("T")[0] <= today) {
                      handleDateChange(date.toISOString().split("T")[0]);
                    }
                  }}
                  disabled={isToday}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>

              {/* View/Edit toggle */}
              <Box display="flex" justifyContent="center" mb={3}>
                <Button
                  variant="contained"
                  color={view === "view" ? "primary" : "secondary"}
                  onClick={handleViewToggle}
                  startIcon={
                    view === "view" ? <EditIcon /> : <VisibilityIcon />
                  }
                >
                  {view === "view" ? "Fill in Journal" : "View Journal"}
                </Button>
              </Box>

              {/* Journal content based on view */}
              <Box mt={3}>
                {view === "edit" ? (
                  <JournalEntryForm
                    journal={journal}
                    date={selectedDate}
                    onSave={() => setView("view")}
                  />
                ) : (
                  <JournalDayView
                    journal={journal}
                    date={selectedDate}
                    onEdit={() => setView("edit")}
                  />
                )}
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Journal management */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Manage Journal
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Add/Remove Fields
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default JournalPage;
