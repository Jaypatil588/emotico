import { type NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import axios from "axios"
import FormData from "form-data"
import fs from "node:fs"

const STABILITY_KEY = "sk-McnATPzNy8brjdIAmyyXK10NK94j4v39FoAFDSfFekLL06kS"

async function sendGenerationRequest(imagePath: string, params: Record<string, any>) {
  const payload = {
    image: fs.createReadStream(imagePath),
    prompt: params.prompt,
    control_strength: params.control_strength,
    output_format: params.output_format,
    ...(params.negative_prompt && { negative_prompt: params.negative_prompt }),
    ...(params.seed && { seed: params.seed }),
  }

  console.log(`Sending REST request to Stability AI...`)

  const response = await axios.postForm(
    `https://api.stability.ai/v2beta/stable-image/control/structure`,
    axios.toFormData(payload, new FormData()),
    {
      validateStatus: undefined,
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${STABILITY_KEY}`,
        Accept: "image/*",
      },
    },
  )

  if (response.status !== 200) {
    throw new Error(`${response.status}: ${response.data.toString()}`)
  }

  return response
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming JSON data
    const { type, emotion, multiplier, imagePath } = await req.json()

    if (!imagePath) {
      return NextResponse.json({ error: "No image path provided" }, { status: 400 })
    }

    // Validate that the image file exists
    let fullImagePath: string
    try {
      // Handle both absolute and relative paths
      fullImagePath = imagePath.startsWith("/") ? join(process.cwd(), "public", imagePath) : imagePath

      // Check if file exists
      if (!existsSync(fullImagePath)) {
        return NextResponse.json({ error: `Image file not found: ${imagePath}` }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json({ error: `Invalid image path: ${imagePath}` }, { status: 400 })
    }

    // Map your arguments to Stability AI parameters
    const prompt = `${type} with ${emotion} emotion`
    const control_strength = Math.min(Math.max(multiplier, 0), 1) // Clamp between 0 and 1
    const seed = 0
    const output_format = "webp"

    const params = {
      prompt,
      control_strength,
      seed,
      output_format,
      negative_prompt: "", // You can add logic to generate this based on your args
    }

    // Send request to Stability AI using axios
    const response = await sendGenerationRequest(fullImagePath, params)

    // Get response data and headers
    const outputImage = response.data
    const finishReason = response.headers["finish-reason"]
    const responseSeed = response.headers["seed"]

    // Check for NSFW classification
    if (finishReason === "CONTENT_FILTERED") {
      return NextResponse.json({ error: "Generation failed NSFW classifier" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate filename based on your parameters
    const timestamp = Date.now()
    const filename = `${type}_${emotion}_${multiplier}_${timestamp}.${output_format}`
    const filepath = join(uploadsDir, filename)

    // Save the generated image
    await writeFile(filepath, Buffer.from(outputImage))

    console.log(`Saved image ${filename}`)

    // Return JSON response with the image path
    return NextResponse.json({
      imagePath: `/uploads/${filename}`,
      finishReason: finishReason || "",
      seed: responseSeed || "",
      originalArgs: { type, emotion, multiplier, imagePath },
    })
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
