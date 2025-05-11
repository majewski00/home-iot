import React, { useState, useEffect } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface TimeSelectFieldViewProps {
  value: number | null;
  onChange: (value: number | null) => void;
  fieldType: FieldType;
  disabled?: boolean;
}

/**
 * TimeSelectFieldView component
 * Renders a slider for selecting time within the last 24 hours
 */
const TimeSelectFieldView: React.FC<TimeSelectFieldViewProps> = ({
  value,
  onChange,
  fieldType,
  disabled = false,
}) => {
  // Convert minutes to hours and minutes for display
  const formatTimeDisplay = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // Format as "X hours Y minutes ago" or "Just now" if 0
    if (minutes === 0) {
      return "Just now";
    } else if (hours === 0) {
      return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
    } else if (mins === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      return `${hours} hour${hours !== 1 ? "s" : ""} ${mins} minute${
        mins !== 1 ? "s" : ""
      } ago`;
    }
  };

  // Get max time from dataOptions or default to 24 hours (1440 minutes)
  const maxTime =
    fieldType.dataOptions?.maxTime !== undefined
      ? Number(fieldType.dataOptions.maxTime)
      : 1440; // 24 hours in minutes

  // Get step from dataOptions or default to 15 minutes
  const step =
    fieldType.dataOptions?.step !== undefined
      ? Number(fieldType.dataOptions.step)
      : 15; // 15 minutes

  // Local state for slider value
  const [localValue, setLocalValue] = useState<number>(
    value !== null ? value : 0
  );

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value !== null ? value : 0);
  }, [value]);

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

  // Custom marks for the slider
  const marks = [
    { value: 0, label: "Now" },
    { value: maxTime / 4, label: `${Math.floor(maxTime / 240)}h` },
    { value: maxTime / 2, label: `${Math.floor(maxTime / 120)}h` },
    { value: (maxTime / 4) * 3, label: `${Math.floor(maxTime / 80)}h` },
    { value: maxTime, label: `${Math.floor(maxTime / 60)}h` },
  ];

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
          min={0}
          max={maxTime}
          step={step}
          marks={marks}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => formatTimeDisplay(value)}
          disabled={disabled}
        />

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 1 }}
        >
          {formatTimeDisplay(localValue)}
        </Typography>
      </Box>
    </Box>
  );
};

export default TimeSelectFieldView;
