import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent, // Import SelectChangeEvent
} from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

// Define unit options
const unitOptions = [
  "Times",
  "Servings",
  "mg",
  "g",
  "ml",
  "L",
  "Minutes",
  "Hours",
  "kcal",
  "Steps",
];

export interface NumberFieldEditProps {
  // Renamed from NumberNavigationFieldEditProps
  fieldType: FieldType;
  onUpdate?: (updates: Partial<FieldType>) => void;
}

/**
 * NumberFieldEdit component // Renamed from NumberNavigationFieldEdit
 * Allows configuration of a NumberField
 */
const NumberFieldEdit: React.FC<NumberFieldEditProps> = ({
  // Renamed from NumberNavigationFieldEdit
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
    const newMinValue = Number(e.target.value);
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

  // Handle unit label change for Select component
  const handleUnitLabelChange = (event: SelectChangeEvent<string>) => {
    const newUnitLabel = event.target.value;
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
        p: 2, // Keep padding for inner content spacing
        // border: "1px solid", // Remove border
        // borderColor: "divider", // Remove border color
        // borderRadius: 1, // Remove border radius
        mb: 2, // Keep margin bottom
      }}
    >
      {/* <Typography variant="subtitle2" gutterBottom> // Remove Title
        Number Field Settings
      </Typography> */}

      {/* Row 1: Description & Min Value */}
      <Box
        display="flex"
        sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2 }}
      >
        <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={handleDescriptionChange}
            size="small"
            placeholder="e.g., How many times?"
            // Removed margin="normal" as gap handles spacing
          />
        </Box>
        <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
          {/* Unit Label Select */}
          <FormControl fullWidth size="small">
            {" "}
            {/* Removed margin="normal" */}
            <InputLabel id="unit-label-select-label">
              Unit Label (optional)
            </InputLabel>
            <Select
              labelId="unit-label-select-label"
              id="unit-label-select"
              value={unitLabel}
              label="Unit Label (optional)"
              onChange={handleUnitLabelChange}
            >
              <MenuItem value="">
                <em>--</em>
              </MenuItem>
              {unitOptions.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Row 2: Max Value & Unit Label */}
      <Box
        display="flex"
        sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 2 }}
      >
        <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
          <TextField
            fullWidth
            label="Minimum Value"
            type="number"
            value={minValue}
            onChange={handleMinValueChange}
            size="small"
            // Removed margin="normal"
          />
        </Box>
        <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
          <TextField
            fullWidth
            label="Maximum Value (optional)"
            type="number"
            value={maxValue === undefined ? "" : maxValue}
            onChange={handleMaxValueChange}
            size="small"
            placeholder="No limit"
            // Removed margin="normal"
          />
        </Box>
      </Box>

      {/* Static Placeholder Preview */}
      <Box
        sx={{
          mt: 3,
          p: 1,
          // Removed border and opacity
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 1, textAlign: "center" }} // Center align the text
        >
          Preview:
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TextField
            disabled
            size="small"
            value="0" // Placeholder value
            inputProps={{ style: { textAlign: "center" } }}
            sx={{
              mx: 1,
              width: "80px", // Match width from View component
              "& .MuiInputBase-input.Mui-disabled": {
                "-webkit-text-fill-color": "rgba(0, 0, 0, 0.6)", // Ensure text color in disabled state
              },
              "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "rgba(0, 0, 0, 0.26)", // Match disabled border color
                },
            }}
          />
          {unitLabel && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1, minWidth: "30px" }}
            >
              {unitLabel}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NumberFieldEdit; // Renamed from NumberNavigationFieldEdit
