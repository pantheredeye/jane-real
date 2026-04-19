import { db } from "@/db";
import { hashPassword } from "@/app/pages/user/password";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npx tsx src/scripts/add-password-to-user.ts <email> <password>");
  process.exit(1);
}

console.log(`Adding password for ${email}...`);

const user = await db.user.findUnique({ where: { email } });

if (!user) {
  throw new Error(`User not found: ${email}`);
}

if (user.passwordHash) {
  console.log(`User ${email} already has a password. Updating...`);
}

const passwordHash = await hashPassword(password);

await db.user.update({
  where: { email },
  data: { passwordHash },
});

console.log(`Password added/updated for ${email}`);
console.log(`They can now login with either password or passkey.`);
