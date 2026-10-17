// src/app/api/auth/wishlist/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import mongoose from "mongoose"; // <-- Added mongoose import
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { withAuth } from "@/middlewares/auth";
import { User } from "@/models";

const wishlistSchema = z.object({
  productId: z.string().min(1),
});

export const POST = withDb(async (request: NextRequest) => {
  try {
    const { user } = await withAuth(request, { checkIp: false });
    if (!user) throw new BadRequestError("Not logged in");

    const body = await request.json();
    const { productId } = wishlistSchema.parse(body);

    // Validate that the productId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new BadRequestError("Invalid product ID");
    }

    const dbUser = await User.findById(user._id);
    if (!dbUser) throw new BadRequestError("User not found");

    // Ensure wishlist is an array
    if (!dbUser.wishlist) dbUser.wishlist = [];

    // Check if product is already in wishlist
    const index = dbUser.wishlist.findIndex(
      (id) => id.toString() === productId,
    );

    if (index > -1) {
      // Remove it
      dbUser.wishlist.splice(index, 1);
    } else {
      // Add it (Properly typed as ObjectId, no more `any`)
      dbUser.wishlist.push(new mongoose.Types.ObjectId(productId));
    }

    await dbUser.save();

    // Return the updated wishlist string array
    const wishlistStrings = dbUser.wishlist.map((id) => id.toString());

    return NextResponse.json({ success: true, wishlist: wishlistStrings });
  } catch (err) {
    return handleApiError(err);
  }
});
