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
  occupation: string;
  company: string | null;
  height: string;
  diet: string | null;
  extra: Record<string, unknown>;
}
