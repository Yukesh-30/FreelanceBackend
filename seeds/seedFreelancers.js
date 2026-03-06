import bcrypt from "bcrypt";
import sql from "../config/dbConfig.js";
import { names } from "./data/names.js";

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const avatar = (i) => `https://i.pravatar.cc/150?img=${(i % 70) + 1}`;

export async function seedFreelancers(count = 30) {
  console.log(`🌱 Seeding ${count} freelancers...`);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash("password123", saltRounds);

  for (let i = 0; i < count; i++) {
    const fullName = random(names);
    const email = `freelancer${i + 1}@example.com`;

    const users = await sql`
      INSERT INTO users (
        email,
        password_hash,
        role,
        full_name,
        profile_pic_url
      )
      VALUES (
        ${email},
        ${passwordHash},
        'FREELANCER',
        ${fullName},
        ${avatar(i + 30)}
      )
      RETURNING id
    `;

    const userId = users[0].id;

    await sql`
      INSERT INTO freelancer_profiles (
        user_id,
        bio,
        skills,
        hourly_rate,
        total_earnings,
        rating,
        review_count
      )
      VALUES (
        ${userId},
        ${"Experienced freelancer delivering high-quality work."},
        ${["JavaScript", "React", "Node.js", "PostgreSQL"]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)},
        ${Math.floor(Math.random() * 100) + 20},
        ${Math.floor(Math.random() * 100000)},
        ${Number((Math.random() * 2 + 3).toFixed(2))},
        ${Math.floor(Math.random() * 100)}
      )
    `;
  }

  console.log("✅ Freelancers seeded with profile images");
}