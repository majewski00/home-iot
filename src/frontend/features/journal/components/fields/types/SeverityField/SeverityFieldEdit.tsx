import React, { useState } from "react";
import { Box, TextField, Typography, Grid } from "@mui/material";
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
  // Get current values from dataOptions or set defaults
  const [description, setDescription] = useState<string>(
    fieldType.description || ""
  );

  // Default severity levels (not editable for now)
  const severityLevels = [
    { value: 0, label: "None", color: "#9e9e9e" },
    { value: 1, label: "Low", color: "#4caf50" },
    { value: 2, label: "Moderate", color: "#ff9800" },
    { value: 3, label: "High", color: "#f44336" },
    { value: 4, label: "Very High", color: "#9c27b0" },
  ];

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (onUpdate) {
      onUpdate({ description: newDescription });
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        mb: 2,
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Severity Field Settings
      </Typography>

      <Grid container spacing={2}>
        <Grid sx={{ gap: 12 }}>
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={handleDescriptionChange}
            margin="normal"
            size="small"
            placeholder="e.g., How severe was it?"
          />
        </Grid>

        <Grid sx={{ gap: 12 }}>
          <Typography variant="body2" gutterBottom>
            Severity Levels:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
            {severityLevels.map((level) => (
              <Box
                key={level.value}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: level.color,
                  }}
                />
                <Typography variant="body2">
                  {level.value}: {level.label}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Severity levels are predefined and cannot be changed.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeverityFieldEdit;
