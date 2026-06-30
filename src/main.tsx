import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryProvider } from "./lib/query-client";
import { AuthProvider } from "./lib/auth";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryProvider>
  </StrictMode>
);
