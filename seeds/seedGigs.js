import sql from "../config/dbConfig.js";
import { categories } from "./data/categories.js";
import { skills } from "./data/skills.js";
import { gigTitles } from "./data/titles.js";

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const gigCover = (seed) =>
  `https://picsum.photos/seed/${seed}/600/400`;

export async function seedGigs(freelancerIds, count = 300) {
  console.log(`🌱 Seeding ${count} gigs...`);

  const BATCH_SIZE = 10;

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batch = [];

    for (let j = i; j < i + BATCH_SIZE && j < count; j++) {
      const category = random(Object.keys(categories));
      const subcategory = random(categories[category]);

      batch.push(
        sql`
          INSERT INTO gigs (
            freelancer_id,
            title,
            description,
            category,
            subcategory,
            tags,
            price,
            delivery_days,
            cover_image_url,
            is_active
          )
          VALUES (
            ${random(freelancerIds)},
            ${random(gigTitles)},
            ${"Professional service with guaranteed satisfaction."},
            ${category},
            ${subcategory},
            ${skills.sort(() => 0.5 - Math.random()).slice(0, 4)},
            ${randomInt(50, 500)},
            ${randomInt(1, 14)},
            ${gigCover(`gig-${j}`)},
            true
          )
        `
      );
    }

    await Promise.all(batch);

    console.log(`✅ Seeded ${Math.min(i + BATCH_SIZE, count)} / ${count} gigs`);
  }

  console.log("🎉 Gigs seeding complete");
}