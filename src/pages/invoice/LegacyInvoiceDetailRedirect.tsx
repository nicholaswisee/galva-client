import { Navigate, useParams } from "@tanstack/react-router";

export function LegacyInvoiceDetailRedirect() {
  const { id } = useParams({ strict: false }) as { id: string };
  return <Navigate to="/invoices/$id" params={{ id }} />;
}
