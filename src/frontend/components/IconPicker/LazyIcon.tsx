// src/components/LazyIcon.tsx
import React, { lazy, Suspense, useMemo } from "react";
import { Skeleton, SvgIconProps } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";

// Define the props for our LazyIcon component
interface LazyIconProps extends SvgIconProps {
  name: string;
}

// The dynamic import function.
// It returns a promise that resolves to a module with a 'default' export.
const loadIcon = (name: string): Promise<{ default: SvgIconComponent }> =>
  import("@mui/icons-material").then((module) => {
    // The module from the dynamic import contains all icons as named exports.
    // React.lazy requires a module with a `default` export.
    // We create a "fake" module on the fly to satisfy this.
    const IconComponent = module[
      name as keyof typeof module
    ] as SvgIconComponent;
    return { default: IconComponent };
  });

const LazyIcon = ({ name, ...props }: LazyIconProps) => {
  // Use React.lazy with our dynamic loader
  const IconComponent = useMemo(() => lazy(() => loadIcon(name)), [name]);

  return (
    <Suspense fallback={<Skeleton variant="circular" width={24} height={24} />}>
      <IconComponent {...props} />
    </Suspense>
  );
};

export default LazyIcon;
