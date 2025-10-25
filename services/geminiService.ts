import { GoogleGenAI, Modality } from "@google/genai";

// Helper function to convert a File object to a base64 string
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            resolve('');
        }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const suggestLocation = async (imageFile: File): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable is not set. Using fallback.");
    return "A Beautiful Place";
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = await fileToGenerativePart(imageFile);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                imagePart,
                { text: "Based on this image, suggest a creative and friendly name for the location shown. For example, 'Sunset Cliffs' or 'The Whispering Forest'. Be concise, returning only the name." }
            ]
        },
    });

    const text = response.text.trim();
    return text.replace(/^"|"$/g, '');
  } catch (error) {
    console.error("Error calling Gemini API for location:", error);
    return "A Beautiful Place"; // Fallback location
  }
};

export const detectMainSubject = async (imageFile: File): Promise<string | null> => {
    if (!process.env.API_KEY) {
        console.warn("API_KEY environment variable is not set for subject detection.");
        return null;
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(imageFile);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    imagePart,
                    { text: 'Create a segmentation mask for the main subject in this image. The mask should be a black and white image where the subject is pure white (#FFFFFF) and the background is pure black (#000000).' },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        return null;

    } catch (error) {
        console.error("Error calling Gemini API for subject detection:", error);
        return null;
    }
};
