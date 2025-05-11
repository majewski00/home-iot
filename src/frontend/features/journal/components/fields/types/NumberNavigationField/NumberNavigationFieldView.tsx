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
 * Renders a number input with increment/decrement buttons
 * Format: [-] [Number] [+]
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
    <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
      {fieldType.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {fieldType.description}
        </Typography>
      )}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <IconButton
          onClick={handleDecrement}
          disabled={disabled || (value !== null && value <= minValue)}
          size="small"
          sx={{
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
          }}
          sx={{
            mx: 1,
            width: "80px",
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
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

        {unitLabel && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {unitLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default NumberNavigationFieldView;
