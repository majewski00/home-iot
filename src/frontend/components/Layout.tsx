import { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useTheme,
} from "@mui/material";
import { AccountCircle, Settings, Logout } from "@mui/icons-material";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useUserAttributes } from "../hooks/useUserAttributes";

const Layout = () => {
  useTheme();
  const { signOut } = useAuthenticator((context) => [context.signOut]);
  const { getUserFullName, getNameInitial } = useUserAttributes();
  const nameInitials = getNameInitial();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Home IoT
          </Typography>
          <Box sx={{ display: "flex", ml: "auto" }}>
            <Button color="inherit" href="/journal">
              {/* // TODO: improve SPA */}
              Journal
            </Button>
          </Box>
          <Box sx={{ display: "flex", ml: "auto" }}>
            <Tooltip title={getUserFullName() || "User"}>
              <IconButton
                onClick={handleProfileMenuOpen}
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="profile-menu"
                aria-haspopup="true"
                color="inherit"
              >
                {nameInitials ? (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: (theme) => theme.palette.primary.main,
                    }}
                  >
                    {nameInitials}
                  </Avatar>
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleProfileMenuClose}
          slotProps={{
            list: { "aria-labelledby": "profile-button" },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleProfileMenuClose}>
            <AccountCircle sx={{ mr: 1 }} /> Profile
          </MenuItem>
          <MenuItem onClick={handleProfileMenuClose}>
            <Settings sx={{ mr: 1 }} /> Settings
          </MenuItem>
          <MenuItem onClick={signOut}>
            <Logout sx={{ mr: 1 }} /> Sign Out
          </MenuItem>
        </Menu>
      </AppBar>

      <Box sx={{ p: 2 }}>
        <Outlet />
      </Box>
    </>
  );
};

export default Layout;
