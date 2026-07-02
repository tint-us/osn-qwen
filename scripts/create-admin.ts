// ============================================================
// SoaLatihan — Create Admin User via CLI
// ============================================================
// Usage:
//   npx tsx scripts/create-admin.ts \
//     --username admin \
//     --password secret123 \
//     --name "Admin Utama" \
//     --email admin@example.com     (optional)
//
// Or run interactively (omit args to be prompted):
//   npx tsx scripts/create-admin.ts
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const prisma = new PrismaClient();
const BCRYPT_SALT_ROUNDS = 10;

interface Args {
  username?: string;
  email?: string;
  name?: string;
  password?: string;
}

function parseArgs(): Args {
  const args: Args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "") as keyof Args;
    const val = argv[i + 1];
    if (key && val && !val.startsWith("--")) {
      (args as Record<string, string>)[key] = val;
      i++;
    }
  }

  return args;
}

function ask(question: string, fallback?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const suffix = fallback ? ` (${fallback})` : "";
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || fallback || "");
    });
  });
}

async function askPassword(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const question = "Password: ";
    process.stdout.write(question);

    const onData = (char: Buffer) => {
      const c = char.toString();
      if (c === "\r" || c === "\n") {
        process.stdin.removeListener("data", onData);
      } else {
        process.stdout.write("\b \b");
      }
    };

    process.stdin.on("data", onData);

    rl.question("", (answer) => {
      rl.close();
      process.stdin.removeListener("data", onData);
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("\n=== SoaLatihan — Create Admin User ===\n");

  const args = parseArgs();

  const username = args.username || (await ask("Username (required)"));
  if (!username) {
    console.error("❌ Username is required.");
    process.exit(1);
  }

  const password = args.password || (await askPassword());
  if (!password) {
    console.error("❌ Password is required.");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ Password must be at least 6 characters.");
    process.exit(1);
  }

  const name = args.name || (await ask("Name", "Administrator"));
  const email = args.email || (await ask("Email (optional, press Enter to skip)")) || undefined;

  // Check username uniqueness
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (existing) {
    console.error(`❌ Username "${username}" is already taken.`);
    process.exit(1);
  }

  // Check email uniqueness if provided
  if (email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      console.error(`❌ Email "${email}" is already registered.`);
      process.exit(1);
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      name: name || "Administrator",
      username,
      email: email || null,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  console.log("\n✅ Admin user created successfully!\n");
  console.log(`   ID        : ${user.id}`);
  console.log(`   Name      : ${user.name}`);
  console.log(`   Username  : ${user.username}`);
  console.log(`   Email     : ${user.email || "—"}`);
  console.log(`   Role      : ${user.role}`);
  console.log(`   Active    : ${user.isActive}`);
  console.log("");
}

main()
  .catch((err) => {
    console.error("❌ Failed to create admin user:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
