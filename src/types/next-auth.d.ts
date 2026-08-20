// src/types/next-auth.d.ts

import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    customToken?: string;
  }
  interface User {
    customToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    customToken?: string;
  }
}
