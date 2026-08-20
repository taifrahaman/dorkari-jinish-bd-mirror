// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/services/auth.service";
import { handleApiError, ValidationError } from "@/lib/errors";
import { z } from "zod";
import { withDb } from "@/lib/api";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
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
      // Return all validation errors as a list
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      throw new ValidationError(JSON.stringify(errors));
    }

    const { name, email, password, role } = result.data;
    const user = await registerUser({ name, email, password, role });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleApiError(error);
  }
});
