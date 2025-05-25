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
  const [defaultValue, setDefaultValue] = useState<number | undefined>(
    fieldType.dataOptions?.defaultValue !== undefined
      ? Number(fieldType.dataOptions.defaultValue)
      : undefined
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

  // Handle default value change
  const handleDefaultValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newDefaultValue = value === "" ? undefined : Number(value);
    setDefaultValue(newDefaultValue);
    if (onUpdate) {
      onUpdate({
        dataOptions: {
          ...fieldType.dataOptions,
          defaultValue: newDefaultValue,
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

      {/* Row 2: Min Value, Max Value & Default Value */}
      <Box
        display="flex"
        sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 2 }}
      >
        <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 11px)" } }}>
          <TextField
            fullWidth
            label="Minimum Value"
            type="number"
            value={minValue}
            onChange={handleMinValueChange}
            size="small"
          />
        </Box>
        <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 11px)" } }}>
          <TextField
            fullWidth
            label="Maximum Value (optional)"
            type="number"
            value={maxValue === undefined ? "" : maxValue}
            onChange={handleMaxValueChange}
            size="small"
            placeholder="No limit"
          />
        </Box>
        <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 11px)" } }}>
          <TextField
            fullWidth
            label="Default Value (optional)"
            type="number"
            value={defaultValue === undefined ? "" : defaultValue}
            onChange={handleDefaultValueChange}
            size="small"
            placeholder="No default"
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
            value={defaultValue !== undefined ? defaultValue.toString() : "0"}
            inputProps={{ style: { textAlign: "center" } }}
            sx={{
              mx: 1,
              width: "80px",
              "& .MuiInputBase-input.Mui-disabled": {
                "-webkit-text-fill-color": "rgba(0, 0, 0, 0.6)",
              },
              "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "rgba(0, 0, 0, 0.26)",
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
