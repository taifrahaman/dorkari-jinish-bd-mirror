// src/app/api/guest/token/route.ts

import { NextResponse } from "next/server";
import { withDb } from "@/lib/api";
import { generateGuestToken } from "@/services/auth.service";

export const POST = withDb(async () => {
  const token = generateGuestToken();

  const response = NextResponse.json(
    { success: true, guestToken: token },
    { status: 200 },
  );

  response.cookies.set("guest_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
});

// Also allow GET for simplicity (some clients may want to fetch token)
export const GET = withDb(async () => {
  const token = generateGuestToken();

  const response = NextResponse.json(
    { success: true, guestToken: token },
    { status: 200 },
  );

  response.cookies.set("guest_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
});
