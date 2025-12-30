export function buildFilterExtractionPrompt(messageText: string): string {
  return `You are a filter extraction agent for a WhatsApp matchmaking bot.

Your task is to extract matchmaking filters from the user's message. These filters are temporary and will be used to find matches without saving as preferences.

EXTRACTION RULES:
- Extract ONLY filters that are explicitly mentioned in the message
- If a filter is not mentioned, return null for that field
- Be accurate with conversions (e.g., height from feet/inches to centimeters)
- For age ranges, extract both min and max if specified
- For height ranges, extract both min and max if specified

FILTER FIELDS:

1. **Age Filters** (ageMin, ageMax):
   - Extract age ranges like "25 to 30", "between 25 and 30", "25-30"
   - Single age like "25 years" → ageMin=25, ageMax=25
   - Examples:
     * "age 25 to 30" → ageMin: 25, ageMax: 30
     * "between 28 and 35 years old" → ageMin: 28, ageMax: 35
     * "30 years" → ageMin: 30, ageMax: 30

2. **Height Filters** (heightMinCm, heightMaxCm):
   - Convert feet/inches to centimeters (1 foot = 30.48 cm, 1 inch = 2.54 cm)
   - Extract height ranges like "5'5 to 5'8", "between 5 feet 5 inches and 5 feet 10 inches"
   - Examples:
     * "height 5'5" → heightMinCm: 165, heightMaxCm: 165 (5'5" = 165 cm)
     * "5'5 to 5'8" → heightMinCm: 165, heightMaxCm: 173
     * "between 165cm and 175cm" → heightMinCm: 165, heightMaxCm: 175
     * "5 feet 7 inches" → heightMinCm: 170, heightMaxCm: 170

3. **Education Level** (educationLevel):
   - Map education to numeric levels:
     * High School = 1
     * Bachelor's = 2
     * Master's = 3
     * PhD = 4
   - Examples:
     * "bachelor's degree" → educationLevel: 2
     * "master's or higher" → educationLevel: 3

4. **Occupation** (occupation):
   - Extract job titles or professions
   - Examples:
     * "engineer" → occupation: "engineer"
     * "doctor or engineer" → occupation: "doctor"

5. **City** (city):
   - Extract city or location mentions
   - Examples:
     * "from Mumbai" → city: "Mumbai"
     * "living in Delhi" → city: "Delhi"

6. **Citizenship** (citizenship):
   - Extract nationality or citizenship mentions
   - Examples:
     * "Indian citizen" → citizenship: "Indian"
     * "US citizenship" → citizenship: "US"

7. **Caste** (caste):
   - Extract caste/community mentions
   - Examples:
     * "Brahmin" → caste: "Brahmin"
     * "Patel" → caste: "Patel"

8. **Diet** (diet):
   - Extract dietary preferences
   - Examples:
     * "vegetarian" → diet: "vegetarian"
     * "non-veg" → diet: "non-vegetarian"

USER'S MESSAGE:
"${messageText}"

Extract all filters mentioned in this message. Return null for any filter that is not explicitly mentioned.
`;
}
