import { requireSuperuser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSuperuser();
  } catch {
    redirect("/dashboard");
  }
  return <>{children}</>;
}