import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  Fade,
  useTheme,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  LocalFireDepartment as StreakIcon,
} from "@mui/icons-material";
import { useJournalStructure } from "../hooks/useJournalStructure";
import { useJournalEntry } from "../hooks/useJournalEntry";
import DateNavigator from "./DateNavigator";
import JournalGroupDisplay from "./JournalGroupDisplay";

/**
 * Main Journal Page component
 * Displays the journal structure and allows users to fill in entries
 */
const JournalPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<boolean>(false);

  // Get journal structure
  const {
    structure,
    isLoading: isLoadingStructure,
    error: structureError,
  } = useJournalStructure(); // return

  // Get journal entry for selected date
  const {
    entry,
    isLoading: isLoadingEntry,
    error: entryError,
    hasChanges,
    saveEntry,
    updateValue,
    refreshEntry,
  } = useJournalEntry(structure, selectedDate);

  // Reset notifications when date changes
  useEffect(() => {
    setSaveSuccess(false);
    setSaveError(false);
  }, [selectedDate]);

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaveSuccess(false);
      setSaveError(false);

      const result = await saveEntry();

      if (result) {
        setSaveSuccess(true);
        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(true);
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      setSaveError(true);
    }
  };

  // Loading state
  const isLoading = isLoadingStructure || isLoadingEntry;
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

  // Error state
  const error = structureError || entryError;
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
            // This would navigate to a journal creation page
            // or open a creation modal
            onClick={() => console.log("Create journal")}
          >
            Create Journal
          </Button>
        </Box>
      </Container>
    );
  }

  // Calculate overall completion percentage
  const calculateOverallCompletion = () => {
    if (!entry) return 0;

    const totalFields = entry.values.length;
    if (totalFields === 0) return 0;

    const filledFields = entry.values.filter((value) => value.filled).length;
    return Math.round((filledFields / totalFields) * 100);
  };

  const completionPercentage = calculateOverallCompletion();

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
            Journal
          </Typography>

          <Box display="flex" alignItems="center" gap={2}>
            {/* Placeholder for streak - would come from backend */}
            <Chip
              icon={<StreakIcon />}
              label="7 Day Streak"
              color="primary"
              variant="outlined"
              sx={{
                borderRadius: 2,
                "& .MuiChip-icon": { color: theme.palette.warning.main },
              }}
            />

            {/* Edit button - navigate to edit page */}
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              size="small"
              onClick={() => navigate("/journal/edit")}
              sx={{ borderRadius: 2 }}
            >
              Edit
            </Button>
          </Box>
        </Box>

        {/* Date Navigator */}
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />

        {/* Save notification */}
        <Fade in={saveSuccess}>
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSaveSuccess(false)}
          >
            Journal entry saved successfully!
          </Alert>
        </Fade>

        <Fade in={saveError}>
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setSaveError(false)}
          >
            Failed to save journal entry. Please try again.
          </Alert>
        </Fade>

        {/* Journal content */}
        {entry && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: theme.palette.background.default,
              border: "1px solid",
              borderColor: "divider",
              borderWidth: "1px", // Reduced border prominence
              boxShadow: "none", // Remove any shadow
            }}
          >
            {/* Journal header with completion */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              {/* Removed "Fill Your Journal" text as per TODO */}
              {/* Removed overall completion percentage as per TODO */}
            </Box>

            {/* Removed divider as per TODO */}

            {/* Groups */}
            {structure.groups.length === 0 ? (
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No groups in your journal. Add some to get started.
              </Typography>
            ) : (
              structure.groups
                .sort((a, b) => a.order - b.order)
                .map((group) => (
                  <JournalGroupDisplay
                    key={group.id}
                    group={group}
                    entry={entry}
                    onUpdateValue={updateValue}
                  />
                ))
            )}

            {/* Save button */}
            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!hasChanges}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: 2,
                  "&:hover": {
                    boxShadow: 4,
                  },
                }}
              >
                Save Journal
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default JournalPage;
