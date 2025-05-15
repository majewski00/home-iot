import React, { useState, useEffect, useMemo } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { FieldType } from "@src-types/journal/journal.types";

interface Mark {
  value: number;
  label: string;
}

export interface RangeFieldViewProps {
  value: number | null;
  onChange: (value: number | null) => void;
  fieldType: FieldType;
  disabled?: boolean;
}

const RangeFieldView: React.FC<RangeFieldViewProps> = ({
  value: propValue,
  onChange,
  fieldType,
  disabled = false,
}) => {
  const minValue = useMemo(
    () => Number(fieldType.dataOptions?.min ?? 0),
    [fieldType.dataOptions?.min]
  );

  const maxValue = useMemo(
    () => Number(fieldType.dataOptions?.max ?? 100),
    [fieldType.dataOptions?.max]
  );

  const step = useMemo(
    () => Number(fieldType.dataOptions?.step ?? 1),
    [fieldType.dataOptions?.step]
  );

  const unitLabel = useMemo(
    () => fieldType.dataOptions?.unit as string | undefined,
    [fieldType.dataOptions?.unit]
  );

  const formatValue = useMemo(
    () =>
      (val: number): string =>
        unitLabel ? `${val} ${unitLabel}` : val.toString(),
    [unitLabel]
  );

  const generateMarks = useMemo((): Mark[] => {
    const markAllValues = fieldType.dataOptions?.markAllValues === true;

    if (minValue >= maxValue) {
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

      return marks;
    }

    return [
      { value: minValue, label: formatValue(minValue) },
      { value: maxValue, label: formatValue(maxValue) },
    ];
  }, [
    minValue,
    maxValue,
    step,
    formatValue,
    fieldType.dataOptions?.markAllValues,
  ]);

  const [localValue, setLocalValue] = useState<number>(
    propValue !== null ? propValue : minValue
  );

  useEffect(() => {
    setLocalValue(propValue !== null ? propValue : minValue);
  }, [propValue, minValue]);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setLocalValue(newValue as number);
  };

  const handleChangeCommitted = (
    _event: React.SyntheticEvent | Event,
    newValue: number | number[]
  ) => {
    onChange(newValue as number);
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", mb: 2, width: "100%" }}
    >
      {fieldType.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {fieldType.description}
        </Typography>
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
          value={localValue}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          min={minValue}
          max={maxValue}
          step={step}
          marks={generateMarks}
          valueLabelDisplay="auto"
          valueLabelFormat={formatValue}
          disabled={disabled || minValue >= maxValue}
          sx={{ flexGrow: 1 }}
        />
      </Box>
    </Box>
  );
};

export default RangeFieldView;
