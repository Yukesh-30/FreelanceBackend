import sql from "../config/dbConfig.js"
import cloudinary from "../config/cloudnary.config.js"
import { z } from "zod"
import createTextWatermark from "../helper/WaterMark.js"
import sharp from "sharp"

const submitWork = async (req, res) => {

    const contractId = req.params.contractId
    const { message, waterMarkText } = req.body


    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            message: "No files uploaded"
        })
    }

    try {

        const [submission] = await sql`
            INSERT INTO submissions
            (contract_id,message,status,submitted_at)
            VALUES
            (${contractId},${message},'PENDING_REVIEW',NOW())
            RETURNING *
        `

        const submissionId = submission.id

        const watermark = createTextWatermark(waterMarkText)

        const originalFiles = []
        const watermarkedFiles = []

        for (const file of req.files) {

            const originalUpload = await cloudinary.uploader.upload(file.path, {
                folder: "submission/original",
                resource_type: "auto"
            })

            const originalUrl = originalUpload.secure_url
            originalFiles.push(originalUrl)

            const watermarkedBuffer = await sharp(file.path)
                .composite([
                    {
                        input: watermark,
                        gravity: "center",
                        blend: "over"
                    }
                ])
                .toBuffer()

            const watermarkedUpload = await new Promise((resolve, reject) => {

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "submission/watermarked",
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    }
                )

                stream.end(watermarkedBuffer)

            })

            const watermarkedUrl = watermarkedUpload.secure_url
            watermarkedFiles.push(watermarkedUrl)


        }
        await sql`
                INSERT INTO submissionfiles
                (submission_id,original_url,watermarked_url)
                VALUES
                (${submissionId},${originalFiles},${watermarkedFiles})
        `

        return res.status(201).json({
            message: "Submission uploaded successfully",
            submission_id: submissionId,
            files: originalFiles,
            watermarked_files: watermarkedFiles
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Internal server error"
        })
    }
}
const viewSubmittedWork = async (req, res) => {

    const { contractId } = req.params

    try {

        const submissions = await sql`
            SELECT *
            FROM submissions
            WHERE contract_id=${contractId}
            ORDER BY submitted_at DESC
        `

        const result = []

        for (const submission of submissions) {

            const files = await sql`
                SELECT original_url,watermarked_url
                FROM submissionfiles
                WHERE submission_id=${submission.id}
            `

            if (submission.status === "APPROVED") {

                result.push({
                    submission_id: submission.id,
                    message: submission.message,
                    status: submission.status,
                    files: files.map(file => ({
                        download_url: file.original_url
                    })),
                    submitted_at: submission.submitted_at
                })

            } else {

                result.push({
                    submission_id: submission.id,
                    message: submission.message,
                    status: submission.status,
                    files: files.map(file => ({
                        preview_url: file.watermarked_url
                    })),
                    submitted_at: submission.submitted_at
                })

            }
        }

        return res.status(200).json(result)

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Internal error"
        })
    }
}

const updateStatusForSubmission = async (req, res) => {

    const submissionId = req.params.id
    const { status, feedback } = req.body

    try {

        await sql`
            UPDATE submissions
            SET
            status=${status},
            client_feedback=${feedback},
            reviewed_at=NOW()
            WHERE id=${submissionId}
        `

        return res.status(200).json({
            message: "Submission status updated successfully"
        })

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

const getSingleSubmission = async (req, res) => {

    const { id } = req.params

    try {

        const [submission] = await sql`
            SELECT *
            FROM submissions
            WHERE id=${id}
        `

        const files = await sql`
            SELECT original_url,watermarked_url
            FROM submissionfiles
            WHERE submission_id=${id}
        `

        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            })
        }
        if (submission.status === "APPROVED") {
            return res.status(200).json({
                ...submission,
                files: files.map(file => ({
                    download_url: file.original_url
                }))
            })
        }
        else {
            return res.status(200).json({
                ...submission,
                files: files.map(file => ({
                    preview_url: file.watermarked_url
                }))
            })
        }

    } catch (error) {

        console.error(error)

        return res.status(500).json({
            message: "Internal server error"
        })
    }
}



export { submitWork, viewSubmittedWork, updateStatusForSubmission, getSingleSubmission }