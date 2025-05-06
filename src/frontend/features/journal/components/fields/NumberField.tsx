import React, { useState, useEffect } from "react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";

interface NumberFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  dataType?: string;
  disabled?: boolean;
}

/**
 * NumberField component for entering numeric values with increment/decrement buttons
 * Format: [-] [Number] [+]
 */
const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  label,
  dataType,
  disabled = false,
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || "");

  useEffect(() => {
    setLocalValue(value?.toString() || "");
  }, [value]);

  const handleIncrement = () => {
    const currentValue = Number(localValue) || 0;
    const newValue = currentValue + 1;
    setLocalValue(newValue.toString());
    onChange(newValue);
  };

  const handleDecrement = () => {
    const currentValue = Number(localValue) || 0;
    const newValue = Math.max(0, currentValue - 1); // Prevent negative values
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
        setLocalValue(numValue.toString());
        onChange(numValue);
      } else {
        // Reset to previous valid value
        setLocalValue(value?.toString() || "");
      }
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <IconButton
          onClick={handleDecrement}
          disabled={disabled || (value !== null && value <= 0)}
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
            min: 0,
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
          disabled={disabled}
          size="small"
          sx={{
            bgcolor: "action.hover",
            borderRadius: 1,
            "&:hover": { bgcolor: "action.selected" },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>

        {dataType && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {dataType}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default NumberField;
