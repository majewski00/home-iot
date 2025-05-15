import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { FieldType } from "@src-types/journal/journal.types";

interface Mark {
  value: number;
  label: string;
}

const unitOptions = [
  "",
  "%",
  "points",
  "times",
  "count",
  "level",
  "kg",
  "g",
  "mg",
  "cm",
  "m",
  "mm",
  "L",
  "ml",
  "sec",
  "min",
  "hr",
  "days",
  "kcal",
];

export interface RangeFieldEditProps {
  fieldType: FieldType;
  onUpdate?: (updates: Partial<FieldType>) => void;
}

const RangeFieldEdit: React.FC<RangeFieldEditProps> = ({
  fieldType,
  onUpdate,
}) => {
  const [description, setDescription] = useState<string>(
    fieldType.description || ""
  );
  const [minValue, setMinValue] = useState<number>(
    Number(fieldType.dataOptions?.min ?? 0)
  );
  const [maxValue, setMaxValue] = useState<number>(
    Number(fieldType.dataOptions?.max ?? 100)
  );
  const [step, setStep] = useState<number>(
    Number(fieldType.dataOptions?.step ?? 1)
  );
  const [unitLabel, setUnitLabel] = useState<string>(
    (fieldType.dataOptions?.unit as string) || ""
  );
  const [markAllValues, setMarkAllValues] = useState<boolean>(
    fieldType.dataOptions?.markAllValues === true
  );

  const formatValue = (val: number): string => {
    return unitLabel ? `${val} ${unitLabel}` : val.toString();
  };

  const updateDataOptions = (updates: Record<string, any>) => {
    if (onUpdate) {
      onUpdate({
        dataOptions: {
          ...fieldType.dataOptions,
          min: minValue,
          max: maxValue,
          step: step,
          unit: unitLabel,
          markAllValues: markAllValues,
          ...updates,
        },
      });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (onUpdate) {
      onUpdate({ description: newDescription });
    }
  };

  const handleMinValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinValue = Number(e.target.value);
    if (!isNaN(newMinValue)) {
      setMinValue(newMinValue);
      updateDataOptions({ min: newMinValue });
    }
  };

  const handleMaxValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxValue = Number(e.target.value);
    if (!isNaN(newMaxValue)) {
      setMaxValue(newMaxValue);
      updateDataOptions({ max: newMaxValue });
    }
  };

  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStep = Number(e.target.value);
    if (!isNaN(newStep) && newStep >= 1) {
      setStep(newStep);
      updateDataOptions({ step: newStep });
    }
  };

  const handleUnitLabelChange = (event: SelectChangeEvent<string>) => {
    const newUnitLabel = event.target.value as string;
    setUnitLabel(newUnitLabel);
    updateDataOptions({ unit: newUnitLabel });
  };

  const handleMarkAllValuesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newMarkAllValues = event.target.checked;
    setMarkAllValues(newMarkAllValues);
    updateDataOptions({ markAllValues: newMarkAllValues });
  };

  const generateMarks = useMemo((): Mark[] => {
    if (minValue >= maxValue || step <= 0) {
      return [{ value: minValue, label: formatValue(minValue) }];
    }

    if (markAllValues) {
      const marks: Mark[] = [];
      for (let i = minValue; i <= maxValue; i += step) {
        marks.push({ value: i, label: formatValue(i) });
      }

      if (marks.length > 0 && marks[marks.length - 1].value < maxValue) {
        marks.push({ value: maxValue, label: formatValue(maxValue) });
      }

      return marks
        .filter(
          (mark, index, self) =>
            index === self.findIndex((m) => m.value === mark.value)
        )
        .sort((a, b) => a.value - b.value);
    }

    // If not showing all marks, show a smart selection
    const smartMarks: Mark[] = [
      { value: minValue, label: formatValue(minValue) },
    ];

    // Add some intermediate marks if range is large enough
    if (maxValue - minValue > step * 2) {
      const middleValue = minValue + Math.floor((maxValue - minValue) / 2);
      const nearestStep = Math.round(middleValue / step) * step;
      if (nearestStep > minValue && nearestStep < maxValue) {
        smartMarks.push({
          value: nearestStep,
          label: formatValue(nearestStep),
        });
      }
    }

    // Add max value if not already included
    if (maxValue > minValue) {
      smartMarks.push({ value: maxValue, label: formatValue(maxValue) });
    }

    return smartMarks;
  }, [minValue, maxValue, step, unitLabel, markAllValues, formatValue]);

  return (
    <Box sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={handleDescriptionChange}
          size="small"
          placeholder="e.g., Rate your mood"
        />
      </Box>

      <Box
        display="flex"
        sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2 }}
      >
        <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
          <FormControl fullWidth size="small">
            <InputLabel id="unit-label-select-label">
              Unit Label (optional)
            </InputLabel>
            <Select
              labelId="unit-label-select-label"
              value={unitLabel}
              label="Unit Label (optional)"
              onChange={handleUnitLabelChange}
            >
              {unitOptions.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit || <em>--</em>}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
          <TextField
            fullWidth
            label="Step"
            type="number"
            value={step}
            onChange={handleStepChange}
            size="small"
            inputProps={{ min: 1, step: 1 }}
            helperText="Increment between values"
          />
        </Box>
      </Box>

      <Box
        display="flex"
        sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2 }}
      >
        <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
          <TextField
            fullWidth
            label="Minimum Value"
            type="number"
            value={minValue}
            onChange={handleMinValueChange}
            size="small"
          />
        </Box>
        <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
          <TextField
            fullWidth
            label="Maximum Value"
            type="number"
            value={maxValue}
            onChange={handleMaxValueChange}
            size="small"
          />
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={markAllValues}
              onChange={handleMarkAllValuesChange}
              size="small"
            />
          }
          label="Show all step marks in preview"
        />
      </Box>

      <Box sx={{ mt: 2, opacity: 0.6 }}>
        <Typography
          variant="caption"
          display="block"
          gutterBottom
          sx={{ textAlign: "center", color: "text.secondary", mb: 1 }}
        >
          Preview
        </Typography>
        <Box sx={{ px: 1 }}>
          <Slider
            disabled
            value={minValue}
            min={minValue}
            max={maxValue}
            step={step}
            marks={generateMarks}
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
    </Box>
  );
};

export default RangeFieldEdit;
