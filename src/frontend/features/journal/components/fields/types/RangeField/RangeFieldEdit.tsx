import React, { useState } from "react";
import { Box, TextField, Typography, Grid, Slider } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface RangeFieldEditProps {
  fieldType: FieldType;
  onUpdate?: (updates: Partial<FieldType>) => void;
}

/**
 * RangeFieldEdit component
 * Allows configuration of a RangeField
 */
const RangeFieldEdit: React.FC<RangeFieldEditProps> = ({
  fieldType,
  onUpdate,
}) => {
  // Get current values from dataOptions or set defaults
  const [description, setDescription] = useState<string>(
    fieldType.description || ""
  );
  const [minValue, setMinValue] = useState<number>(
    fieldType.dataOptions?.min !== undefined
      ? Number(fieldType.dataOptions.min)
      : 0
  );
  const [maxValue, setMaxValue] = useState<number>(
    fieldType.dataOptions?.max !== undefined
      ? Number(fieldType.dataOptions.max)
      : 100
  );
  const [step, setStep] = useState<number>(
    fieldType.dataOptions?.step !== undefined
      ? Number(fieldType.dataOptions.step)
      : 1
  );
  const [unitLabel, setUnitLabel] = useState<string>(
    (fieldType.dataOptions?.unit as string) || ""
  );

  // Format value with unit if available
  const formatValue = (val: number): string => {
    if (unitLabel) {
      return `${val} ${unitLabel}`;
    }
    return val.toString();
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (onUpdate) {
      onUpdate({ description: newDescription });
    }
  };

  // Handle min value change
  const handleMinValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinValue = Number(e.target.value);
    if (!isNaN(newMinValue)) {
      setMinValue(newMinValue);
      if (onUpdate) {
        onUpdate({
          dataOptions: {
            ...fieldType.dataOptions,
            min: newMinValue,
          },
        });
      }
    }
  };

  // Handle max value change
  const handleMaxValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxValue = Number(e.target.value);
    if (!isNaN(newMaxValue)) {
      setMaxValue(newMaxValue);
      if (onUpdate) {
        onUpdate({
          dataOptions: {
            ...fieldType.dataOptions,
            max: newMaxValue,
          },
        });
      }
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

  // Handle unit label change
  const handleUnitLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUnitLabel = e.target.value;
    setUnitLabel(newUnitLabel);
    if (onUpdate) {
      onUpdate({
        dataOptions: {
          ...fieldType.dataOptions,
          unit: newUnitLabel,
        },
      });
    }
  };

  // Calculate marks for the preview slider
  const calculateMarks = () => {
    const range = maxValue - minValue;
    const markCount = Math.min(5, range + 1); // Max 5 marks

    if (markCount <= 1)
      return [{ value: minValue, label: formatValue(minValue) }];

    const marks = [];
    const stepSize = range / (markCount - 1);

    for (let i = 0; i < markCount; i++) {
      const value = minValue + i * stepSize;
      marks.push({
        value,
        label: formatValue(Math.round(value)),
      });
    }

    return marks;
  };

  const marks = calculateMarks();

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
        Range Field Settings
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
            placeholder="e.g., Select a value"
          />
        </Grid>

        <Grid sx={{ gap: 6 }}>
          <TextField
            fullWidth
            label="Minimum Value"
            type="number"
            value={minValue}
            onChange={handleMinValueChange}
            margin="normal"
            size="small"
          />
        </Grid>

        <Grid sx={{ gap: 6 }}>
          <TextField
            fullWidth
            label="Maximum Value"
            type="number"
            value={maxValue}
            onChange={handleMaxValueChange}
            margin="normal"
            size="small"
          />
        </Grid>

        <Grid sx={{ gap: 6 }}>
          <TextField
            fullWidth
            label="Step"
            type="number"
            value={step}
            onChange={handleStepChange}
            margin="normal"
            size="small"
            inputProps={{ min: 0.01 }}
            helperText="Increment between values"
          />
        </Grid>

        <Grid sx={{ gap: 6 }}>
          <TextField
            fullWidth
            label="Unit Label (optional)"
            value={unitLabel}
            onChange={handleUnitLabelChange}
            margin="normal"
            size="small"
            placeholder="e.g., kg, cm, etc."
          />
        </Grid>

        <Grid sx={{ gap: 12 }}>
          <Typography variant="body2" gutterBottom>
            Preview:
          </Typography>
          <Box sx={{ px: 2, py: 1 }}>
            <Slider
              min={minValue}
              max={maxValue}
              step={step}
              marks={marks}
              value={(maxValue + minValue) / 2}
              valueLabelDisplay="auto"
              valueLabelFormat={formatValue}
              disabled={false}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RangeFieldEdit;
