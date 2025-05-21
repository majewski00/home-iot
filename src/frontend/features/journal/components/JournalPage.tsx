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
import { Edit as EditIcon, Save as SaveIcon } from "@mui/icons-material";
import { useJournalStructure } from "../hooks/useJournalStructure";
import { useJournalEntry } from "../hooks/useJournalEntry";
import DateNavigator from "./DateNavigator";
import JournalGroupDisplay from "./JournalGroupDisplay";
import EditPageContent from "./EditPage";
import ActionGrid from "./actions/ActionGrid";
import AllActionsPage from "./actions/AllActionsPage";

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

  // Check if we're in the all actions view
  const searchParams = new URLSearchParams(location.search);
  const isAllActionsView = searchParams.get("view") === "all-actions";

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
        onExitEditMode={() => setIsEditMode(false)}
      />
    );
  }

  // Render the All Actions page if in that view
  if (isAllActionsView) {
    return (
      <AllActionsPage
        date={selectedDate}
        structure={structure}
        entry={entry}
        refreshEntry={refreshEntry}
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

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" component="h1">
            Journal
          </Typography>

          <Box display="flex" alignItems="center" gap={2}>
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
        {/* // TODO: The error creates the unnecessary space -  create a context for error's tosters*/}
        {/* <Fade in={saveSuccess}>
          <Alert
            severity="success"
            sx={{ mt: 2, mb: 2 }}
            onClose={() => setSaveSuccess(false)}
          >
            Journal entry saved successfully!
          </Alert>
        </Fade>

        <Fade in={saveError}>
          <Alert
            severity="error"
            sx={{ mt: 2, mb: 2 }}
            onClose={() => setSaveError(false)}
          >
            Failed to save journal entry. Please try again.
          </Alert>
        </Fade> */}

        {entry && !isEditMode && (
          <ActionGrid
            date={selectedDate}
            structure={structure}
            entry={entry}
            refreshEntry={refreshEntry}
          />
        )}

        {entry && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 4,
              borderRadius: 2,
              bgcolor: theme.palette.background.default,
              border: "2px dotted",
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
                    selectedDate={selectedDate}
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
