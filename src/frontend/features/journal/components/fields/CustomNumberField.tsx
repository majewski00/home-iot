import React, { useState } from "react";
import { Box, Typography, TextField, InputAdornment } from "@mui/material";

interface CustomNumberFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  dataType?: string;
}

/**
 * Custom number field without increment/decrement buttons
 */
const CustomNumberField: React.FC<CustomNumberFieldProps> = ({
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
          endAdornment: dataType && (
            <InputAdornment position="end">
              <Typography variant="caption">{dataType}</Typography>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default CustomNumberField;
