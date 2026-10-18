// scripts/seed-test-users.ts

import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true });

// Use dynamic imports so env vars are loaded first
async function main() {
  console.log("🌱 Starting seed...");

  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;
  const customerEmail = process.env.TEST_CUSTOMER_EMAIL;
  const customerPassword = process.env.TEST_CUSTOMER_PASSWORD;

  // Fail fast with a clear message if variables are missing
  if (!adminEmail || !adminPassword || !customerEmail || !customerPassword) {
    console.error("❌ Missing TEST_* credentials in .env.test!");
    console.error(
      "Check that TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_CUSTOMER_EMAIL, and TEST_CUSTOMER_PASSWORD are in your .env.test file.",
    );
    process.exit(1);
  }

  const { connectToDatabase } = await import("@/lib/db");
  const { User } = await import("@/models");
  const { hashPassword } = await import("@/lib/auth/auth");

  const mongoose = await connectToDatabase();
  console.log(`🔗 Connected to: ${mongoose.connection.name}`);

  const adminHash = await hashPassword(adminPassword);
  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        email: adminEmail,
        password: adminHash,
        name: "Test Admin",
        role: "admin",
        isShadow: false,
        status: "active",
        deletedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log(`✅ Admin: ${adminEmail}`);

  const customerHash = await hashPassword(customerPassword);
  await User.findOneAndUpdate(
    { email: customerEmail },
    {
      $set: {
        email: customerEmail,
        password: customerHash,
        name: "Test Customer",
        role: "customer",
        isShadow: false,
        status: "active",
        deletedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log(`✅ Customer: ${customerEmail}`);

  console.log("✨ Seed complete.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
