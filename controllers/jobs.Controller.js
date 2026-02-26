import { is } from "zod/locales";
import sql from "../db/dbConfig.js";
import { z } from "zod";


export const createJobSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),

  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  skills_required: z.array(z.string()).optional(),

  budget_min: z.number().positive().optional(),
  budget_max: z.number().positive().optional(),

  job_type: z.enum(["FIXED", "HOURLY"]).optional(),
  experience_level: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERT"]).optional(),

  deadline: z.coerce.date().optional(),
  expires_at: z.coerce.date().optional()
});

export const updateJobSchema = createJobSchema.partial();


export const createJob = async (req, res) => {
  const validation = createJobSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: validation.error.flatten()
    });
  }

  const {
    title,
    description,
    category,
    subcategory,
    skills_required,
    budget_min,
    budget_max,
    job_type,
    experience_level,
    deadline,
    expires_at
  } = validation.data;

  try {
    const result = await sql`
      INSERT INTO jobs (
        client_id, title, description,
        category, subcategory, skills_required,
        budget_min, budget_max,
        job_type, experience_level,
        deadline, expires_at
      )
      VALUES (
        ${req.user.id},
        ${title},
        ${description},
        ${category},
        ${subcategory},
        ${skills_required},
        ${budget_min},
        ${budget_max},
        ${job_type},
        ${experience_level},
        ${deadline},
        ${expires_at}
      )
      RETURNING *;
    `;

    return res.status(201).json(result[0]);
  } catch (err) {
    console.error("CREATE JOB ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getJobs = async (req, res) => {
  const { category, job_type, experience_level } = req.query;

  try {
    let query = sql`
      SELECT *
      FROM jobs
      WHERE status = 'OPEN'
    `;

    if (category) {
      query = sql`${query} AND category = ${category}`;
    }

    if (job_type) {
      query = sql`${query} AND job_type = ${job_type}`;
    }

    if (experience_level) {
      query = sql`${query} AND experience_level = ${experience_level}`;
    }

    query = sql`${query} ORDER BY created_at DESC`;

    const result = await query;

    return res.status(200).json(result);
  } catch (err) {
    console.error("GET JOBS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    const result = await sql`
      SELECT *
      FROM jobs
      WHERE client_id = ${req.user.id}
      ORDER BY created_at DESC;
    `;

    return res.status(200).json(result);
  } catch (err) {
    console.error("GET MY JOBS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getJobById = async (req, res) => {
  try {
    const result = await sql`
      SELECT *
      FROM jobs
      WHERE id = ${req.params.id};
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json(result[0]);
  } catch (err) {
    console.error("GET JOB BY ID ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateJob = async (req, res) => {
  const validation = updateJobSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      errors: validation.error.flatten()
    });
  }

  const data = validation.data;

  try {
    const result = await sql`
      UPDATE jobs SET
        title = COALESCE(${data.title}, title),
        description = COALESCE(${data.description}, description),
        category = COALESCE(${data.category}, category),
        subcategory = COALESCE(${data.subcategory}, subcategory),
        skills_required = COALESCE(${data.skills_required}, skills_required),
        budget_min = COALESCE(${data.budget_min}, budget_min),
        budget_max = COALESCE(${data.budget_max}, budget_max),
        job_type = COALESCE(${data.job_type}, job_type),
        experience_level = COALESCE(${data.experience_level}, experience_level),
        deadline = COALESCE(${data.deadline}, deadline),
        expires_at = COALESCE(${data.expires_at}, expires_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id}
        AND client_id = ${req.user.id}
      RETURNING *;
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Job not found or unauthorized"
      });
    }

    return res.status(200).json(result[0]);
  } catch (err) {
    console.error("UPDATE JOB ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const deleteJob = async (req, res) => {
  try {
    const result = await sql`
      DELETE FROM jobs
      WHERE id = ${req.params.id}
        AND client_id = ${req.user.id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Job not found or unauthorized"
      });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("DELETE JOB ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};