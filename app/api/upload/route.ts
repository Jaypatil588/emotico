import { type NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get("image") as File | null

    if (!image) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Always save as image.jpeg (replacing previous uploads)
    const filepath = join(uploadsDir, "image.jpeg")

    // Convert image to buffer and save
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filepath, buffer)

    console.log("Image saved to:", filepath)

    return NextResponse.json({
      imagePath: "/uploads/image.jpeg",
      message: "Image uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
