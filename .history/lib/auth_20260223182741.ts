import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!passwordMatch) return null;

        // Block pending/rejected users
        if (user.status === "PENDING")  return { id: user.id, email: user.email, status: "PENDING",  role: user.role, name: user.name ?? user.email };
        if (user.status === "REJECTED") return { id: user.id, email: user.email, status: "REJECTED", role: user.role, name: user.name ?? user.email };

        return {
          id:     user.id,
          email:  user.email,
          name:   user.name ?? user.email,
          role:   user.role,
          status: user.status,
        };
      },
    }),
  ],
  pages:   { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role   = (user as any).role;
        token.id     = user.id;
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role   = token.role;
        (session.user as any).id     = token.id;
        (session.user as any).status = token.status;
      }
      return session;
    },
  },
};