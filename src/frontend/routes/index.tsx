import { lazy, Suspense } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

const LoginPage = lazy(() => import("../pages/SignInPage"));
const JournalPage = lazy(
  () => import("../features/journal/components/JournalPage")
);
const Layout = lazy(() => import("../components/Layout"));

const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

const AppRoutes = () => {
  const { authStatus } = useAuthenticator((context) => {
    return [context.authStatus];
  });

  switch (authStatus) {
    case "configuring":
      return <LoadingFallback />;
    case "authenticated":
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/journal" element={<JournalPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/journal" replace />} />
            {/* // TODO: Temporary */}
          </Routes>
        </Suspense>
      );
    case "unauthenticated":
      return (
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/auth" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Suspense>
      );
    default:
      return <LoadingFallback />;
  }
};

export default AppRoutes;
