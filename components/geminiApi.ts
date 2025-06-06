import { GoogleAuth } from 'google-auth-library'

export const processImageWithGemini = async (args: {
  type: string
  emotion: string
  multiplier: number
  imagePath: string
}) => {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process image');
    }

    const data = await response.json();
    return data.imagePath;
};