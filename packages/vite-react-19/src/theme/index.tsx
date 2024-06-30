import { CssBaseline, CssVarsProvider } from "@mui/joy";
import type { ReactNode } from "react";

function Theme({ children }: { children: ReactNode }) {
  return (
    <CssVarsProvider defaultMode="dark">
      <CssBaseline />
      {children}
    </CssVarsProvider>
  );
}

export { Theme };
