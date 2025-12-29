export interface UserPreferences {
  ageMin?: number;
  ageMax?: number;
  heightMinCm?: number;
  heightMaxCm?: number;
  educationLevel?: number;
  occupation?: string;
  city?: string;
  citizenship?: string;
  caste?: string;
  diet?: string;
  otherPreferences?: Record<string, unknown>;
}

export interface PreferenceExtraction {
  ageMin: number | null;
  ageMax: number | null;
  heightMin: string | null; 
  heightMax: string | null; 
  heightMinCm: number | null; 
  heightMaxCm: number | null; 
  education: string | null; 
  educationLevel: number | null;
  occupation: string | null;
  city: string | null;
  citizenship: string | null;
  caste: string | null;
  diet: string | null;
  otherPreferences: Record<string, unknown>;
}
