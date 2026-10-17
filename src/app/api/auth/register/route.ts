// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/services/auth.service";
import { handleApiError, ValidationError } from "@/lib/errors";
import { z } from "zod";
import { withDb } from "@/lib/api";
import { signJwt } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(11, "Valid phone number is required"), // BD numbers are 11 digits
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z
    .enum(["admin", "moderator", "customer"])
    .optional()
    .default("customer"),
});

export const POST = withDb(async (request: NextRequest) => {
  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      throw new ValidationError(JSON.stringify(errors));
    }

    const { name, phone, email, password, role } = result.data;
    const user = await registerUser({ name, phone, email, password, role });

    const token = await signJwt({
      userId: user._id.toString(),
      email: user.email || user.phone || "",
      role,
    });

    const response = NextResponse.json({ success: true, user });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
});
