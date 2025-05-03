import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";

interface NumberFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  dataType?: string;
}

/**
 * Number field with increment/decrement buttons
 */
const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  label,
  dataType,
}) => {
  const [inputValue, setInputValue] = useState<string>(
    value !== null ? value.toString() : ""
  );

  // Update local state when prop value changes
  React.useEffect(() => {
    setInputValue(value !== null ? value.toString() : "");
  }, [value]);

  // Handle increment
  const handleIncrement = () => {
    const currentValue = value !== null ? value : 0;
    onChange(currentValue + 1);
  };

  // Handle decrement
  const handleDecrement = () => {
    const currentValue = value !== null ? value : 0;
    if (currentValue > 0) {
      onChange(currentValue - 1);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Convert to number if valid
    if (newValue === "") {
      onChange(null);
    } else {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

  // Handle blur (validate input)
  const handleBlur = () => {
    if (inputValue === "") {
      onChange(null);
    } else {
      const numValue = parseFloat(inputValue);
      if (isNaN(numValue)) {
        setInputValue(value !== null ? value.toString() : "");
      } else {
        setInputValue(numValue.toString());
        onChange(numValue);
      }
    }
  };

  return (
    <Box sx={{ my: 1 }}>
      <TextField
        fullWidth
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        type="number"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                size="small"
                onClick={handleDecrement}
                disabled={value === null || value <= 0}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box display="flex" alignItems="center">
                {dataType && (
                  <Typography variant="caption" sx={{ mr: 1 }}>
                    {dataType}
                  </Typography>
                )}
                <IconButton size="small" onClick={handleIncrement}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default NumberField;
