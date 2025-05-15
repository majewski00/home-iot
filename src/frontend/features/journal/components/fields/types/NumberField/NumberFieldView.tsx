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
 * Renders a simple number input field.
 * Adapted from NumberNavigationFieldView, removing navigation buttons.
 */
const NumberFieldView: React.FC<NumberFieldViewProps> = ({
  value,
  onChange,
  fieldType,
  disabled = false,
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || "");

  const minValue =
    fieldType.dataOptions?.min !== undefined
      ? Number(fieldType.dataOptions.min)
      : undefined;

  const maxValue =
    fieldType.dataOptions?.max !== undefined
      ? Number(fieldType.dataOptions.max)
      : undefined;

  const unitLabel = fieldType.dataOptions?.unit as string | undefined;

  useEffect(() => {
    setLocalValue(value?.toString() || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

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
    if (localValue === "") {
      onChange(null);
    } else {
      const numValue = Number(localValue);
      if (!isNaN(numValue)) {
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
        setLocalValue(value?.toString() || "");
      }
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
      {fieldType.description && (
        <Typography variant="body1" color="text.primary" sx={{ flexShrink: 0 }}>
          {fieldType.description}
        </Typography>
      )}
      <Box
        sx={{
          ml: 2,
          display: "flex",
          alignItems: "center",
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
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
            step: "any",
          }}
          sx={{
            mx: 1,
            width: "80px",
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
            },
            "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
              {
                display: "none",
                "-webkit-appearance": "none",
                margin: 0,
              },
            "& input[type=number]": {
              "-moz-appearance": "textfield",
            },
          }}
        />
        <Box sx={{ width: "100px", textAlign: "left", flexShrink: 0 }}>
          {unitLabel && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                ml: 1,
                minWidth: "30px",
                textAlign: "left",
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

export default NumberFieldView;
