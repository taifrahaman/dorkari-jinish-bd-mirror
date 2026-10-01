// src/app/api/admin/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { withDb } from "@/lib/api";
import { getClientIp } from "@/lib/api/request";
import { BadRequestError } from "@/lib/errors";
import { rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { loginAdmin } from "@/services/auth.service";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export const POST = withDb(async (req: NextRequest) => {
  const ip = getClientIp(req) ?? "unknown";
  const key = `admin-login:${ip}`;

  // Rate limit before parsing — cheaper reject
  const { allowed, retryAfterMs } = rateLimit(key, {
    max: MAX_ATTEMPTS,
    windowMs: WINDOW_MS,
  });

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: { message: "Too many attempts" } },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new BadRequestError("Invalid JSON payload");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    // Generic — don't reveal which field failed
    throw new BadRequestError("Invalid credentials");
  }

  const { email, password } = parsed.data;

  let result;
  try {
    result = await loginAdmin(email, password);
  } catch {
    // Same 401 for wrong password, unknown email, and disabled account
    throw new BadRequestError("Invalid credentials");
  }

  // Success — clear the counter so a fumbling admin isn't penalized
  resetRateLimit(key);

  const res = NextResponse.json(
    { success: true, user: result.user },
    { status: 200 },
  );

  res.cookies.set("token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
});
