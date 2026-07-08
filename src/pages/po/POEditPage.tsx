import { useParams } from "@tanstack/react-router";
import { POFormPage } from "./POFormPage";

export function POEditPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  return <POFormPage mode="edit" doku={id} />;
}
