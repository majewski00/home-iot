import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Button,
  Pagination,
  Box,
  Typography,
  Divider,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import * as AllIcons from "@mui/icons-material";
import LazyIcon from "./LazyIcon";
import useDebounce from "../../hooks/useDebounce";

import Grid from "@mui/material/Grid";

const ICONS_PER_PAGE = 48; // Increased for better grid filling
const COLOR_OPTIONS = [
  { value: "inherit", label: "Default", muiColor: "inherit" as const },
  { value: "primary", label: "Blue", muiColor: "primary" as const },
  { value: "secondary", label: "Purple", muiColor: "secondary" as const },
  { value: "success", label: "Green", muiColor: "success" as const },
  { value: "error", label: "Red", muiColor: "error" as const },
  { value: "warning", label: "Orange", muiColor: "warning" as const },
  { value: "brown", label: "Brown", muiColor: "inherit" as const },
  { value: "yellow", label: "Yellow", muiColor: "inherit" as const },
];

// Get the master list of icon names once
const iconNames = Object.keys(AllIcons).filter(
  (name) => /^[A-Z]/.test(name) && name !== "SvgIcon"
);

// --- Component Props ---
interface IconPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string | null, color: string) => void;
  selectedValue?: string | null;
  selectedColor?: string;
}

const IconPicker = ({
  open,
  onClose,
  onSelect,
  selectedValue,
  selectedColor = "inherit",
}: IconPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIcon, setActiveIcon] = useState<string | null>(
    selectedValue || null
  );
  const [activeColor, setActiveColor] = useState<string>(selectedColor);
  const [currentPage, setCurrentPage] = useState(1);

  // Use the debounced search term for filtering to avoid re-filtering on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Reset active icon when the initial selected value changes
  useEffect(() => {
    setActiveIcon(selectedValue || null);
    setActiveColor(selectedColor);
  }, [selectedValue, selectedColor]);

  // Memoize the filtered list of icons for performance
  const filteredIcons = useMemo(() => {
    if (!debouncedSearchTerm) {
      return iconNames;
    }
    const lowercasedFilter = debouncedSearchTerm.toLowerCase();
    return iconNames.filter((name) =>
      name.toLowerCase().includes(lowercasedFilter)
    );
  }, [debouncedSearchTerm]);

  // Calculate pagination details
  const pageCount = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
  const paginatedIcons = useMemo(() => {
    const startIndex = (currentPage - 1) * ICONS_PER_PAGE;
    const endIndex = startIndex + ICONS_PER_PAGE;
    return filteredIcons.slice(startIndex, endIndex);
  }, [filteredIcons, currentPage]);

  // Reset to first page whenever the filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleColorChange = (event: SelectChangeEvent) => {
    setActiveColor(event.target.value);
  };

  const handleSelectAndClose = () => {
    onSelect(activeIcon, activeColor);
    onClose();
  };

  const handleRemoveIcon = () => {
    setActiveIcon(null);
  };

  // Calculate grid columns based on dialog width
  const getGridSize = () => {
    return { xs: 1.5, sm: 1.2, md: 1 }; // More flexible sizing
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Select an Icon</DialogTitle>
      <DialogContent dividers>
        {/* Search and Color Selection Section */}
        <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
          <TextField
            fullWidth
            label="Search icons..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            sx={{ flex: 2 }}
          />
          <FormControl sx={{ minWidth: 150, flex: 1 }}>
            <InputLabel>Color</InputLabel>
            <Select
              value={activeColor}
              label="Color"
              onChange={handleColorChange}
            >
              {COLOR_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LazyIcon
                      name="Circle"
                      color={option.muiColor}
                      fontSize="small"
                      sx={{
                        color:
                          option.value === "brown"
                            ? "#8D6E63"
                            : option.value === "yellow"
                            ? "#FFC107"
                            : undefined,
                      }}
                    />
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {activeIcon ? (
              <LazyIcon
                name={activeIcon}
                color={
                  COLOR_OPTIONS.find((c) => c.value === activeColor)
                    ?.muiColor || "inherit"
                }
                fontSize="large"
                sx={{
                  fontSize: "3rem",
                  flexShrink: 0,
                  color:
                    activeColor === "brown"
                      ? "#8D6E63"
                      : activeColor === "yellow"
                      ? "#FFC107"
                      : undefined,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "3rem",
                  height: "3rem",
                  border: "2px dashed",
                  borderColor: "text.disabled",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="caption" color="text.disabled">
                  No Icon
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />

        {/* Icons Grid */}
        <Box sx={{ height: 500, overflowY: "auto" }}>
          <Grid container spacing={0.5}>
            {paginatedIcons.map((iconName) => (
              <Grid size={getGridSize()} key={iconName}>
                <Tooltip title={iconName} placement="top">
                  <IconButton
                    onClick={() => setActiveIcon(iconName)}
                    sx={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: 1,
                      backgroundColor:
                        activeIcon === iconName
                          ? "action.selected"
                          : "transparent",
                      border:
                        activeIcon === iconName
                          ? "2px solid"
                          : "1px solid transparent",
                      borderColor:
                        activeIcon === iconName
                          ? "primary.main"
                          : "transparent",
                    }}
                  >
                    <LazyIcon
                      name={iconName}
                      color={
                        COLOR_OPTIONS.find((c) => c.value === activeColor)
                          ?.muiColor || "inherit"
                      }
                      sx={{
                        color:
                          activeColor === "brown"
                            ? "#8D6E63"
                            : activeColor === "yellow"
                            ? "#FFC107"
                            : undefined,
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredIcons.length} icons found
          </Typography>
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            size="small"
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          {activeIcon && (
            <Button onClick={handleRemoveIcon} color="secondary">
              Unselect
            </Button>
          )}
          <Button onClick={handleSelectAndClose} variant="contained">
            Select
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default IconPicker;
