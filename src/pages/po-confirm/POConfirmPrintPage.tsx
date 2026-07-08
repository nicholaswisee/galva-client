import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { POConfirmFormPage } from "./POConfirmFormPage";

export function POConfirmPrintPage() {
  const { id } = useParams({ strict: false }) as { id: string };

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  return <POConfirmFormPage mode="print" doku={id} />;
}
