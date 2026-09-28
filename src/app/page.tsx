import { redirect } from "next/navigation";

/**
 * Root page redirects directly to the primary Match Board workspace (/match)
 * Eliminating the redundant intermediate dashboard in alignment with Raycast / Linear design philosophy.
 */
export default function HomePage() {
  redirect("/match");
}