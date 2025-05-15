import React, { useState } from "react";
import { Box, TextField, Typography, Slider } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

export interface SeverityFieldEditProps {
  fieldType: FieldType;
  onUpdate?: (updates: Partial<FieldType>) => void;
}

/**
 * SeverityFieldEdit component
 * Allows configuration of a SeverityField
 */
const SeverityFieldEdit: React.FC<SeverityFieldEditProps> = ({
  fieldType,
  onUpdate,
}) => {
  const [description, setDescription] = useState<string>(
    fieldType.description || ""
  );

  // Severity levels for preview (Low, Moderate, High, Very High)
  // Colors are not needed for the preview slider as per feedback
  const previewSeverityLevels = [
    { value: 1, label: "Low" },
    { value: 2, label: "Moderate" },
    { value: 3, label: "High" },
    { value: 4, label: "Very High" },
  ];

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (onUpdate) {
      onUpdate({ description: newDescription });
    }
  };

  const previewMarks = previewSeverityLevels.map((level) => ({
    value: level.value,
    label: level.label,
  }));

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Box
        sx={{
          mb: 2,
        }}
      >
        <Box sx={{ width: "100%" }}>
          {" "}
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={handleDescriptionChange}
            size="small"
            placeholder="e.g., How severe was it?"
          />
        </Box>
      </Box>

      <Box sx={{ px: 3, opacity: 0.6, mt: 3, width: "90%" }}>
        {" "}
        {/* Increased px from 1 to 3 for preview slider */}{" "}
        <Typography
          variant="caption"
          display="block"
          sx={{ textAlign: "center", color: "text.secondary", mb: 1 }}
        >
          Preview
        </Typography>
        <Slider
          disabled
          value={1}
          min={1}
          max={previewSeverityLevels.length}
          step={1}
          marks={previewMarks}
          valueLabelDisplay="off"
          sx={{
            "& .MuiSlider-thumb": {
              backgroundColor: "grey.500",
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

export default SeverityFieldEdit;
