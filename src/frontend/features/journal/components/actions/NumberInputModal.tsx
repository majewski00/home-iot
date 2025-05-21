import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { FieldTypeKind } from "@src-types/journal/journal.types";

interface NumberInputModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
  fieldTypeKind: FieldTypeKind | string;
  currentValue: any;
  // Add these new properties
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

const NumberInputModal: React.FC<NumberInputModalProps> = ({
  open,
  onClose,
  onSubmit,
  fieldTypeKind,
  currentValue,
  min = 0,
  max,
  step = 1,
  unit,
  description,
}) => {
  const [value, setValue] = useState<number>(0);

  useEffect(() => {
    if (open) {
      // Initialize with current value if available, otherwise use minimum value
      setValue(
        currentValue !== null && currentValue !== undefined
          ? Number(currentValue)
          : min
      );
    }
  }, [open, currentValue, min]);

  const handleIncrement = () => {
    setValue((prev) => {
      const newValue = prev + step;
      return max !== undefined ? Math.min(max, newValue) : newValue;
    });
  };

  const handleDecrement = () => {
    setValue((prev) => {
      const newValue = prev - step;
      return Math.max(min, newValue);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value === "" ? min : Number(e.target.value);

    // Enforce min/max constraints
    if (max !== undefined) {
      newValue = Math.min(max, newValue);
    }
    newValue = Math.max(min, newValue);

    setValue(newValue);
  };

  const handleSubmit = () => {
    onSubmit(value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}>
        {description ||
          (fieldTypeKind === "NUMBER_NAVIGATION"
            ? "Select a Number"
            : "Enter Value")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ my: 2 }}>
          {!description && (
            <Typography variant="body2" sx={{ mb: 2, textAlign: "center" }}>
              {fieldTypeKind === "NUMBER_NAVIGATION"
                ? "Select a number value"
                : "Enter a value"}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconButton onClick={handleDecrement} disabled={value <= min}>
              <RemoveIcon />
            </IconButton>

            <TextField
              type="number"
              value={value}
              onChange={handleChange}
              inputProps={{
                style: { textAlign: "center" },
                inputMode: "numeric",
                min: min,
                max: max,
                step: step,
              }}
              InputProps={{
                endAdornment: unit && (
                  <Typography
                    variant="body1"
                    sx={{ ml: 1, color: "text.secondary" }}
                  >
                    {unit}
                  </Typography>
                ),
              }}
              sx={{ width: "160px", mx: 2 }}
            />

            <IconButton
              onClick={handleIncrement}
              disabled={max !== undefined && value >= max}
            >
              <AddIcon />
            </IconButton>
          </Box>

          {/* Show constraints information */}
          <Box sx={{ mt: 1.5, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              {[
                `Min: ${min}`,
                max !== undefined ? `Max: ${max}` : null,
                step !== 1 ? `Step: ${step}` : null,
              ]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
          </Box>

          {currentValue !== null && currentValue !== undefined && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, textAlign: "center" }}
            >
              Current value: {currentValue}
              {unit ? ` ${unit}` : ""}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NumberInputModal;
