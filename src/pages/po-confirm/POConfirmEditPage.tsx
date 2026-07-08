import { useParams } from "@tanstack/react-router";
import { POConfirmFormPage } from "./POConfirmFormPage";

export function POConfirmEditPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  return <POConfirmFormPage mode="edit" doku={id} />;
}
