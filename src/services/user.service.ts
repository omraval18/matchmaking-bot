import { db } from "../lib/db/index.js";
import { users } from "../lib/db/schema.js";
import { eq } from "drizzle-orm";

export class UserService {
  static async isAdmin(phone: string): Promise<boolean> {
    try {
      const results = await db
        .select({ isAdmin: users.isAdmin })
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      return results.length > 0 && results[0].isAdmin;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  static async createUser(
    phone: string,
    isAdmin: boolean = false,
  ): Promise<number> {
    const results = await db
      .insert(users)
      .values({
        phone,
        isAdmin,
      })
      .returning();

    return results[0].id;
  }

  static async userExists(phone: string): Promise<boolean> {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    return results.length > 0;
  }

  static async getUserByPhone(phone: string) {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  static async deleteUser(phone: string): Promise<void> {
    await db.delete(users).where(eq(users.phone, phone));
  }
}
