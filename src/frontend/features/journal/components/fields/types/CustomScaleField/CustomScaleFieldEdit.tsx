import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Slider,
  IconButton,
  Button,
} from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { FieldType } from "@src-types/journal/journal.types";

export interface CustomScaleFieldEditProps {
  fieldType: FieldType;
  onUpdate?: (updates: Partial<FieldType>) => void;
}

/**
 * CustomScaleFieldEdit component
 * Allows configuration of a CustomScaleField with custom labels
 */
const CustomScaleFieldEdit: React.FC<CustomScaleFieldEditProps> = ({
  fieldType,
  onUpdate,
}) => {
  const [description, setDescription] = useState<string>(
    fieldType.description || ""
  );

  const [labels, setLabels] = useState<string[]>(() => {
    const existingLabels = fieldType.dataOptions?.labels as
      | string[]
      | undefined;
    return existingLabels && existingLabels.length > 0
      ? existingLabels
      : ["Default"];
  });

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (onUpdate) {
      onUpdate({ description: newDescription });
    }
  };

  const handleLabelChange = (index: number, newLabel: string) => {
    const newLabels = [...labels];
    newLabels[index] = newLabel;
    setLabels(newLabels);
    updateLabels(newLabels);
  };

  const addLabel = () => {
    const newLabels = [...labels, `Option ${labels.length + 1}`];
    setLabels(newLabels);
    updateLabels(newLabels);
  };

  const removeLabel = (index: number) => {
    if (labels.length > 1) {
      const newLabels = labels.filter((_, i) => i !== index);
      setLabels(newLabels);
      updateLabels(newLabels);
    }
  };

  const updateLabels = (newLabels: string[]) => {
    if (onUpdate) {
      onUpdate({
        dataOptions: {
          ...fieldType.dataOptions,
          labels: newLabels,
        },
      });
    }
  };

  const previewMarks = labels.map((label, index) => ({
    value: index + 1,
    label: label.trim() || `Option ${index + 1}`,
  }));

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={handleDescriptionChange}
          size="small"
          placeholder="e.g., How would you rate this?"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Scale Labels (in order from left to right)
        </Typography>

        {labels.map((label, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ minWidth: "20px", textAlign: "right" }}
            >
              {index + 1}.
            </Typography>
            <TextField
              size="small"
              value={label}
              onChange={(e) => handleLabelChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              sx={{ flexGrow: 1 }}
            />
            <IconButton
              onClick={() => removeLabel(index)}
              disabled={labels.length <= 1}
              size="small"
              color="error"
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={addLabel}
          variant="outlined"
          size="small"
          sx={{ mt: 1 }}
        >
          Add Label
        </Button>
      </Box>

      <Box sx={{ px: 3, opacity: 0.6, mt: 3, width: "90%" }}>
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
          max={labels.length}
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

export default CustomScaleFieldEdit;
