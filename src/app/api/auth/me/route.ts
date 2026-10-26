// src/app/api/auth/me/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { withAuth } from "@/middlewares/auth";

export const GET = withDb(async (request: NextRequest) => {
  try {
    const { user } = await withAuth(request, { checkIp: false });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not logged in" },
        { status: 401 },
      );
    }

    // Return the addresses and wishlist now
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      canCreateProduct: user.role === "admin" || user.canCreateProduct,
      addresses: user.addresses || [],
      wishlist: user.wishlist || [],
    };
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err) {
    return handleApiError(err);
  }
});
