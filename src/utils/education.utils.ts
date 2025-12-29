
export enum EducationLevel {
  BELOW_10TH = 1,
  TENTH_PASS = 2,
  TWELFTH_PASS = 3,
  DIPLOMA = 4,
  UNDERGRADUATE = 5,
  GRADUATE = 6,
  POSTGRADUATE = 7,
  DOCTORATE = 8,
}

export interface EducationStructure {
  level: EducationLevel;
  levelName: string;
  degree?: string; 
  field?: string; 
  original: string;
}

const EDUCATION_KEYWORDS: Record<string, EducationLevel> = {
  'below 10': EducationLevel.BELOW_10TH,
  'under 10': EducationLevel.BELOW_10TH,
  'less than 10': EducationLevel.BELOW_10TH,

  '10th': EducationLevel.TENTH_PASS,
  '10 th': EducationLevel.TENTH_PASS,
  'tenth': EducationLevel.TENTH_PASS,
  'ssc': EducationLevel.TENTH_PASS,
  'secondary': EducationLevel.TENTH_PASS,
  'high school': EducationLevel.TENTH_PASS,

  '12th': EducationLevel.TWELFTH_PASS,
  '12 th': EducationLevel.TWELFTH_PASS,
  'twelfth': EducationLevel.TWELFTH_PASS,
  'hsc': EducationLevel.TWELFTH_PASS,
  'higher secondary': EducationLevel.TWELFTH_PASS,
  'intermediate': EducationLevel.TWELFTH_PASS,
  '+2': EducationLevel.TWELFTH_PASS,

  'diploma': EducationLevel.DIPLOMA,
  'polytechnic': EducationLevel.DIPLOMA,
  'iti': EducationLevel.DIPLOMA,

  'undergraduate': EducationLevel.UNDERGRADUATE,
  'pursuing graduation': EducationLevel.UNDERGRADUATE,
  'pursuing bachelor': EducationLevel.UNDERGRADUATE,
  'currently pursuing': EducationLevel.UNDERGRADUATE,

  // Graduate (Bachelor's degree)
  'graduate': EducationLevel.GRADUATE,
  'bachelor': EducationLevel.GRADUATE,
  'graduation': EducationLevel.GRADUATE,
  'b.a': EducationLevel.GRADUATE,
  'ba': EducationLevel.GRADUATE,
  'b.sc': EducationLevel.GRADUATE,
  'bsc': EducationLevel.GRADUATE,
  'b.com': EducationLevel.GRADUATE,
  'bcom': EducationLevel.GRADUATE,
  'b.tech': EducationLevel.GRADUATE,
  'btech': EducationLevel.GRADUATE,
  'b.e': EducationLevel.GRADUATE,
  'be': EducationLevel.GRADUATE,
  'bba': EducationLevel.GRADUATE,
  'bca': EducationLevel.GRADUATE,
  'llb': EducationLevel.GRADUATE,
  'b.ed': EducationLevel.GRADUATE,
  'bed': EducationLevel.GRADUATE,
  'mbbs': EducationLevel.GRADUATE,
  'bds': EducationLevel.GRADUATE,
  'bhms': EducationLevel.GRADUATE,
  'bams': EducationLevel.GRADUATE,

  // Postgraduate (Master's degree)
  'postgraduate': EducationLevel.POSTGRADUATE,
  'post graduate': EducationLevel.POSTGRADUATE,
  'master': EducationLevel.POSTGRADUATE,
  'masters': EducationLevel.POSTGRADUATE,
  'pg': EducationLevel.POSTGRADUATE,
  'm.a': EducationLevel.POSTGRADUATE,
  'ma': EducationLevel.POSTGRADUATE,
  'm.sc': EducationLevel.POSTGRADUATE,
  'msc': EducationLevel.POSTGRADUATE,
  'm.com': EducationLevel.POSTGRADUATE,
  'mcom': EducationLevel.POSTGRADUATE,
  'm.tech': EducationLevel.POSTGRADUATE,
  'mtech': EducationLevel.POSTGRADUATE,
  'm.e': EducationLevel.POSTGRADUATE,
  'me': EducationLevel.POSTGRADUATE,
  'mba': EducationLevel.POSTGRADUATE,
  'mca': EducationLevel.POSTGRADUATE,
  'llm': EducationLevel.POSTGRADUATE,
  'm.ed': EducationLevel.POSTGRADUATE,
  'med': EducationLevel.POSTGRADUATE,
  'md': EducationLevel.POSTGRADUATE,
  'ms': EducationLevel.POSTGRADUATE,

  // Doctorate
  'doctorate': EducationLevel.DOCTORATE,
  'phd': EducationLevel.DOCTORATE,
  'ph.d': EducationLevel.DOCTORATE,
  'doctor': EducationLevel.DOCTORATE,
  'd.phil': EducationLevel.DOCTORATE,
  'dphil': EducationLevel.DOCTORATE,
};

export function getEducationLevelName(level: EducationLevel): string {
  const names: Record<EducationLevel, string> = {
    [EducationLevel.BELOW_10TH]: 'Below 10th',
    [EducationLevel.TENTH_PASS]: '10th Pass',
    [EducationLevel.TWELFTH_PASS]: '12th Pass',
    [EducationLevel.DIPLOMA]: 'Diploma',
    [EducationLevel.UNDERGRADUATE]: 'Undergraduate (Pursuing)',
    [EducationLevel.GRADUATE]: 'Graduate',
    [EducationLevel.POSTGRADUATE]: 'Postgraduate',
    [EducationLevel.DOCTORATE]: 'Doctorate',
  };
  return names[level] || 'Unknown';
}

export function parseEducation(educationStr: string): EducationStructure {
  if (!educationStr || typeof educationStr !== 'string') {
    return {
      level: EducationLevel.BELOW_10TH,
      levelName: getEducationLevelName(EducationLevel.BELOW_10TH),
      original: educationStr || '',
    };
  }

  const normalized = educationStr.toLowerCase().trim();

  for (const [keyword, level] of Object.entries(EDUCATION_KEYWORDS)) {
    if (normalized === keyword || normalized.includes(` ${keyword} `) ||
        normalized.startsWith(`${keyword} `) || normalized.endsWith(` ${keyword}`)) {

      const degreeMatch = educationStr.match(/\b([A-Z]{2,}(?:\.[A-Z]+)?)\b/);
      const degree = degreeMatch ? degreeMatch[1] : undefined;

      const fieldMatch = educationStr.match(/in\s+([A-Za-z\s]+)/i);
      const field = fieldMatch ? fieldMatch[1].trim() : undefined;

      return {
        level,
        levelName: getEducationLevelName(level),
        degree,
        field,
        original: educationStr,
      };
    }
  }

  let highestLevel = EducationLevel.BELOW_10TH;
  let matchedKeyword = '';

  for (const [keyword, level] of Object.entries(EDUCATION_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      if (level > highestLevel) {
        highestLevel = level;
        matchedKeyword = keyword;
      }
    }
  }

  if (matchedKeyword) {
    const degreeMatch = educationStr.match(/\b([A-Z]{2,}(?:\.[A-Z]+)?)\b/);
    const degree = degreeMatch ? degreeMatch[1] : undefined;

    const fieldMatch = educationStr.match(/in\s+([A-Za-z\s]+)/i);
    const field = fieldMatch ? fieldMatch[1].trim() : undefined;

    return {
      level: highestLevel,
      levelName: getEducationLevelName(highestLevel),
      degree,
      field,
      original: educationStr,
    };
  }

  return {
    level: EducationLevel.GRADUATE,
    levelName: getEducationLevelName(EducationLevel.GRADUATE),
    original: educationStr,
  };
}

export function meetsEducationRequirement(
  candidateLevel: EducationLevel,
  requiredLevel: EducationLevel
): boolean {
  return candidateLevel >= requiredLevel;
}

export function formatEducation(education: EducationStructure): string {
  let result = education.levelName;

  if (education.degree) {
    result += ` (${education.degree})`;
  }

  if (education.field) {
    result += ` in ${education.field}`;
  }

  return result;
}

export function matchesEducationPreference(
  candidateEducation: string,
  preferenceStr: string
): boolean {
  const candidate = parseEducation(candidateEducation);
  const preference = parseEducation(preferenceStr);

  const normalizedPref = preferenceStr.toLowerCase();
  if (normalizedPref.includes('at least') ||
      normalizedPref.includes('minimum') ||
      normalizedPref.includes('min')) {
    return candidate.level >= preference.level;
  }

  if (normalizedPref.includes('maximum') ||
      normalizedPref.includes('max') ||
      normalizedPref.includes('up to')) {
    return candidate.level <= preference.level;
  }

  return candidate.level === preference.level;
}
