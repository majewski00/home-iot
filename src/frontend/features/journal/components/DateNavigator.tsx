import React from "react";
import { Box, Typography, IconButton, Paper, useTheme } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from "@mui/icons-material";

interface DateNavigatorProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
}

/**
 * Component for navigating between journal dates
 * Shows current date and provides Previous/Next day buttons
 */
const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const theme = useTheme();

  // Check if selected date is today
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  today.setHours(0, 0, 0, 0);
  const isToday = selectedDate === todayStr;

  // Format the date for display
  const formattedDate = isToday
    ? "Today"
    : new Date(selectedDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  // Navigate to previous day
  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    onDateChange(date.toISOString().split("T")[0]);
  };

  // Navigate to next day
  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const nextDateStr = date.toISOString().split("T")[0];

    // Don't allow navigating to future dates
    if (nextDateStr <= todayStr) {
      onDateChange(nextDateStr);
    }
  };

  // Navigate to today
  const handleGoToToday = () => {
    if (!isToday) {
      onDateChange(todayStr);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 4,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        bgcolor: theme.palette.background.paper,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          position: "relative",
        }}
      >
        <IconButton
          onClick={handlePreviousDay}
          aria-label="Previous day"
          sx={{
            color: theme.palette.text.secondary,
            "&:hover": { color: theme.palette.primary.main },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box sx={{ mx: 2, textAlign: "center" }}>
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: "medium",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isToday && (
              <TodayIcon
                fontSize="small"
                sx={{ mr: 1, color: theme.palette.primary.main }}
              />
            )}
            {formattedDate}
          </Typography>
        </Box>

        <IconButton
          onClick={handleNextDay}
          disabled={isToday}
          aria-label="Next day"
          sx={{
            color: isToday
              ? theme.palette.action.disabled
              : theme.palette.text.secondary,
            "&:hover": {
              color: isToday
                ? theme.palette.action.disabled
                : theme.palette.primary.main,
            },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {!isToday && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="body2"
            color="primary"
            sx={{
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={handleGoToToday}
          >
            Go to Today
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DateNavigator;
