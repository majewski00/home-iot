import React from "react";
import { FieldType } from "@src-types/journal/journal.types";

// Import field type components
import {
  NumberNavigationFieldView,
  NumberNavigationFieldEdit,
} from "./types/NumberNavigationField";
import { NumberFieldView, NumberFieldEdit } from "./types/NumberField";
import {
  TimeSelectFieldView,
  TimeSelectFieldEdit,
} from "./types/TimeSelectField";
import { SeverityFieldView, SeverityFieldEdit } from "./types/SeverityField";
import { RangeFieldView, RangeFieldEdit } from "./types/RangeField";
import {
  CustomScaleFieldView,
  CustomScaleFieldEdit,
} from "./types/CustomScaleField";

export interface FieldTypeFactoryProps {
  fieldType: FieldType;
  value: any;
  onChange: (value: any) => void;
  mode: "view" | "edit";
  onFieldTypeUpdate?: (updates: Partial<FieldType>) => void; // Only needed in edit mode
  selectedDate?: string; // YYYY-MM-DD format, optional as not all views need it
}

/**
 * FieldTypeFactory component
 * Renders the appropriate field type component based on the field type kind and mode
 */
const FieldTypeFactory: React.FC<FieldTypeFactoryProps> = ({
  fieldType,
  value,
  onChange,
  mode,
  onFieldTypeUpdate,
  selectedDate,
}) => {
  // Don't render CHECK field type here - it's handled separately
  if (fieldType.kind === "CHECK") {
    return null;
  }

  switch (fieldType.kind) {
    case "NUMBER_NAVIGATION":
      return mode === "view" ? (
        <NumberNavigationFieldView
          value={value}
          onChange={onChange}
          fieldType={fieldType}
        />
      ) : (
        <NumberNavigationFieldEdit
          fieldType={fieldType}
          onUpdate={onFieldTypeUpdate}
        />
      );

    case "NUMBER":
      return mode === "view" ? (
        <NumberFieldView
          value={value}
          onChange={onChange}
          fieldType={fieldType}
        />
      ) : (
        <NumberFieldEdit fieldType={fieldType} onUpdate={onFieldTypeUpdate} />
      );

    case "TIME_SELECT":
      return mode === "view" ? (
        <TimeSelectFieldView
          value={value}
          onChange={onChange}
          fieldType={fieldType}
          selectedDate={selectedDate || new Date().toISOString().split("T")[0]}
        />
      ) : (
        <TimeSelectFieldEdit
          fieldType={fieldType}
          onUpdate={onFieldTypeUpdate}
        />
      );

    case "SEVERITY":
      return mode === "view" ? (
        <SeverityFieldView
          value={value}
          onChange={onChange}
          fieldType={fieldType}
        />
      ) : (
        <SeverityFieldEdit fieldType={fieldType} onUpdate={onFieldTypeUpdate} />
      );

    case "RANGE":
      return mode === "view" ? (
        <RangeFieldView
          value={value}
          onChange={onChange}
          fieldType={fieldType}
        />
      ) : (
        <RangeFieldEdit fieldType={fieldType} onUpdate={onFieldTypeUpdate} />
      );

    case "CUSTOM_SCALE":
      return mode === "view" ? (
        <CustomScaleFieldView
          value={value}
          onChange={onChange}
          fieldType={fieldType}
        />
      ) : (
        <CustomScaleFieldEdit
          fieldType={fieldType}
          onUpdate={onFieldTypeUpdate}
        />
      );

    default:
      return <div>Unsupported field type: {fieldType.kind}</div>;
  }
};

export default FieldTypeFactory;
