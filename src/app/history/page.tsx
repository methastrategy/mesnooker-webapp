import { redirect } from "next/navigation";

/**
 * Historical matches are now unified inside the primary Match Board workspace (/match).
 * Forward direct navigation to /match?tab=history.
 */
export default function HistoryPage() {
  redirect("/match?tab=history");
}