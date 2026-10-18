// scripts/create-admin.ts

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

import { input, password as passwordPrompt, confirm } from "@inquirer/prompts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AdminDetails = { email: string; name: string; password: string };

async function askAdminDetails(): Promise<AdminDetails> {
  const email = await input({
    message: "Admin email:",
    validate: (v) => EMAIL_RE.test(v.trim()) || "Enter a valid email",
  });

  const name = await input({
    message: "Admin name:",
    default: "Admin",
  });

  const password = await passwordPrompt({
    message: "Admin password (min 8 chars):",
    mask: "*",
    validate: (v) => v.length >= 8 || "Password must be at least 8 characters",
  });

  const confirmPassword = await passwordPrompt({
    message: "Confirm password:",
    mask: "*",
  });

  if (password !== confirmPassword) {
    console.error("\n✖ Passwords do not match.");
    process.exit(1);
  }

  return { email: email.trim().toLowerCase(), name: name.trim(), password };
}

async function upsertAdmin(details: AdminDetails) {
  // Dynamic imports so env is loaded before these modules read process.env
  const { connectToDatabase } = await import("@/lib/db");
  const { User } = await import("@/models");
  const { hashPassword } = await import("@/lib/auth");

  const { email, name, password } = details;

  await connectToDatabase();

  const hashed = await hashPassword(password);
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`\n⚠  A user already exists with email: ${email}`);
    console.log(`   Current role: ${existing.role}`);

    const ok = await confirm({
      message: `Promote this user to admin and reset their password?`,
      default: false,
    });

    if (!ok) {
      console.log("Aborted — no changes made.");
      process.exit(0);
    }

    existing.role = "admin";
    existing.password = hashed;
    existing.status = "active";
    existing.isShadow = false;
    if (!existing.name) existing.name = name;
    await existing.save();

    console.log(`✔ Promoted to admin: ${email}`);
    return;
  }

  await User.create({
    email,
    name,
    password: hashed,
    role: "admin",
    isShadow: false,
    status: "active",
  });

  console.log(`✔ Admin created: ${email}`);
}

async function main() {
  console.log("\n── Create / Promote Admin ──\n");
  const details = await askAdminDetails();
  await upsertAdmin(details);
  process.exit(0);
}

main().catch((err) => {
  if (err?.name === "ExitPromptError") {
    console.log("\nCancelled.");
    process.exit(0);
  }
  console.error("\n✖ Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
