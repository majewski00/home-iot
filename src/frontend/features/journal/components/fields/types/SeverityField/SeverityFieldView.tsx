import React, { useState, useEffect, useMemo } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface SeverityFieldViewProps {
  value: number | null; // Represents the actual value (1 for Low, 2 for Moderate, etc.)
  onChange: (value: number | null) => void;
  fieldType: FieldType;
  disabled?: boolean;
}

/**
 * SeverityFieldView component
 * Renders a slider for selecting severity levels (Low, Moderate, High, Very High)
 * Defaults to "Low" visually but is "unset" (--) until user interaction if initial value is null.
 */
const SeverityFieldView: React.FC<SeverityFieldViewProps> = ({
  value: propValue,
  onChange,
  fieldType,
  disabled = false,
}) => {
  const severityLevels = useMemo(
    () => [
      { value: 1, label: "Low" },
      { value: 2, label: "Moderate" },
      { value: 3, label: "High" },
      { value: 4, label: "Very High" },
    ],
    []
  );

  const defaultSliderPosition = useMemo(
    () => severityLevels[0].value,
    [severityLevels]
  ); // Default to "Low"

  // currentCommittedValue holds the value that has been or would be sent via onChange.
  const [currentCommittedValue, setCurrentCommittedValue] = useState<
    number | null
  >(propValue);

  // userHasInteracted tracks if the slider has been touched.
  const [userHasInteracted, setUserHasInteracted] = useState<boolean>(
    propValue !== null
  );

  useEffect(() => {
    setCurrentCommittedValue(propValue);
    setUserHasInteracted(propValue !== null);
  }, [propValue]);

  // isEffectivelyUnset determines the visual "unset" state.
  const isEffectivelyUnset = useMemo(() => {
    return propValue === null && !userHasInteracted;
  }, [propValue, userHasInteracted]);

  // sliderVisualValue is what the slider thumb is actually set to.
  const sliderVisualValue = useMemo(() => {
    if (isEffectivelyUnset) {
      return defaultSliderPosition; // Visually at "Low" but logically "--"
    }
    return currentCommittedValue ?? defaultSliderPosition;
  }, [isEffectivelyUnset, currentCommittedValue, defaultSliderPosition]);

  // displayLabelText is the text shown below the slider.
  const displayLabelText = useMemo(() => {
    if (isEffectivelyUnset) {
      return "--";
    }
    const level = severityLevels.find(
      (l) => l.value === (currentCommittedValue ?? defaultSliderPosition)
    );
    return level ? level.label : "--";
  }, [
    isEffectivelyUnset,
    currentCommittedValue,
    severityLevels,
    defaultSliderPosition,
  ]);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    const numValue = newValue as number;
    if (!userHasInteracted) {
      setUserHasInteracted(true);
    }
    // Update currentCommittedValue so the label below slider updates live during drag.
    setCurrentCommittedValue(numValue);
  };

  const handleChangeCommitted = (
    _event: React.SyntheticEvent | Event,
    newValue: number | number[]
  ) => {
    const numValue = newValue as number;
    if (!userHasInteracted) {
      setUserHasInteracted(true);
    }
    setCurrentCommittedValue(numValue); // Ensure it's set.
    onChange(numValue); // Report the actual selected value
  };

  const marks = useMemo(
    () =>
      severityLevels.map((level) => ({
        value: level.value,
        label: level.label,
      })),
    [severityLevels]
  );

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", mb: 2, width: "100%" }}
    >
      {fieldType.description && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.5, // Consistent with TimeSelectFieldView
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {fieldType.description}
          </Typography>
          <Typography
            variant="body1" // Or body2 if preferred, TimeSelect uses body1 for value
            color={isEffectivelyUnset ? "text.disabled" : "text.primary"}
            sx={{ fontWeight: "medium" }} // Consistent with original label style
          >
            {displayLabelText}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 1, // Added py for vertical padding around slider
          width: "90%",
        }}
      >
        <Slider
          value={sliderVisualValue}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={severityLevels[0].value}
          max={severityLevels[severityLevels.length - 1].value}
          step={1}
          marks={marks}
          disabled={disabled}
          sx={{
            flexGrow: 1, // Slider takes available space in its 90% parent
            "& .MuiSlider-thumb": {
              backgroundColor: isEffectivelyUnset ? "grey.500" : "primary.main",
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default SeverityFieldView;
