import sql from "../config/dbConfig.js";
import { categories } from "./data/categories.js";
import { skills } from "./data/skills.js";
import { jobTitles } from "./data/titles.js";

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export async function seedJobs(clientIds, count = 300) {
  console.log(`🌱 Seeding ${count} jobs...`);

  const BATCH_SIZE = 10;

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batch = [];

    for (let j = i; j < i + BATCH_SIZE && j < count; j++) {
      const category = random(Object.keys(categories));
      const subcategory = random(categories[category]);

      const budgetMin = randomInt(200, 2000);
      const budgetMax = budgetMin + randomInt(200, 3000);

      const selectedSkills = skills
        .sort(() => 0.5 - Math.random())
        .slice(0, randomInt(2, 5));

      batch.push(
        sql`
          INSERT INTO jobs (
            client_id,
            title,
            description,
            category,
            subcategory,
            skills_required,
            budget_min,
            budget_max,
            job_type,
            experience_level,
            created_at,
            expires_at
          )
          VALUES (
            ${random(clientIds)},
            ${random(jobTitles)},
            ${"Looking for an experienced developer to deliver high-quality work."},
            ${category},
            ${subcategory},
            ${selectedSkills},
            ${budgetMin},
            ${budgetMax},
            ${random(["FIXED", "HOURLY"])},
            ${random(["BEGINNER", "INTERMEDIATE", "EXPERT"])},
            NOW() - (${randomInt(0, 30)} || ' days')::interval,
            NOW() + (${randomInt(7, 30)} || ' days')::interval
          )
        `
      );
    }

    await Promise.all(batch);

    console.log(`✅ Seeded ${Math.min(i + BATCH_SIZE, count)} / ${count} jobs`);
  }

  console.log("🎉 Jobs seeding complete");
}