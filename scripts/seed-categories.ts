/**
 * Seeds (or updates) the system categories.
 *
 * Idempotent: run this as many times as you want (e.g. after adding a new
 * category to seed-data.ts) — it upserts by `slug`, so existing categories
 * are updated in place instead of duplicated.
 *
 * Usage: npm run seed:categories
 */
import { connectToDatabase } from "@/lib/db/mongoose";
import { CategoryModel } from "@/models/category";
import { SYSTEM_CATEGORIES } from "@/features/categories/seed-data";

async function main() {
  await connectToDatabase();

  let created = 0;
  let updated = 0;

  for (const category of SYSTEM_CATEGORIES) {
    const result = await CategoryModel.findOneAndUpdate(
      { slug: category.slug },
      {
        name: category.name,
        kind: category.kind,
        icon: category.icon,
        suggestedFor: category.suggestedFor,
        isSystem: true,
        workspaceId: null,
      },
      { upsert: true, new: false },
    );

    if (result === null) {
      created += 1;
    } else {
      updated += 1;
    }
  }

  console.log(`✅ System categories seeded: ${created} created, ${updated} updated.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Seeding system categories failed:", error);
  process.exit(1);
});
