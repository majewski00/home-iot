import React, { useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { FieldType } from "@src-types/journal/journal.types";

export interface TimeSelectFieldEditProps {
  fieldType: FieldType;
  onUpdate?: (updates: Partial<FieldType>) => void;
}

/**
 * TimeSelectFieldEdit component
 * Allows configuration of a TimeSelectField
 */
const TimeSelectFieldEdit: React.FC<TimeSelectFieldEditProps> = ({
  fieldType,
  onUpdate,
}) => {
  const [description, setDescription] = useState<string>(
    fieldType.description || ""
  );
  const [step, setStep] = useState<number>(
    fieldType.dataOptions?.step !== undefined
      ? Number(fieldType.dataOptions.step)
      : 30
  );

  const maxTime = 1440; // 24 hours in minutes

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (onUpdate) {
      onUpdate({ description: newDescription });
    }
  };

  const handleStepSelectChange = (event: SelectChangeEvent<number>) => {
    const newStep = Number(event.target.value);
    if (!isNaN(newStep) && newStep > 0) {
      setStep(newStep);
      if (onUpdate) {
        onUpdate({
          dataOptions: {
            ...fieldType.dataOptions,
            step: newStep,
          },
        });
      }
    }
  };

  const previewMarks = [
    { value: 0, label: "0h" },
    { value: maxTime / 4, label: `${maxTime / 240}h` }, // 6h
    { value: maxTime / 2, label: `${maxTime / 120}h` }, // 12h
    { value: (maxTime / 4) * 3, label: `${maxTime / 80}h` }, // 18h
    { value: maxTime, label: `${maxTime / 60}h` }, // 24h
  ];

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Box
        display="flex"
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          gap: 2, // Spacing between items
          mb: 3, // Margin bottom for the whole row
        }}
      >
        <Box sx={{ width: { xs: "100%", sm: "calc(66.66% - 8px)" } }}>
          {" "}
          {/* 2/3 width, accounting for half gap */}
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={handleDescriptionChange}
            size="small"
            placeholder="e.g., When did it happen?"
          />
        </Box>
        <Box sx={{ width: { xs: "100%", sm: "calc(33.33% - 8px)" } }}>
          {" "}
          {/* 1/3 width, accounting for half gap */}
          <FormControl fullWidth size="small">
            <InputLabel id="time-step-select-label">Interval</InputLabel>
            <Select
              labelId="time-step-select-label"
              value={step}
              label="Interval"
              onChange={handleStepSelectChange}
            >
              <MenuItem value={15}>15 minutes</MenuItem>
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={60}>60 minutes</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ px: 1, opacity: 0.6 }}>
        {" "}
        {/* Apply opacity for "grayed out" look */}
        <Typography
          variant="caption"
          display="block"
          gutterBottom
          sx={{ textAlign: "center", color: "text.secondary" }}
        >
          Preview
        </Typography>
        <Slider
          disabled
          value={0} // Static value, as it's non-interactive
          min={0}
          max={maxTime}
          step={step}
          marks={previewMarks}
          valueLabelDisplay="off"
          sx={{
            "& .MuiSlider-thumb": {
              backgroundColor: "grey.500", // Ensure thumb is visible but looks disabled
            },
            "& .MuiSlider-track": {
              backgroundColor: "grey.500",
            },
            "& .MuiSlider-rail": {
              backgroundColor: "grey.300",
            },
            "& .MuiSlider-markLabel": {
              color: "text.disabled",
            },
            "& .MuiSlider-mark": {
              backgroundColor: "grey.400",
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default TimeSelectFieldEdit;
