import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  CircularProgress,
  Chip,
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
import EditPageContent from "./EditPage";

/**
 * Main Journal Page component
 * Displays the journal structure and allows users to fill in entries
 */
const JournalPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const {
    structure,
    isLoading: isLoadingStructure,
    error: structureError,
    hasChanges: structureHasChanges,
    newUser,
    methods,
  } = useJournalStructure();

  const {
    entry,
    isLoading: isLoadingEntry,
    error: entryError,
    hasChanges: entryHasChanges,
    saveEntry,
    updateValue,
    refreshEntry,
  } = useJournalEntry(structure, selectedDate, isEditMode);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (isEditMode) {
      searchParams.set("mode", "edit");
    } else if (newUser) {
      searchParams.set("mode", "edit");
    } else {
      searchParams.delete("mode");
    }
    navigate(`?${searchParams.toString()}`, { replace: true });
  }, [isEditMode, navigate, location.search, newUser]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("mode") === "edit") {
      setIsEditMode(true);
    } else if (newUser) {
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [location.search]);

  useEffect(() => {
    setSaveSuccess(false);
    setSaveError(false);
  }, [selectedDate, isEditMode]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleSaveEntry = async () => {
    try {
      setSaveSuccess(false);
      setSaveError(false);

      const result = await saveEntry();

      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(true);
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      setSaveError(true);
    }
  };

  if (isLoadingStructure) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Loading journal structure...
        </Typography>
      </Box>
    );
  }

  if (structureError) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Typography variant="h6" color="error">
          Error loading journal structure: {structureError}
        </Typography>
      </Box>
    );
  }

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
            onClick={() => setIsEditMode(true)}
          >
            Create Journal
          </Button>
        </Box>
      </Container>
    );
  }

  if (isEditMode) {
    return (
      <EditPageContent
        structure={structure}
        methods={methods}
        isLoading={isLoadingStructure}
        error={structureError}
        hasChanges={structureHasChanges}
      />
    );
  }

  if (isLoadingEntry) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Loading journal entry...
        </Typography>
      </Box>
    );
  }

  if (entryError) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Typography variant="h6" color="error">
          Error loading journal entry: {entryError}
        </Typography>
      </Box>
    );
  }

  const calculateOverallCompletion = () => {
    if (!entry) return 0;
    const totalFields = entry.values.length;
    if (totalFields === 0) return 0;
    const filledFields = entry.values.filter((value) => value.filled).length;
    return Math.round((filledFields / totalFields) * 100);
  };

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
              onClick={() => setIsEditMode(true)}
              sx={{ borderRadius: 2 }}
            >
              Edit
            </Button>
          </Box>
        </Box>

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
              borderWidth: "1px",
              boxShadow: "none",
            }}
          >
            {structure.groups.length === 0 ? (
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No groups in your journal. Add some in Edit Mode.
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

            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSaveEntry}
                disabled={!entryHasChanges}
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
