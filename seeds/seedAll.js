import { seedClients } from "./seedClients.js";
import { seedFreelancers } from "./seedFreelancers.js";
import { seedJobs } from "./seedJobs.js";
import { seedGigs } from "./seedGigs.js";
import sql from "../config/dbConfig.js";

async function seed() {
  await seedClients(20);
  await seedFreelancers(30);

  const clients = await sql`SELECT id FROM users WHERE role = 'CLIENT'`;
  const freelancers = await sql`SELECT id FROM users WHERE role = 'FREELANCER'`;

  await seedJobs(clients.map(c => c.id), 300);
  await seedGigs(freelancers.map(f => f.id), 300);

  console.log("🎉 ALL SEEDING COMPLETE");
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});