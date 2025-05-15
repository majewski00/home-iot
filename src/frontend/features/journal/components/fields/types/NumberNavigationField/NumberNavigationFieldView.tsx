import React, { useState, useEffect } from "react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { FieldType } from "@src-types/journal/journal.types";

export interface NumberNavigationFieldViewProps {
  value: number | null;
  onChange: (value: number | null) => void;
  fieldType: FieldType;
  disabled?: boolean;
}

/**
 * NumberNavigationFieldView component
 * Renders a number input with increment/decrement buttons inline with description.
 * Format: [Description] [-] [Number] [+] [Unit]
 */
const NumberNavigationFieldView: React.FC<NumberNavigationFieldViewProps> = ({
  value,
  onChange,
  fieldType,
  disabled = false,
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || "");

  // Get min/max values from dataOptions if available
  const minValue =
    fieldType.dataOptions?.min !== undefined
      ? Number(fieldType.dataOptions.min)
      : 0;

  const maxValue =
    fieldType.dataOptions?.max !== undefined
      ? Number(fieldType.dataOptions.max)
      : Number.MAX_SAFE_INTEGER;

  // Get unit label from dataOptions if available
  const unitLabel = fieldType.dataOptions?.unit as string | undefined;

  useEffect(() => {
    setLocalValue(value?.toString() || "");
  }, [value]);

  const handleIncrement = () => {
    const currentValue = Number(localValue) || 0;
    const newValue = Math.min(maxValue, currentValue + 1);
    setLocalValue(newValue.toString());
    onChange(newValue);
  };

  const handleDecrement = () => {
    const currentValue = Number(localValue) || 0;
    const newValue = Math.max(minValue, currentValue - 1);
    setLocalValue(newValue.toString());
    onChange(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Only update parent if it's a valid number
    if (newValue === "") {
      onChange(null);
    } else {
      const numValue = Number(newValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

  const handleBlur = () => {
    // Clean up the input on blur
    if (localValue === "") {
      onChange(null);
    } else {
      const numValue = Number(localValue);
      if (!isNaN(numValue)) {
        // Ensure value is within min/max range
        const boundedValue = Math.max(minValue, Math.min(maxValue, numValue));
        setLocalValue(boundedValue.toString());
        onChange(boundedValue);
      } else {
        // Reset to previous valid value
        setLocalValue(value?.toString() || "");
      }
    }
  };

  return (
    // Main container: flex row, align items center
    <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
      {fieldType.description && (
        <Typography variant="body1" color="text.primary" sx={{ flexShrink: 0 }}>
          {fieldType.description}
        </Typography>
      )}
      {/* Input group: flex row, align items center */}
      <Box
        sx={{
          ml: 2,
          display: "flex",
          alignItems: "center",
          flexGrow: 1, // Take up remaining space
          justifyContent: "center", // Center the content horizontally
        }}
      >
        {/* This inner Box contains the elements to be centered */}
        {/* We might not strictly need it if IconButton/TextField/IconButton are direct children */}
        {/* but keeping it for clarity for now */}
        {/* <Box sx={{ display: 'flex', alignItems: 'center' }}> */}
        <IconButton
          onClick={handleDecrement}
          disabled={disabled || (value !== null && value <= minValue)}
          size="small"
          sx={{
            // ml: 2,
            bgcolor: "action.hover",
            borderRadius: 1,
            "&:hover": { bgcolor: "action.selected" },
          }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>

        <TextField
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          variant="outlined"
          size="small"
          type="number"
          inputProps={{
            min: minValue,
            max: maxValue,
            style: { textAlign: "center" },
            // Hide spin buttons for number input
            step: "any", // Allows any number, often helps with hiding spinners
          }}
          sx={{
            mx: 1,
            width: "80px",
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
            },
            // Hide spin buttons (Webkit browsers like Chrome, Safari)
            "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
              {
                "-webkit-appearance": "none",
                margin: 0,
              },
            // Hide spin buttons (Firefox)
            "& input[type=number]": {
              "-moz-appearance": "textfield",
            },
          }}
        />

        <IconButton
          onClick={handleIncrement}
          disabled={disabled || (value !== null && value >= maxValue)}
          size="small"
          sx={{
            bgcolor: "action.hover",
            borderRadius: 1,
            "&:hover": { bgcolor: "action.selected" },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
        {/* </Box> */}
        {/* Unit Label Container (Fixed Width on the Right) */}
        <Box sx={{ width: "100px", textAlign: "left", flexShrink: 0 }}>
          {unitLabel && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                ml: 1,
                minWidth: "30px",
                textAlign: "left" /* Ensure space for unit */,
              }}
            >
              {unitLabel}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default NumberNavigationFieldView;
