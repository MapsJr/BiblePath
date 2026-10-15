
import { redirect } from "next/navigation";

export default function LegacyUpdatePasswordRedirect() {
  redirect("/auth/update-password");
}
