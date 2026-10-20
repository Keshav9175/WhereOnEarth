import mongoose from "mongoose";
import { connectToDatabase } from "@/server/db";
import { LocationModel } from "@/server/models/Location";
import { SEED_LOCATIONS } from "./locations-data";

async function main() {
  await connectToDatabase();

  // Safe to run again: only seed when the collection is empty.
  const existing = await LocationModel.countDocuments();
  if (existing > 0) {
    console.log(`Skipped: the locations collection already has ${existing} documents.`);
    return;
  }

  const created = await LocationModel.insertMany(SEED_LOCATIONS);
  console.log(`Seeded ${created.length} locations.`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
