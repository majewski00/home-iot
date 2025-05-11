import React, { useState } from "react";
import { Box, TextField, Typography, Grid } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface NumberFieldEditProps {
  fieldType: FieldType;
  onUpdate?: (updates: Partial<FieldType>) => void;
}

/**
 * NumberFieldEdit component
 * Allows configuration of a NumberField
 */
const NumberFieldEdit: React.FC<NumberFieldEditProps> = ({
  fieldType,
  onUpdate,
}) => {
  // Get current values from dataOptions or set defaults
  const [description, setDescription] = useState<string>(
    fieldType.description || ""
  );
  const [minValue, setMinValue] = useState<number | undefined>(
    fieldType.dataOptions?.min !== undefined
      ? Number(fieldType.dataOptions.min)
      : undefined
  );
  const [maxValue, setMaxValue] = useState<number | undefined>(
    fieldType.dataOptions?.max !== undefined
      ? Number(fieldType.dataOptions.max)
      : undefined
  );
  const [unitLabel, setUnitLabel] = useState<string>(
    (fieldType.dataOptions?.unit as string) || ""
  );

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
    const value = e.target.value;
    const newMinValue = value === "" ? undefined : Number(value);
    setMinValue(newMinValue);
    if (onUpdate) {
      onUpdate({
        dataOptions: {
          ...fieldType.dataOptions,
          min: newMinValue,
        },
      });
    }
  };

  // Handle max value change
  const handleMaxValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newMaxValue = value === "" ? undefined : Number(value);
    setMaxValue(newMaxValue);
    if (onUpdate) {
      onUpdate({
        dataOptions: {
          ...fieldType.dataOptions,
          max: newMaxValue,
        },
      });
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
        Number Field Settings
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
            placeholder="e.g., Enter a value"
          />
        </Grid>

        <Grid sx={{ gap: 6 }}>
          <TextField
            fullWidth
            label="Minimum Value (optional)"
            type="number"
            value={minValue === undefined ? "" : minValue}
            onChange={handleMinValueChange}
            margin="normal"
            size="small"
            placeholder="No minimum"
          />
        </Grid>

        <Grid sx={{ gap: 6 }}>
          <TextField
            fullWidth
            label="Maximum Value (optional)"
            type="number"
            value={maxValue === undefined ? "" : maxValue}
            onChange={handleMaxValueChange}
            margin="normal"
            size="small"
            placeholder="No maximum"
          />
        </Grid>

        <Grid sx={{ gap: 12 }}>
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
      </Grid>
    </Box>
  );
};

export default NumberFieldEdit;
