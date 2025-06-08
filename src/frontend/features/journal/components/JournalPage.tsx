import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useBlocker } from "react-router-dom";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
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
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null);

  // Check if we're in the all actions view
  const searchParams = new URLSearchParams(location.search);
  const isAllActionsView = searchParams.get("view") === "all-actions";

  const {
    structure,
    isLoading: isLoadingStructure,
    error: structureError,
    hasChanges: structureHasChanges,
    newUser,
    isHistorical,
    methods,
  } = useJournalStructure(selectedDate);

  const {
    entry,
    isLoading: isLoadingEntry,
    error: entryError,
    hasChanges: entryHasChanges,
    saveEntry,
    updateValue,
    refreshEntry,
    quickFillValues,
  } = useJournalEntry(structure, selectedDate, isEditMode);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      entryHasChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowUnsavedChangesDialog(true);
      setPendingNavigation(() => () => blocker.proceed());
    }
  }, [blocker]);

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
    if (isHistorical) {
      // Prevent editing historical structures
      setIsEditMode(false);
    } else if (searchParams.get("mode") === "edit") {
      setIsEditMode(true);
    } else if (newUser) {
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [location.search, isHistorical, newUser]);

  useEffect(() => {
    setSaveSuccess(false);
    setSaveError(false);
  }, [selectedDate, isEditMode]);

  const handleDateChange = (date: string) => {
    if (entryHasChanges) {
      setShowUnsavedChangesDialog(true);
      setPendingNavigation(() => () => {
        setSelectedDate(date);
        if (isEditMode) {
          setIsEditMode(false);
        }
      });
      return;
    }

    setSelectedDate(date);
    if (isEditMode) {
      setIsEditMode(false);
    }
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

  const handleUnsavedChangesDialog = async (
    action: "save" | "discard" | "cancel"
  ) => {
    if (action === "save") {
      try {
        const result = await saveEntry();
        if (result) {
          setShowUnsavedChangesDialog(false);
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }
        } else {
          setSaveError(true);
        }
      } catch (error) {
        console.error("Error saving journal entry:", error);
        setSaveError(true);
      }
    } else if (action === "discard") {
      setShowUnsavedChangesDialog(false);
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
    } else {
      // Cancel
      setShowUnsavedChangesDialog(false);
      setPendingNavigation(null);
      if (blocker.state === "blocked") {
        blocker.reset();
      }
    }
  };

  const isToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return selectedDate === today;
  }, [selectedDate]);

  // if (isLoadingStructure) {
  //   return (
  //     <Box
  //       display="flex"
  //       justifyContent="center"
  //       alignItems="center"
  //       minHeight="80vh"
  //     >
  //       <CircularProgress />
  //       <Typography variant="h6" ml={2}>
  //         Loading journal structure...
  //       </Typography>
  //     </Box>
  //   );
  // }

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

  if (!structure && !isLoadingStructure) {
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

  // if (isLoadingEntry) {
  //   return (
  //     <Box
  //       display="flex"
  //       justifyContent="center"
  //       alignItems="center"
  //       minHeight="80vh"
  //     >
  //       <CircularProgress />
  //       <Typography variant="h6" ml={2}>
  //         Loading journal entry...
  //       </Typography>
  //     </Box>
  //   );
  // }

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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box py={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h4" component="h1">
              Journal
            </Typography>
            {isHistorical && (
              <Chip
                label="Historical View"
                color="warning"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {isToday && !isEditMode && (
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                size="small"
                onClick={() => quickFillValues()}
                disabled={!isToday}
                sx={{ borderRadius: 2 }}
                title={"Fill in the journal with yesterday's values"}
              >
                Quick Fill
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              size="small"
              onClick={() => setIsEditMode(true)}
              disabled={isHistorical}
              sx={{ borderRadius: 2 }}
              title={
                isHistorical
                  ? "Cannot edit historical structures"
                  : "Edit journal structure"
              }
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

        {isToday && entry && !isEditMode && (
          <ActionGrid
            date={selectedDate}
            structure={structure}
            entry={entry}
            isStructureLoading={isLoadingStructure || isLoadingEntry}
            refreshEntry={refreshEntry}
          />
        )}

        {entry && structure && !isLoadingStructure && !isLoadingEntry && (
          <Paper
            elevation={0}
            sx={{
              mt: 4,
              borderRadius: 3,
              bgcolor: "background.paper",
              overflow: "hidden",
            }}
          >
            {structure.groups.length === 0 ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  No groups in your journal
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add some groups in Edit Mode to get started.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 0.2 }}>
                {structure.groups
                  .sort((a, b) => a.order - b.order)
                  .map((group) => (
                    <JournalGroupDisplay
                      key={group.id}
                      group={group}
                      entry={entry}
                      onUpdateValue={updateValue}
                      selectedDate={selectedDate}
                    />
                  ))}
              </Box>
            )}
          </Paper>
        )}

        {/* Floating Save Button - only appears when there are changes */}
        {entryHasChanges && (
          <Fade in={entryHasChanges}>
            <Box
              sx={{
                position: "fixed",
                bottom: 24,
                right: 24,
                zIndex: 1000,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSaveEntry}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  boxShadow: "0 8px 24px rgba(25, 118, 210, 0.3)",
                  "&:hover": {
                    boxShadow: "0 12px 32px rgba(25, 118, 210, 0.4)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Save Journal
              </Button>
            </Box>
          </Fade>
        )}
        {isLoadingStructure && isLoadingEntry && (
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
        )}
      </Box>

      {/* Unsaved Changes Dialog */}
      <Dialog
        open={showUnsavedChangesDialog}
        onClose={() => handleUnsavedChangesDialog("cancel")}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes in your journal entry. What would you like
            to do?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleUnsavedChangesDialog("cancel")}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleUnsavedChangesDialog("discard")}
            color="warning"
            variant="outlined"
          >
            Discard Changes
          </Button>
          <Button
            onClick={() => handleUnsavedChangesDialog("save")}
            color="primary"
            variant="contained"
          >
            Save & Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JournalPage;
