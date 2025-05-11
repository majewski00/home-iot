import React, { useState } from "react";
import { Box, TextField, Typography, Grid } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface TimeSelectFieldEditProps {
  fieldType: FieldType;
  onUpdate?: (updates: Partial<FieldType>) => void;
}

/**
 * TimeSelectFieldEdit component
 * Allows configuration of a TimeSelectField
 */
const TimeSelectFieldEdit: React.FC<TimeSelectFieldEditProps> = ({
  fieldType,
  onUpdate,
}) => {
  // Get current values from dataOptions or set defaults
  const [description, setDescription] = useState<string>(
    fieldType.description || ""
  );
  const [step, setStep] = useState<number>(
    fieldType.dataOptions?.step !== undefined
      ? Number(fieldType.dataOptions.step)
      : 15 // 15 minutes
  );

  // Fixed maxTime at 24 hours (1440 minutes)
  const maxTime = 1440;

  // Convert minutes to hours and minutes for display
  const formatTimeDisplay = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? "s" : ""}`;
    } else if (mins === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      return `${hours} hour${hours !== 1 ? "s" : ""} ${mins} minute${
        mins !== 1 ? "s" : ""
      }`;
    }
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (onUpdate) {
      onUpdate({ description: newDescription });
    }
  };

  // Handle step change
  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStep = Number(e.target.value);
    if (!isNaN(newStep) && newStep > 0) {
      setStep(newStep);
      if (onUpdate) {
        onUpdate({
          dataOptions: {
            ...fieldType.dataOptions,
            step: newStep,
          },
        });
      }
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        mb: 2,
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Time Select Field Settings
      </Typography>

      <Grid container spacing={2}>
        <Grid sx={{ gap: 12 }}>
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={handleDescriptionChange}
            margin="normal"
            size="small"
            placeholder="e.g., When did it happen?"
          />
        </Grid>

        <Grid sx={{ gap: 12 }}>
          <Typography variant="body2" gutterBottom>
            Maximum Time: {formatTimeDisplay(maxTime)} (fixed at 24 hours)
          </Typography>
        </Grid>

        <Grid sx={{ gap: 12 }}>
          <TextField
            fullWidth
            label="Time Step (minutes)"
            type="number"
            value={step}
            onChange={handleStepChange}
            margin="normal"
            size="small"
            inputProps={{ min: 1 }}
            helperText="Interval between selectable time values (in minutes)"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TimeSelectFieldEdit;
