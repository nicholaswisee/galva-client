import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { POFormPage } from "./POFormPage";

export function POPrintPage() {
  const { id } = useParams({ strict: false }) as { id: string };

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  return <POFormPage mode="print" doku={id} />;
}
