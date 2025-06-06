"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Download, Loader2 } from "lucide-react"

// Your processImageWithGemini function
export const processImageWithGemini = async (args: {
  type: string
  emotion: string
  multiplier: number
  imagePath: string
}) => {
  const response = await fetch("/api/generate-structure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to process image")
  }

  const data = await response.json()
  return data.imagePath
}

export default function StructureDemoPage() {
  const [type, setType] = useState("portrait")
  const [emotion, setEmotion] = useState("happy")
  const [multiplier, setMultiplier] = useState([0.6])
  const [imagePath, setImagePath] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview URL for original image
      const url = URL.createObjectURL(file)
      setOriginalImageUrl(url)

      // For demo purposes, we'll simulate uploading to a path
      // In a real app, you'd upload the file to your server first
      const uploadedPath = `/uploads/temp_${Date.now()}_${file.name}`
      setImagePath(uploadedPath)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imagePath) return

    setIsLoading(true)
    setResultImage(null)

    try {
      const args = {
        type,
        emotion,
        multiplier: multiplier[0],
        imagePath,
      }

      const resultPath = await processImageWithGemini(args)
      setResultImage(resultPath)
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadImage = () => {
    if (resultImage) {
      const a = document.createElement("a")
      a.href = resultImage
      a.download = `${type}_${emotion}_result.webp`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Stability AI Structure Control</h1>
        <p className="text-muted-foreground">Transform images with type and emotion using your custom API</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Configure the generation parameters using your API structure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="image">Source Image</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageUpload} required />
                {imagePath && <p className="text-sm text-muted-foreground mt-1">Path: {imagePath}</p>}
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="emotion">Emotion</Label>
                <Select value={emotion} onValueChange={setEmotion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="sad">Sad</SelectItem>
                    <SelectItem value="angry">Angry</SelectItem>
                    <SelectItem value="peaceful">Peaceful</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="mysterious">Mysterious</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Multiplier (Control Strength): {multiplier[0]}</Label>
                <Slider value={multiplier} onValueChange={setMultiplier} max={1} min={0} step={0.1} className="mt-2" />
              </div>

              <div>
                <Label htmlFor="imagePath">Image Path (for testing)</Label>
                <Input
                  id="imagePath"
                  value={imagePath}
                  onChange={(e) => setImagePath(e.target.value)}
                  placeholder="/path/to/your/image.jpg"
                />
              </div>

              <Button type="submit" disabled={!imagePath || isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process Image
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Original image and generated result</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {originalImageUrl && (
                <div>
                  <h3 className="font-medium mb-2">Original Image:</h3>
                  <img
                    src={originalImageUrl || "/placeholder.svg"}
                    alt="Original"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}

              {resultImage && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Generated Result:</h3>
                    <Button onClick={downloadImage} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <img
                    src={resultImage || "/placeholder.svg"}
                    alt="Generated result"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}

              {!originalImageUrl && !resultImage && (
                <div className="text-center text-muted-foreground py-8">Upload an image to see the results here</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
