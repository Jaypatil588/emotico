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

function getEmotionPrompt(emotion: string, multiplier: number) {
  let prompt = "";

  switch (emotion.toLowerCase()) {
    case "happy":
      prompt = `
        Do not change the subject (if there are people or objects, do not change them), keep the generated environment relatively similar
        Transform the image to reflect a happy emotional state. 
        Apply warm lighting and a subtle golden hue. 
        Brighten the scene moderately. Slightly increase color saturation to enhance vividness.
        Use a wide-angle composition to suggest openness and joy.
        ${multiplier === 2 ? `
          Boost brightness further to make the environment feel sunlit and radiant. 
          Increase saturation for lush greens, vibrant skies, and lively hues. 
          Add gentle sunlight streaks or warm glow to simulate an emotionally uplifting day.
        ` : ""}
        ${multiplier === 3 ? `
          Make the scene feel euphoric and magical. 
          Extreme brightness and saturation (without overexposure), golden-hour lighting, sunbeams through trees, flowers blooming in vivid color. 
          Everything should radiate warmth and beauty — the most joyful place imaginable, while staying photorealistic.
        ` : ""}
      `;
      break;

    case "sad":
      prompt = `
        Do not change the subject (if there are people or objects, do not change them), keep the generated environment relatively similar
        Modify the image to reflect a sad emotional state. 
        Lower brightness slightly, desaturate colors toward blue-grey. 
        Soften contrast and apply a narrow framing to simulate isolation. 
        Add very subtle vignetting around edges.
        ${multiplier === 2 ? `
          Add overcast skies or a light drizzle. 
          Further desaturate, deepen the blue-gray cast, and introduce a faint haze or soft fog. 
          Backgrounds blur slightly to mimic detachment or daydream-like perception.
        ` : ""}
        ${multiplier === 3 ? `
          Drastically reduce brightness. 
          Heavily desaturate — nearly monochrome blues and greys. 
          Simulate emotional numbness with soft rain, thick fog, or a cold, damp atmosphere. 
          Shadows deepen, edges fade — everything feels distant and emotionally heavy, yet still natural.
        ` : ""}
      `;
      break;

    case "angry":
      prompt = `
        Do not change the subject (if there are people or objects, do not change them), keep the generated environment relatively similar
        Alter the image to convey anger. 
        Slightly darken the scene, increase contrast and sharpen details. 
        Add warm tones (red-orange tint) and a tighter crop to simulate focused aggression.
        ${multiplier === 2 ? `
          Intensify shadows and highlights to create dramatic contrast. 
          Deepen reds/oranges in the environment — like a burning sky or rust-colored haze. 
          Add subtle heat distortions, dry terrain textures, or stormy clouds to heighten visual tension.
        ` : ""}
        ${multiplier === 3 ? `
          The scene becomes raw and volatile. 
          Overcast with red-tinged clouds, strong shadows, and almost cinematic lighting. 
          Stark contrast between light and dark; central elements are hyper-crisp. 
          Simulate a world on edge — scorching light, cracked ground, or turbulent skies — while staying in realism.
        ` : ""}
      `;
      break;

    case "afraid":
      prompt = `
        Do not change the subject (if there are people or objects, do not change them), keep the generated environment relatively similar
        Transform the image to reflect fear. 
        Slightly dim lighting, apply a cool blue-green tint. 
        Enhance central contrast and subtly widen the field of view to mimic vigilance.
        ${multiplier === 2 ? `
          Increase peripheral shadows, blur background edges slightly. 
          Add creeping fog or faint mist in the distance. 
          Cold lighting and long shadows create tension. 
          The scene should feel watchful, like something is hiding nearby.
        ` : ""}
        ${multiplier === 3 ? `
          Push the scene into high suspense: very low ambient light, deep shadows, and eerie, unnatural cold tints (blue-violet or greenish). 
          Add thick fog or heavy atmospheric effects. 
          Focal points are razor-sharp while the background is drowned in darkness. 
          Simulate a world where danger feels imminent — like a horror movie still, but still grounded in photorealism.
        ` : ""}
      `;
      break;

    default:
      prompt = "Keep the image neutral with no emotional filtering or changes.";
  }

  return prompt.trim().replace(/\s+/g, ' ');
}

function getFacesPrompt(emotion: string, multiplier: number) {
  let basePrompt = `
    This image is based on a REFERENCE PHOTO OF OLIVIA RODRIGO. 
    PRESERVE HER IDENTITY — same bone structure, eyes, nose, lips, skin tone, and hair. 
    Do NOT change her ethnicity, age, or facial proportions.
    KEEP HER ETHINICITY, AGE AND FACIAL PROPORTIONS CONSTANT.
    Only modify the EMOTION and facial EXPRESSION according to the following instructions. 
    Use PHOTO-REALISTIC style. Lighting and emotion may change, but THE FACE MUST REMAIN THE SAME PERSON.
  `;

  let emotionDetails = "";

  switch (emotion.toLowerCase()) {
    case "happy":
      emotionDetails = `
        Make her look slightly more pleasant and approachable: 
        gentle upward mouth corners, warm eye reflections, soft lighting.
        ${multiplier >= 2 ? `
          Add visible smile lines, slight blush on cheeks, and crow’s feet near eyes.
        ` : ""}
        ${multiplier === 3 ? `
          Full joyful appearance: cheeks raised, bright warm lighting, radiant and natural expression.
        ` : ""}
      `;
      break;

    case "sad":
      emotionDetails = `
        Introduce subtle sadness cues: slightly drooping mouth, cool lighting, softened gaze.
        ${multiplier >= 2 ? `
          Add signs of tiredness: under-eye shadows, desaturated tone, gentle frown.
        ` : ""}
        ${multiplier === 3 ? `
          Intensify the emotional weight: eyes downcast, cheeks hollowed, monochromatic tones.
        ` : ""}
      `;
      break;

    case "angry":
      emotionDetails = `
        Add mild tension to her face: furrowed brows, narrowed eyes, tighter mouth.
        ${multiplier >= 2 ? `
          Emphasize tension: deeper frown lines, harsh side lighting, flushed skin tone.
        ` : ""}
        ${multiplier === 3 ? `
          Strong anger expression: intense glare, jaw clenched, aggressive lighting contrast.
        ` : ""}
      `;
      break;

    case "afraid":
      emotionDetails = `
        Reflect subtle fear: widened eyes, slight tension in face, cooler lighting.
        ${multiplier >= 2 ? `
          Uneasy appearance: clammy look, asymmetrical lighting, increased eye white visibility.
        ` : ""}
        ${multiplier === 3 ? `
          Intense fear perception: pale skin, sharp shadows, eye sockets more sunken.
        ` : ""}
      `;
      break;

    default:
      emotionDetails = "Keep her expression neutral, no emotional influence applied.";
  }

  return (basePrompt + emotionDetails)
    .trim()
    .replace(/\s+/g, ' ');
}


export async function POST(req: NextRequest) {
  try {
    // Parse the incoming JSON data
    var { type, emotion, multiplier, imagePath } = await req.json()
    console.log({ type, emotion, multiplier, imagePath })

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

    if (type='Scenery') {
      // Map your arguments to Stability AI parameters
    const prompt = getEmotionPrompt(emotion, multiplier) //add prompting here
    const control_strength = 0.95
    const seed = 0
    const output_format = "jpeg"

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

    // Create generations directory if it doesn't exist
    const generationsDir = join(process.cwd(), "public", "generations")
    if (!existsSync(generationsDir)) {
      await mkdir(generationsDir, { recursive: true })
    }

    // Generate filename based on your parameters
    const timestamp = Date.now()
    const filename = `${type}_${emotion}_${multiplier}_${timestamp}.${output_format}`
    const filepath = join(generationsDir, filename)

    // Save the generated image
    await writeFile(filepath, Buffer.from(outputImage))

    console.log(`Saved image ${filename}`)

    // Return JSON response with the image path
    return NextResponse.json({
      imagePath: `/generations/${filename}`,
      finishReason: finishReason || "",
      seed: responseSeed || "",
      originalArgs: { type, emotion, multiplier, imagePath },
    })
    }

    if (type='Faces') {
       // Map your arguments to Stability AI parameters
    const prompt = getFacesPrompt(emotion, multiplier) //add prompting here
    const control_strength = 1
    const seed = 0.2
    const output_format = "jpeg"

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

    // Create generations directory if it doesn't exist
    const generationsDir = join(process.cwd(), "public", "generations")
    if (!existsSync(generationsDir)) {
      await mkdir(generationsDir, { recursive: true })
    }

    // Generate filename based on your parameters
    const timestamp = Date.now()
    const filename = `${type}_${emotion}_${multiplier}_${timestamp}.${output_format}`
    const filepath = join(generationsDir, filename)

    // Save the generated image
    await writeFile(filepath, Buffer.from(outputImage))

    console.log(`Saved image ${filename}`)

    // Return JSON response with the image path
    return NextResponse.json({
      imagePath: `/generations/${filename}`,
      finishReason: finishReason || "",
      seed: responseSeed || "",
      originalArgs: { type, emotion, multiplier, imagePath },
    })
    }
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
