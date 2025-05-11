import React, { useState, useEffect } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface SeverityFieldViewProps {
  value: number | null;
  onChange: (value: number | null) => void;
  fieldType: FieldType;
  disabled?: boolean;
}

/**
 * SeverityFieldView component
 * Renders a slider for selecting severity levels (Low, Moderate, High, Very High)
 */
const SeverityFieldView: React.FC<SeverityFieldViewProps> = ({
  value,
  onChange,
  fieldType,
  disabled = false,
}) => {
  // Default severity levels
  const severityLevels = [
    { value: 0, label: "None", color: "#9e9e9e" },
    { value: 1, label: "Low", color: "#4caf50" },
    { value: 2, label: "Moderate", color: "#ff9800" },
    { value: 3, label: "High", color: "#f44336" },
    { value: 4, label: "Very High", color: "#9c27b0" },
  ];

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
    onChange(numValue);
  };

  // Get current severity level
  const currentSeverity = severityLevels[localValue] || severityLevels[0];

  // Custom marks for the slider
  const marks = severityLevels.map((level) => ({
    value: level.value,
    label: level.label,
  }));

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
          min={0}
          max={severityLevels.length - 1}
          step={1}
          marks={marks}
          disabled={disabled}
          sx={{
            "& .MuiSlider-thumb": {
              backgroundColor: currentSeverity.color,
            },
            "& .MuiSlider-track": {
              backgroundColor: currentSeverity.color,
            },
            "& .MuiSlider-rail": {
              opacity: 0.5,
              backgroundColor: "#bfbfbf",
            },
            "& .MuiSlider-mark": {
              backgroundColor: "#bfbfbf",
              height: 8,
              width: 1,
              marginTop: -3,
            },
            "& .MuiSlider-markActive": {
              opacity: 1,
              backgroundColor: "currentColor",
            },
          }}
        />

        <Typography
          variant="body1"
          align="center"
          sx={{
            mt: 1,
            fontWeight: "medium",
            color: currentSeverity.color,
          }}
        >
          {currentSeverity.label}
        </Typography>
      </Box>
    </Box>
  );
};

export default SeverityFieldView;
