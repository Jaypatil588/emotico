"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Upload, ImageIcon, Sparkles, Zap, Heart, Frown, Flame, AlertTriangle, Camera, Wand2 } from "lucide-react"

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [type, setType] = useState<"Scenery" | "Faces">("Scenery")
  const [emotion, setEmotion] = useState<"happy" | "sad" | "angry" | "afraid">("happy")
  const [multiplier, setMultiplier] = useState<number>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      try {
        // Upload the file to the server first
        const formData = new FormData()
        formData.append("image", file)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image")
        }

        const uploadData = await uploadResponse.json()

        // Set the uploaded image for preview
        setUploadedImage(URL.createObjectURL(file))
        setResult(null)

        console.log("Image uploaded successfully:", uploadData.imagePath)
      } catch (error) {
        console.error("Error uploading image:", error)
        alert("Failed to upload image. Please try again.")
      }
    }
  }

  const GeneratePerception = async () => {
    if (!uploadedImage) {
      alert("Please upload an image first!")
      return
    }

    setIsGenerating(true)
    setResult(null)

    try {
      console.log("Generating Perception with:", { type, emotion, multiplier })

      // Call the API with the saved image path
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          emotion,
          multiplier,
          imagePath: "/uploads/image.jpeg", // Fixed path where image is saved
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate image")
      }

      const data = await response.json()
      setResult(data.imagePath)
    } catch (error) {
      console.error("Error generating perception:", error)
      setResult("Error generating perception. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const emotionConfig = {
    happy: { icon: Heart, color: "from-pink-500 to-rose-500", bg: "bg-pink-50", border: "border-pink-200" },
    sad: { icon: Frown, color: "from-blue-500 to-indigo-500", bg: "bg-blue-50", border: "border-blue-200" },
    angry: { icon: Flame, color: "from-red-500 to-orange-500", bg: "bg-red-50", border: "border-red-200" },
    afraid: {
      icon: AlertTriangle,
      color: "from-purple-500 to-violet-500",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
  }

  const multiplierLabels = {
    1: { label: "Normal", color: "text-green-600", emoji: "😊" },
    2: { label: "High", color: "text-yellow-600", emoji: "🤯" },
    3: { label: "Hallucination", color: "text-red-600", emoji: "🌈" },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            ✨ Emocio ✨
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload an image to see how it looks from an "emotional" perspective
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Image Upload */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
            </div>

            <div className="relative group">
              {uploadedImage ? (
                <div className="relative overflow-hidden rounded-2xl border-4 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded"
                    className="w-full h-80 object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ) : (
                <div
                  className="h-80 border-4 border-dashed border-purple-300 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center transition-all duration-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 cursor-pointer group"
                  onClick={handleUploadClick}
                >
                  <div className="text-center">
                    <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-xl font-semibold text-purple-600 mb-2">Drop your image here</p>
                    <p className="text-gray-500">or click to browse</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mt-6">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
                onClick={handleUploadClick}
              >
                <Upload className="w-5 h-5" />
                {uploadedImage ? "Change Image" : "Upload Image"}
              </button>
            </div>

            {/* Results Section */}
            {result && result !== "Error generating perception. Please try again." && (
              <div className="mt-6 p-4 bg-white/90 rounded-xl border border-purple-200 shadow-md">
                <h3 className="text-lg font-semibold text-purple-700 mb-2">Generated Image:</h3>
                <div className="relative w-full aspect-video">
                  <img
                    src={result || "/placeholder.svg"}
                    alt="Generated perception"
                    className="w-full h-full rounded-lg shadow-lg object-contain"
                  />
                </div>
              </div>
            )}

            {result === "Error generating perception. Please try again." && (
              <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200 shadow-md">
                <p className="text-red-600 font-medium">{result}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Controls */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Type Selection */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Camera className="w-6 h-6 text-purple-500" />
                Analysis Type
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {(["Scenery", "Faces"] as const).map((typeOption) => (
                  <button
                    key={typeOption}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      type === typeOption
                        ? "border-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg"
                        : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50"
                    }`}
                    onClick={() => setType(typeOption)}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{typeOption === "Scenery" ? "🏞️" : "👥"}</div>
                      <div className={`font-semibold ${type === typeOption ? "text-purple-700" : "text-gray-600"}`}>
                        {typeOption}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emotion Selection */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Emotion Filter
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(emotionConfig) as Array<keyof typeof emotionConfig>).map((emotionOption) => {
                  const config = emotionConfig[emotionOption]
                  const IconComponent = config.icon
                  return (
                    <button
                      key={emotionOption}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                        emotion === emotionOption
                          ? `border-transparent bg-gradient-to-r ${config.color} text-white shadow-lg`
                          : `border-gray-200 ${config.bg} hover:${config.border} hover:shadow-md`
                      }`}
                      onClick={() => setEmotion(emotionOption)}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-5 h-5" />
                        <span className="font-semibold capitalize">{emotionOption}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Multiplier */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-500" />
                Intensity Level
              </h3>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                <input
                  type="range"
                  className="w-full h-3 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-lg appearance-none cursor-pointer slider"
                  min="1"
                  max="3"
                  step="1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                />
                <div className="flex justify-between mt-4">
                  {Object.entries(multiplierLabels).map(([value, config]) => (
                    <div
                      key={value}
                      className={`text-center transition-all duration-300 ${
                        multiplier === Number(value) ? `${config.color} scale-110 font-bold` : "text-gray-400"
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.emoji}</div>
                      <div className="text-sm font-medium">{config.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                className={`w-full py-4 px-8 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 ${
                  isGenerating || !uploadedImage
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white hover:shadow-2xl"
                }`}
                onClick={GeneratePerception}
                disabled={isGenerating || !uploadedImage}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Generating..
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    Generate Perception ✨
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  )
}
