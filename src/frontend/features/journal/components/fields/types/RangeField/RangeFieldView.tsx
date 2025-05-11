import React, { useState, useEffect } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface RangeFieldViewProps {
  value: number | null;
  onChange: (value: number | null) => void;
  fieldType: FieldType;
  disabled?: boolean;
}

/**
 * RangeFieldView component
 * Renders a slider for selecting a value within a defined range
 */
const RangeFieldView: React.FC<RangeFieldViewProps> = ({
  value,
  onChange,
  fieldType,
  disabled = false,
}) => {
  // Get min/max/step values from dataOptions or set defaults
  const minValue =
    fieldType.dataOptions?.min !== undefined
      ? Number(fieldType.dataOptions.min)
      : 0;

  const maxValue =
    fieldType.dataOptions?.max !== undefined
      ? Number(fieldType.dataOptions.max)
      : 100;

  const step =
    fieldType.dataOptions?.step !== undefined
      ? Number(fieldType.dataOptions.step)
      : 1;

  // Get unit label from dataOptions if available
  const unitLabel = fieldType.dataOptions?.unit as string | undefined;

  // Get format function from dataOptions if available
  const formatValue = (val: number): string => {
    if (unitLabel) {
      return `${val} ${unitLabel}`;
    }
    return val.toString();
  };

  // Local state for slider value
  const [localValue, setLocalValue] = useState<number>(
    value !== null ? value : minValue
  );

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value !== null ? value : minValue);
  }, [value, minValue]);

  // Handle slider change
  const handleChange = (_event: Event, newValue: number | number[]) => {
    const numValue = newValue as number;
    setLocalValue(numValue);
  };

  // Handle slider change commit (when user releases slider)
  const handleChangeCommitted = (
    _event: React.SyntheticEvent | Event,
    newValue: number | number[]
  ) => {
    const numValue = newValue as number;
    onChange(numValue);
  };

  // Calculate marks for the slider
  const calculateMarks = () => {
    const range = maxValue - minValue;
    const markCount = Math.min(5, range + 1); // Max 5 marks

    if (markCount <= 1)
      return [{ value: minValue, label: formatValue(minValue) }];

    const marks = [];
    const step = range / (markCount - 1);

    for (let i = 0; i < markCount; i++) {
      const value = minValue + i * step;
      marks.push({
        value,
        label: formatValue(Math.round(value)),
      });
    }

    return marks;
  };

  const marks = calculateMarks();

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", mb: 2, width: "100%" }}
    >
      {fieldType.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {fieldType.description}
        </Typography>
      )}

      <Box sx={{ px: 1, py: 2, width: "100%" }}>
        <Slider
          value={localValue}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={minValue}
          max={maxValue}
          step={step}
          marks={marks}
          valueLabelDisplay="auto"
          valueLabelFormat={formatValue}
          disabled={disabled}
        />

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 1 }}
        >
          {formatValue(localValue)}
        </Typography>
      </Box>
    </Box>
  );
};

export default RangeFieldView;
