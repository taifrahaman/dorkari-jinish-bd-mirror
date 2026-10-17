// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/api";
import { loginUser } from "@/services/auth.service";
import { BadRequestError } from "@/lib/errors";

const loginSchema = z.object({
  identifier: z.string().min(1, "Phone or Email is required"),
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

  const { identifier, password } = parsed.data;
  const { user, token } = await loginUser(identifier, password);

  const response = NextResponse.json({ success: true, user }, { status: 200 });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
});
