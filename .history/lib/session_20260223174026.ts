import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireSuperuser() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if ((session.user as any).role !== "SUPERUSER") throw new Error("Forbidden");
  return session;
}

export function isSuperuser(session: any) {
  return session?.user?.role === "SUPERUSER";
}