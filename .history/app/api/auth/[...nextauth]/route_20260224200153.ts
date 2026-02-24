import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text"     },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!passwordMatch) return null;

        if (user.status === "PENDING") return {
          id:     user.id,
          email:  user.email,
          name:   user.name ?? user.username,
          status: "PENDING",
          role:   user.role,
        };

        if (user.status === "REJECTED") return {
          id:     user.id,
          email:  user.email,
          name:   user.name ?? user.username,
          status: "REJECTED",
          role:   user.role,
        };

        return {
          id:     user.id,
          email:  user.email,
          name:   user.name ?? user.username,
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };