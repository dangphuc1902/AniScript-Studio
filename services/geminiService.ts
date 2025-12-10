import { GoogleGenAI, Type } from "@google/genai";
import { Character, Scene, AnimationStyle, VideoType, ProjectIdea } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStoryScenes = async (
  idea: string,
  characters: Character[],
  style: AnimationStyle,
  type: VideoType
): Promise<Scene[]> => {
  const ai = getClient();
  
  const characterContext = characters
    .map(c => `- ${c.name}: ${c.description}. Visual features: ${c.features}. ${c.personality ? `Personality: ${c.personality}` : ''}`)
    .join('\n');

  const systemInstruction = `You are an expert animation director and screenwriter for YouTube.
  Your task is to take a story idea and break it down into scenes.
  
  Format Constraints:
  - Video Type: ${type}
  - Animation Style: ${style}
  
  Characters Available:
  ${characterContext}
  
  Instructions:
  1. Create a compelling script suitable for the video type (fast-paced for Shorts, well-paced for Long).
  2. For 'visualPrompt', write a highly detailed image generation prompt. 
     - IMPORTANT: You MUST inject the specific visual features of the characters (e.g., "Bella, a tall woman with long purple braid") into the prompt every time the character appears so the image generator knows how to draw them.
     - Include the art style (${style}) in every visual prompt.
     - Describe lighting, camera angle, and background.
  
  Output MUST be a JSON array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Story Idea: ${idea}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.INTEGER },
              script: { type: Type.STRING, description: "The dialogue or voiceover text" },
              visualPrompt: { type: Type.STRING, description: "Detailed prompt for video generation AI" },
              duration: { type: Type.STRING, description: "Estimated duration e.g. '3s'" }
            },
            required: ["sceneNumber", "script", "visualPrompt", "duration"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    const parsed = JSON.parse(jsonText);
    
    // Add unique IDs
    return parsed.map((item: any) => ({
      ...item,
      id: crypto.randomUUID(),
    }));

  } catch (error) {
    console.error("Error generating scenes:", error);
    throw error;
  }
};

export const generateScenePreview = async (visualPrompt: string): Promise<string> => {
  const ai = getClient();
  
  try {
    // Using gemini-2.5-flash-image (Nano Banana) for fast preview generation
    // Ideally user might use a higher quality model, but for preview/storyboard, this is efficient.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: visualPrompt,
      config: {
        imageConfig: {
          aspectRatio: "16:9", // Defaulting to 16:9 for preview usually looks better, or could match video type
          // Nano Banana doesn't support 'imageSize' config, so we omit it.
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated");

  } catch (error) {
    console.error("Error generating image preview:", error);
    throw error;
  }
};

export const generateProjectIdea = async (topic?: string): Promise<ProjectIdea> => {
  const ai = getClient();
  const validStyles = Object.values(AnimationStyle).join(', ');
  const validTypes = Object.values(VideoType).join(', ');

  const systemInstruction = `You are a YouTube creative strategist and trend analyst. 
  Your goal is to brainstorm a high-potential, viral animation project idea.
  
  Constraints:
  - Allowed Styles: ${validStyles}
  - Allowed Types: ${validTypes}
  
  Instructions:
  1. Analyze current trends or use the provided topic to create a concept.
  2. Create a catchy 'name' for the project.
  3. Write a brief 'storyIdea' (plot summary).
  4. Select the best 'type' and 'style' from the allowed lists.
  5. Create a set of unique 'characters' (2-4 characters) with detailed visual descriptions suitable for AI image generation.`;

  const userPrompt = topic 
    ? `Generate a project idea based on this topic: "${topic}".`
    : `Generate a trending, viral animation project idea (e.g., horror, comedy, parody, cute animals, or sci-fi).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            storyIdea: { type: Type.STRING },
            type: { type: Type.STRING, enum: Object.values(VideoType) },
            style: { type: Type.STRING, enum: Object.values(AnimationStyle) },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  features: { type: Type.STRING },
                  personality: { type: Type.STRING }
                },
                required: ["id", "name", "description", "features"]
              }
            }
          },
          required: ["name", "storyIdea", "type", "style", "characters"]
        }
      }
    });

    const idea = JSON.parse(response.text || "{}");
    
    // Ensure character IDs are unique if the model didn't generate unique ones
    if (idea.characters) {
      idea.characters = idea.characters.map((c: any) => ({
        ...c,
        id: c.id || crypto.randomUUID()
      }));
    }

    return idea as ProjectIdea;

  } catch (error) {
    console.error("Error generating project idea:", error);
    throw error;
  }
};