// src/app/api/db-test/route.ts

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({
      status: "ok",
      message: "MongoDB connected successfully",
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to MongoDB",
      },
      { status: 500 },
    );
  }
}
