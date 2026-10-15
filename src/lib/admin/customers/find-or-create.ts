// src/lib/admin/customers/find-or-create.ts

import mongoose from "mongoose";
import User, { type IUser, type CustomerSource } from "@/models/User.model";
import { normalizePhone } from "@/lib/admin/phone";

/* ============================================================
 * Find-or-create helper
 *
 * Matching priority:
 *   1. Phone (normalized) — most reliable in BD
 *   2. Email
 *   3. Create a new shadow customer
 *
 * Never modifies an existing customer's data — just returns it.
 * Never matches by name alone (too ambiguous).
 * ============================================================ */

export type FindOrCreateCustomerInput = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  source: CustomerSource;
  createdBy?: string;
};

export type FindOrCreateCustomerResult = {
  user: IUser;
  created: boolean;
};

export async function findOrCreateCustomer(
  input: FindOrCreateCustomerInput,
): Promise<FindOrCreateCustomerResult> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Customer name is required");
  }

  const phoneRaw = input.phone?.trim() || undefined;
  const phoneNorm = phoneRaw
    ? normalizePhone(phoneRaw) || undefined
    : undefined;
  const email = input.email?.trim().toLowerCase() || undefined;

  /* ----- 1. Match by phone ----- */

  if (phoneNorm) {
    const existing = await User.findOne({
      phoneNormalized: phoneNorm,
      deletedAt: null,
    });
    if (existing) return { user: existing, created: false };
  }

  /* ----- 2. Match by email ----- */

  if (email) {
    const existing = await User.findOne({
      email,
      deletedAt: null,
    });
    if (existing) return { user: existing, created: false };
  }

  /* ----- 3. Create a new shadow customer ----- */

  const createdByOid =
    input.createdBy && mongoose.Types.ObjectId.isValid(input.createdBy)
      ? new mongoose.Types.ObjectId(input.createdBy)
      : undefined;

  const doc = await User.create({
    name,
    email,
    phone: phoneRaw,
    address: input.address?.trim() || undefined,
    role: "customer",
    isShadow: true,
    source: input.source,
    createdBy: createdByOid,
    tags: [],
    status: "active",
  });

  return { user: doc, created: true };
}

/* ============================================================
 * Channel → source mapping
 *
 * When an order comes in on a channel, the customer's "first
 * touch" source should reflect where we first met them. We map
 * the order channel to a customer source.
 * ============================================================ */

export function channelToSource(
  channel: "online" | "pos" | "walk-in" | "phone" | "facebook" | "whatsapp",
): CustomerSource {
  switch (channel) {
    case "pos":
    case "walk-in":
      return "walk-in";
    case "phone":
      return "phone";
    case "facebook":
      return "facebook";
    case "whatsapp":
      return "whatsapp";
    case "online":
    default:
      return "online";
  }
}
