import sql from "../db/dbConfig.js";
import { z } from "zod";


export const createClientProfileSchema = z.object({
  company_name: z.string().max(100).min(1).optional()
});

export const updateClientProfileSchema = createClientProfileSchema.partial();


export const createClientProfile = async (req, res) => {
  const validation = createClientProfileSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: validation.error.flatten()
    });
  }

  const { company_name } = validation.data;

  try {
    const result = await sql`
      INSERT INTO client_profiles (user_id, company_name)
      VALUES (${req.user.id}, ${company_name})
      RETURNING *;
    `;

    return res.status(201).json(result[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        message: "Client profile already exists"
      });
    }

    console.error("CREATE CLIENT PROFILE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getMyClientProfile = async (req, res) => {
  try {
    const result = await sql`
      SELECT
        cp.*,
        u.full_name,
        u.email
      FROM client_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.user_id = ${req.user.id};
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Client profile not found"
      });
    }

    return res.status(200).json(result[0]);
  } catch (err) {
    console.error("GET MY CLIENT PROFILE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const updateClientProfile = async (req, res) => {
  const validation = updateClientProfileSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: validation.error.flatten()
    });
  }

  const { company_name } = validation.data;

  try {
    const result = await sql`
      UPDATE client_profiles
      SET company_name = COALESCE(${company_name}, company_name)
      WHERE user_id = ${req.user.id}
      RETURNING *;
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Client profile not found"
      });
    }

    return res.status(200).json(result[0]);
  } catch (err) {
    console.error("UPDATE CLIENT PROFILE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getClientProfileByUserId = async (req, res) => {
  const  userId  = req.params.id;

  console.log(userId);

  try {
    const result = await sql`
      SELECT
        user_id,
        company_name,
        rating,
        review_count,
        total_spent
      FROM client_profiles
      WHERE user_id = ${userId};
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Client profile not found"
      });
    }

    return res.status(200).json(result[0]);
  } catch (err) {
    console.error("GET CLIENT PROFILE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};