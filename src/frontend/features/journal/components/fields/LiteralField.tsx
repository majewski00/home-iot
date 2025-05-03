import React, { useState, useEffect } from "react";
import { Box, Typography, Slider, FormControl } from "@mui/material";

interface LiteralFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
}

// Literal field options
const LITERAL_OPTIONS = ["Low", "Moderate", "High", "Very High"];

/**
 * Literal field with a slider for selecting predefined options
 */
const LiteralField: React.FC<LiteralFieldProps> = ({
  value,
  onChange,
  label,
}) => {
  // Convert value to slider value
  const getSliderValue = (val: string | null): number => {
    if (!val) return 0;
    const index = LITERAL_OPTIONS.indexOf(val);
    return index >= 0 ? index : 0;
  };

  // Convert slider value to option
  const getOptionFromSlider = (sliderValue: number): string => {
    return LITERAL_OPTIONS[sliderValue];
  };

  // State for slider value
  const [sliderValue, setSliderValue] = useState<number>(getSliderValue(value));

  // Update slider when value changes
  useEffect(() => {
    setSliderValue(getSliderValue(value));
  }, [value]);

  // Handle slider change
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const numValue = newValue as number;
    setSliderValue(numValue);
  };

  // Handle slider change commit
  const handleSliderChangeCommitted = (
    event: React.SyntheticEvent | Event,
    newValue: number | number[]
  ) => {
    const numValue = newValue as number;
    const option = getOptionFromSlider(numValue);
    onChange(option);
  };

  // Get marks for the slider
  const getMarks = () => {
    return LITERAL_OPTIONS.map((option, index) => ({
      value: index,
      label: option,
    }));
  };

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="body2" gutterBottom>
        {label}
      </Typography>

      <Box sx={{ px: 2, mt: 2 }}>
        <Slider
          value={sliderValue}
          min={0}
          max={LITERAL_OPTIONS.length - 1}
          step={1}
          marks={getMarks()}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderChangeCommitted}
          valueLabelDisplay="auto"
          valueLabelFormat={(val) => LITERAL_OPTIONS[val]}
        />
      </Box>

      <Box sx={{ mt: 1, textAlign: "center" }}>
        <Typography variant="body2" color="primary" fontWeight="bold">
          {value || "Not selected"}
        </Typography>
      </Box>
    </Box>
  );
};

export default LiteralField;
