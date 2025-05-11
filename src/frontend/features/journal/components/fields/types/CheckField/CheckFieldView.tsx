import React from "react";
import { FormControlLabel, Switch } from "@mui/material";

export interface CheckFieldViewProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * CheckFieldView component
 * Renders a switch for YES/NO toggle
 */
const CheckFieldView: React.FC<CheckFieldViewProps> = ({
  value,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <FormControlLabel
      control={
        <Switch
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          color="primary"
        />
      }
      label={value ? "YES" : "NO"}
      labelPlacement="start"
    />
  );
};

export default CheckFieldView;
