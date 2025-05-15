import React, { useState, useEffect, useMemo } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface TimeSelectFieldViewProps {
  value: number | null; // Represents minutes from midnight of selectedDate (0-1439)
  onChange: (value: number | null) => void; // Reports minutes from midnight (0-1439)
  fieldType: FieldType;
  selectedDate: string; // YYYY-MM-DD format
  disabled?: boolean;
}

/**
 * TimeSelectFieldView component
 * Renders a slider for selecting time.
 * - For today: Slider range is 00:00 to current time.
 * - For other dates: Slider range is 00:00 to 23:59.
 */
const TimeSelectFieldView: React.FC<TimeSelectFieldViewProps> = ({
  value: propValue,
  onChange,
  fieldType,
  selectedDate,
  disabled = false,
}) => {
  const formatHHMM = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const stepValue = useMemo(
    () =>
      fieldType.dataOptions?.step !== undefined
        ? Number(fieldType.dataOptions.step)
        : 30,
    [fieldType.dataOptions?.step]
  );

  const isToday = useMemo(
    () => selectedDate === new Date().toISOString().split("T")[0],
    [selectedDate]
  );

  const sliderMaxVal = useMemo(() => {
    if (isToday) {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      // Ensure the max is at least one step, and does not exceed 1439
      return Math.min(
        1439,
        Math.floor(currentTotalMinutes / stepValue) * stepValue
      );
    }
    return 1439; // Full day: 00:00 (0) to 23:59 (1439)
  }, [isToday, stepValue, selectedDate]);

  const formatTimeValueInternal = useMemo(
    () =>
      (minutes: number | null): string => {
        if (minutes === null) return "--";
        // Handle 24:00 display for the mark/tooltip at the very end of a non-today day
        if (minutes === 1440) return "24:00";

        const displayMinutes = Math.max(0, Math.min(minutes, 1439)); // Clamp to 0-23:59 range

        const [year, month, day] = selectedDate.split("-").map(Number);
        const targetDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        targetDate.setMinutes(displayMinutes);

        return formatHHMM(targetDate);
      },
    [selectedDate]
  );

  const step = stepValue;

  // Stores the current "minutes from midnight of selectedDate" value.
  const [currentMinutesFromMidnight, setCurrentMinutesFromMidnight] = useState<
    number | null
  >(propValue);
  // Tracks if the user has interacted with the slider since the last prop update or initial mount.
  const [userHasInteracted, setUserHasInteracted] = useState<boolean>(
    propValue !== null
  );

  useEffect(() => {
    setCurrentMinutesFromMidnight(propValue);
    setUserHasInteracted(propValue !== null);
  }, [propValue]);

  // Slider's actual display position, capped by its current maximum.
  const sliderDisplayPosition = useMemo(() => {
    if (currentMinutesFromMidnight === null) {
      return 0; // Default to 00:00
    }
    return Math.min(currentMinutesFromMidnight, sliderMaxVal);
  }, [currentMinutesFromMidnight, sliderMaxVal]);

  // Condition for "unset" visual state (grey dot, "--" text).
  // True if the initial prop was null AND the user hasn't interacted yet.
  const isEffectivelyUnset = useMemo(
    () => propValue === null && !userHasInteracted,
    [propValue, userHasInteracted]
  );

  const displayTimeText = useMemo(() => {
    if (isEffectivelyUnset) {
      return "--";
    }
    // DisplayTimeText always shows the true stored value, not the slider-capped one.
    return formatTimeValueInternal(currentMinutesFromMidnight);
  }, [isEffectivelyUnset, currentMinutesFromMidnight, formatTimeValueInternal]);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    const sliderRawValue = newValue as number; // This is minutesFromMidnight
    if (!userHasInteracted) {
      setUserHasInteracted(true);
    }
    setCurrentMinutesFromMidnight(sliderRawValue);
  };

  const handleChangeCommitted = (
    _event: React.SyntheticEvent | Event,
    newValue: number | number[]
  ) => {
    const sliderRawValue = newValue as number; // This is minutesFromMidnight
    if (!userHasInteracted) {
      setUserHasInteracted(true);
    }
    setCurrentMinutesFromMidnight(sliderRawValue);
    onChange(sliderRawValue); // Report minutesFromMidnight
  };

  const marks = useMemo(() => {
    const resultMarks: { value: number; label: string }[] = [];
    if (isToday) {
      const todayMarkValues = [
        0,
        Math.round(sliderMaxVal / 4 / step) * step,
        Math.round(sliderMaxVal / 2 / step) * step,
        Math.round((sliderMaxVal * 3) / 4 / step) * step,
        sliderMaxVal,
      ];
      todayMarkValues
        .map((mVal) =>
          Math.min(sliderMaxVal, Math.max(0, Math.round(mVal / step) * step))
        )
        .filter(
          (val, idx, self) => val <= sliderMaxVal && self.indexOf(val) === idx
        )
        .sort((a, b) => a - b)
        .forEach((val) => {
          resultMarks.push({
            value: val,
            label: val === sliderMaxVal ? "Now" : formatTimeValueInternal(val),
          });
        });
    } else {
      // Not today
      const fullDayMarkValues = [0, 360, 720, 1080, 1439]; // 00:00, 06:00, 12:00, 18:00, 23:59
      fullDayMarkValues.forEach((val) => {
        resultMarks.push({
          value: val,
          // Label 23:59 (1439) as "24:00" by passing 1440 to formatter
          label: formatTimeValueInternal(val === 1439 ? 1440 : val),
        });
      });
    }
    return resultMarks.filter((mark) => mark.value <= sliderMaxVal); // Final safety filter
  }, [isToday, sliderMaxVal, step, formatTimeValueInternal, selectedDate]);

  const sliderValueLabelFormat = (rawSliderValue: number): string => {
    if (isToday && rawSliderValue === sliderMaxVal) {
      return "Now";
    }
    // For the tooltip, if slider is at 1439 on a non-today date, show "24:00"
    if (!isToday && rawSliderValue === 1439) {
      return formatTimeValueInternal(1440);
    }
    return formatTimeValueInternal(rawSliderValue);
  };

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
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              component="span"
              variant="body1" // Made larger than description's body2
              color="text.primary"
              sx={{ fontWeight: "bold" }}
            >
              {displayTimeText}
            </Typography>
            {isToday &&
              !isEffectivelyUnset &&
              currentMinutesFromMidnight !== null &&
              (() => {
                const now = new Date();
                const currentActualMinutes =
                  now.getHours() * 60 + now.getMinutes();
                // Show (Now) if selected time is within one step of current time
                if (
                  Math.abs(currentMinutesFromMidnight - currentActualMinutes) <
                  step
                ) {
                  return (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 0.5 }}
                    >
                      (Now)
                    </Typography>
                  );
                }
                return null;
              })()}
          </Box>
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
          sx={{
            flexGrow: 1,
            // Removed mr: 2 as the time text is no longer next to it
            "& .MuiSlider-thumb": {
              backgroundColor: isEffectivelyUnset ? "grey.500" : "primary.main",
            },
          }}
          value={sliderDisplayPosition}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={0}
          max={sliderMaxVal}
          step={step}
          marks={marks}
          valueLabelDisplay="auto"
          valueLabelFormat={sliderValueLabelFormat}
          disabled={disabled}
        />
        {/* The Typography for displayTimeText has been moved up */}
      </Box>
    </Box>
  );
};

export default TimeSelectFieldView;
