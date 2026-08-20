// src/app/api/auth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.customToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const token = session.customToken;

    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
