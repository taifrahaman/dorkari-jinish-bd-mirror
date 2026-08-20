// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/api";
import { loginUser } from "@/services/auth.service";
import { BadRequestError } from "@/lib/errors";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const POST = withDb(async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new BadRequestError("Invalid JSON payload");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message).join(", ");
    throw new BadRequestError(errors);
  }

  const { email, password } = parsed.data;

  // loginUser returns { user, token } and throws Error on failure
  const { user, token } = await loginUser(email, password);

  const response = NextResponse.json({ success: true, user }, { status: 200 });

  // Set the cookie using the token from loginUser
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
});
