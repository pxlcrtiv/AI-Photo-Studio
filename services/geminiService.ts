import { GoogleGenAI, Modality } from '@google/genai';
import { ImagePromptRequest, ImagePart } from '../types';

/**
 * Edits an image using the Gemini 2.5 Flash Image model with a given text prompt.
 *
 * @param request The ImagePromptRequest containing the base64 image, mimeType, and prompt.
 * @returns A Promise that resolves with the base64 encoded string of the edited image.
 * @throws An error if the API key is not available, the model fails to generate content,
 *         or the response does not contain an image.
 */
export const editImageWithPrompt = async (
  request: ImagePromptRequest,
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set.');
  }

  // Create a new GoogleGenAI instance for each call to ensure the latest API key is used
  // and to avoid potential race conditions if the key is updated externally.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart: ImagePart = {
    inlineData: {
      mimeType: request.mimeType,
      data: request.base64Image,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Use the specified Gemini 2.5 Flash Image model
      contents: {
        parts: [
          imagePart,
          {
            text: request.prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE], // Request an image response
      },
    });

    const candidate = response.candidates?.[0];
    if (candidate && candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data; // Return the base64 image data
        }
      }
    }
    throw new Error('Gemini API response did not contain an image.');
  } catch (error: unknown) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error('An unknown error occurred while editing the image.');
  }
};
