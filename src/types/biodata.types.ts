export interface BiodataExtraction {
  firstName: string;
  lastName: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  dateOfBirth: string;
  city: string;
  caste: string;
  currentCity: string | null;
  citizenship: string;
  education: string;
  educationLevel: number;
  occupation: string;
  company: string | null;
  height: string;
  diet: "Vegetarian" | "Non-Vegetarian" | "Jain" | null;
  extra: Record<string, unknown>;
}
