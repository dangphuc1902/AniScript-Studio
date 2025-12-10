export enum VideoType {
  SHORT = 'YouTube Shorts (Vertical 9:16)',
  LONG = 'YouTube Long (Horizontal 16:9)',
}

export enum AnimationStyle {
  DISNEY_PIXAR = 'Disney/Pixar 3D Style',
  ANIME_SHINKAI = 'Anime Makoto Shinkai Style',
  CINEMATIC_REALISTIC = 'Cinematic Realistic',
  HAND_DRAWN_SKETCHY = 'Hand-drawn Sketchy',
  CLAYMATION = 'Claymation / Stop Motion',
  CYBERPUNK = 'Cyberpunk / Sci-Fi 3D'
}

export interface Character {
  id: string;
  name: string;
  description: string;
  features: string;
  personality?: string;
}

export interface Scene {
  id: string;
  sceneNumber: number;
  script: string; // Dialogue or Voiceover
  visualPrompt: string; // The prompt for the video generator
  duration: string;
  generatedImageUrl?: string; // Preview image
  isGeneratingImage?: boolean;
}

export interface Project {
  id: string;
  name: string;
  type: VideoType;
  style: AnimationStyle;
  createdAt: number;
  characters: Character[];
  scenes: Scene[];
  storyIdea: string; // The raw input idea
}

export interface ProjectIdea {
  name: string;
  storyIdea: string;
  type: VideoType;
  style: AnimationStyle;
  characters: Character[];
}

export const INITIAL_CHARACTERS_JSON = `{
  "characters": [
    {
      "id": "char_bella",
      "name": "Bella",
      "description": "The glamorous older sister. Adult female, tall.",
      "features": "Long purple braid, perfect makeup, sparkling outfits."
    },
    {
      "id": "char_mia",
      "name": "Mia",
      "description": "The cute toddler sister. Small, huge eyes, mischievous.",
      "features": "High red ponytail, cute casual clothes."
    }
  ]
}`;