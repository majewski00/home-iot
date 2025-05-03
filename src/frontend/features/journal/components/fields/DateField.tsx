import React, { useState, useEffect } from "react";
import { Box, Typography, Slider, TextField } from "@mui/material";

interface DateFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
  date: string; // Current journal date in YYYY-MM-DD format
}

/**
 * Date field with a slider for selecting time
 * Allows selecting time from 11 PM previous day to current time
 */
const DateField: React.FC<DateFieldProps> = ({
  value,
  onChange,
  label,
  date,
}) => {
  // Calculate min and max times for the slider
  const journalDate = new Date(date);
  const now = new Date();

  // If journal date is today, max time is current time
  // Otherwise, max time is end of day
  const isToday = journalDate.toDateString() === now.toDateString();
  const maxTime = isToday
    ? now
    : new Date(
        journalDate.getFullYear(),
        journalDate.getMonth(),
        journalDate.getDate(),
        23,
        59
      );

  // Min time is 11 PM previous day
  const minTime = new Date(
    journalDate.getFullYear(),
    journalDate.getMonth(),
    journalDate.getDate() - 1,
    23,
    0
  );

  // Calculate total minutes in range for slider
  const totalMinutes = (maxTime.getTime() - minTime.getTime()) / (1000 * 60);

  // Convert value to slider value (minutes from min time)
  const getSliderValue = (timeStr: string | null): number => {
    if (!timeStr) return 0;

    try {
      const timeDate = new Date(timeStr);
      const minutesFromMin =
        (timeDate.getTime() - minTime.getTime()) / (1000 * 60);
      return Math.max(0, Math.min(totalMinutes, minutesFromMin));
    } catch (e) {
      return 0;
    }
  };

  // Convert slider value to date string
  const getDateFromSlider = (sliderValue: number): string => {
    const date = new Date(minTime.getTime() + sliderValue * 60 * 1000);
    return date.toISOString();
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
    const dateStr = getDateFromSlider(numValue);
    onChange(dateStr);
  };

  // Get marks for the slider (every 2 hours)
  const getMarks = () => {
    const marks = [];
    const hoursRange = Math.ceil(totalMinutes / 60);

    for (let i = 0; i <= hoursRange; i += 2) {
      const minutes = i * 60;
      if (minutes <= totalMinutes) {
        const date = new Date(minTime.getTime() + minutes * 60 * 1000);
        marks.push({
          value: minutes,
          label: formatTime(date),
        });
      }
    }

    return marks;
  };

  // Format current value for display
  const displayTime = value ? formatTime(new Date(value)) : "Not selected";

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="body2" gutterBottom>
        {label}
      </Typography>

      <Box sx={{ px: 2 }}>
        <Slider
          value={sliderValue}
          min={0}
          max={totalMinutes}
          step={30} // 30-minute increments
          marks={getMarks()}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderChangeCommitted}
          valueLabelDisplay="auto"
          valueLabelFormat={(val) => {
            const date = new Date(minTime.getTime() + val * 60 * 1000);
            return formatTime(date);
          }}
        />
      </Box>

      <Box sx={{ mt: 1, textAlign: "center" }}>
        <Typography variant="body2" color="primary" fontWeight="bold">
          {displayTime}
        </Typography>
      </Box>
    </Box>
  );
};

export default DateField;
