import React, { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface NumberFieldViewProps {
  value: number | null;
  onChange: (value: number | null) => void;
  fieldType: FieldType;
  disabled?: boolean;
}

/**
 * NumberFieldView component
 * Renders a simple number input field
 */
const NumberFieldView: React.FC<NumberFieldViewProps> = ({
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
      : undefined;

  const maxValue =
    fieldType.dataOptions?.max !== undefined
      ? Number(fieldType.dataOptions.max)
      : undefined;

  // Get unit label from dataOptions if available
  const unitLabel = fieldType.dataOptions?.unit as string | undefined;

  useEffect(() => {
    setLocalValue(value?.toString() || "");
  }, [value]);

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
        // Ensure value is within min/max range if defined
        let boundedValue = numValue;
        if (minValue !== undefined) {
          boundedValue = Math.max(minValue, boundedValue);
        }
        if (maxValue !== undefined) {
          boundedValue = Math.min(maxValue, boundedValue);
        }

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
          }}
          sx={{
            width: "120px",
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
            },
          }}
        />

        {unitLabel && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {unitLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default NumberFieldView;
