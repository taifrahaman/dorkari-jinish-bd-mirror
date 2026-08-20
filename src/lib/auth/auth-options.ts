// src/lib/auth/auth-options.ts

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models";
import { signJwt } from "@/lib/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        if (!user.email) {
          console.error("Google sign-in: No email provided");
          return false;
        }

        await connectToDatabase();

        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          existingUser = await User.create({
            email: user.email,
            name: user.name || "Google User",
            role: "customer",
            isShadow: true,
            status: "active",
          });
        }

        const token = await signJwt({
          userId: existingUser._id.toString(),
          email: existingUser.email,
          role: existingUser.role,
        });

        // customToken is now recognized on User
        user.customToken = token;
        return true;
      } catch (error) {
        console.error("Google sign-in error:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user && user.customToken) {
        token.customToken = user.customToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.customToken) {
        session.customToken = token.customToken;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/api/auth/callback`;
    },
  },
  pages: {
    signIn: "/",
  },
  debug: process.env.NODE_ENV === "development",
};
