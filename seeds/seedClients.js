import bcrypt from "bcrypt";
import sql from "../config/dbConfig.js";
import { names } from "./data/names.js";
import { companies } from "./data/companies.js";

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const avatar = (i) => `https://i.pravatar.cc/150?img=${(i % 70) + 1}`;

export async function seedClients(count = 20) {
  console.log(`🌱 Seeding ${count} clients...`);

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash("password123", saltRounds);

  for (let i = 0; i < count; i++) {
    const fullName = random(names);
    const email = `client${i + 1}@example.com`;


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
        'CLIENT',
        ${fullName},
        ${avatar(i)}
      )
      RETURNING id
    `;

    const userId = users[0].id;

    await sql`
      INSERT INTO client_profiles (
        user_id,
        company_name,
        total_spent,
        rating,
        review_count
      )
      VALUES (
        ${userId},
        ${random(companies)},
        ${Math.floor(Math.random() * 50000)},
        ${Number((Math.random() * 2 + 3).toFixed(2))},
        ${Math.floor(Math.random() * 50)}
      )
    `;
  }

  console.log("✅ Clients seeded with profile images");
}