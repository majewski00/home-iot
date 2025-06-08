import React, { useState, useEffect, useMemo } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface CustomScaleFieldViewProps {
  value: number | null; // Represents the actual value (1 for first label, 2 for second, etc.)
  onChange: (value: number | null) => void;
  fieldType: FieldType;
  disabled?: boolean;
}

/**
 * CustomScaleFieldView component
 * Renders a slider for selecting custom scale levels with user-defined labels
 * Defaults to first label visually but is "unset" (--) until user interaction if initial value is null.
 */
const CustomScaleFieldView: React.FC<CustomScaleFieldViewProps> = ({
  value: propValue,
  onChange,
  fieldType,
  disabled = false,
}) => {
  const customLabels = useMemo(() => {
    const labels = fieldType.dataOptions?.labels as string[] | undefined;
    return labels && labels.length > 0 ? labels : ["Default"];
  }, [fieldType.dataOptions?.labels]);

  const scaleLevels = useMemo(
    () =>
      customLabels.map((label, index) => ({
        value: index + 1,
        label: label.trim() || `Option ${index + 1}`,
      })),
    [customLabels]
  );

  const defaultSliderPosition = useMemo(
    () => scaleLevels[0].value,
    [scaleLevels]
  );

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
      return defaultSliderPosition; // Visually at first option but logically "--"
    }
    return currentCommittedValue ?? defaultSliderPosition;
  }, [isEffectivelyUnset, currentCommittedValue, defaultSliderPosition]);

  // displayLabelText is the text shown below the slider.
  const displayLabelText = useMemo(() => {
    if (isEffectivelyUnset) {
      return "--";
    }
    const level = scaleLevels.find(
      (l) => l.value === (currentCommittedValue ?? defaultSliderPosition)
    );
    return level ? level.label : "--";
  }, [
    isEffectivelyUnset,
    currentCommittedValue,
    scaleLevels,
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
    setCurrentCommittedValue(numValue);
    onChange(numValue);
  };

  const marks = useMemo(
    () =>
      scaleLevels.map((level) => ({
        value: level.value,
        label: level.label,
      })),
    [scaleLevels]
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
            mb: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {fieldType.description}
          </Typography>
          <Typography
            variant="body1"
            color={isEffectivelyUnset ? "text.disabled" : "text.primary"}
            sx={{ fontWeight: "medium" }}
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
          py: 1,
          width: "90%",
        }}
      >
        <Slider
          value={sliderVisualValue}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={scaleLevels[0].value}
          max={scaleLevels[scaleLevels.length - 1].value}
          step={1}
          marks={marks}
          disabled={disabled}
          sx={{
            flexGrow: 1,
            "& .MuiSlider-thumb": {
              backgroundColor: isEffectivelyUnset ? "grey.500" : "primary.main",
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default CustomScaleFieldView;
