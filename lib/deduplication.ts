/**
 * Question Deduplication & Semantic Similarity Engine for Zen Bank
 *
 * Prevents repetitive questions by:
 * 1. Normalizing question text (lowercasing, punctuation stripping, math symbols)
 * 2. Computing token-level Jaccard similarity and character-level Levenshtein similarity
 * 3. Detecting structural/formulaic templates (e.g., repeating bare calculation drills)
 * 4. Filtering newly generated batches against existing database questions
 */

/**
 * Normalizes question text for robust comparison.
 * Removes common leading interrogatives, trims whitespace, lowercases, and removes punctuation.
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    // Replace common math symbol representations
    .replace(/[×*]/g, "x")
    .replace(/[÷/]/g, "/")
    .replace(/[−–—]/g, "-")
    // Remove punctuation
    .replace(/[^a-z0-9\s/]/g, "")
    // Remove common question prefixes that don't add semantic uniqueness
    .replace(/^(what is|which of the following|calculate|find the|determine the|solve for|how much is|identify the|evaluate)\s+/i, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts a structural skeleton of a question to detect formulaic repetition.
 * Replaces numbers, fractions, and student names with placeholders.
 * e.g., "What is 13 × 9?" -> "<NUM> x <NUM>"
 * e.g., "What is 16 × 11?" -> "<NUM> x <NUM>"
 */
export function getStructuralSkeleton(text: string): string {
  return normalizeQuestionText(text)
    .replace(/\b\d+\s*\/\s*\d+\b/g, "<FRAC>")
    .replace(/\b\d+(\.\d+)?\b/g, "<NUM>")
    .replace(
      /\b(aarav|priya|maya|lucas|elena|rohan|chloe|zayn|ananya|liam|john|sarah|emma|alex|david|maria)\b/gi,
      "<NAME>"
    );
}

/**
 * Detects whether two questions share an identical short formulaic structure.
 */
export function isStructuralDuplicate(candidate: string, existingList: string[]): boolean {
  // Only apply to concise formulaic questions (under 75 characters)
  if (candidate.length > 75) return false;
  const skelCandidate = getStructuralSkeleton(candidate);

  for (const existing of existingList) {
    if (existing.length <= 75) {
      const skelExisting = getStructuralSkeleton(existing);
      if (skelCandidate === skelExisting) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Calculates token-level Jaccard similarity between two strings.
 * Returns a score from 0.0 (completely distinct) to 1.0 (identical tokens).
 */
export function jaccardSimilarity(textA: string, textB: string): number {
  const normA = normalizeQuestionText(textA);
  const normB = normalizeQuestionText(textB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const setA = new Set(normA.split(" ").filter((w) => w.length > 1));
  const setB = new Set(normB.split(" ").filter((w) => w.length > 1));

  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0.0;
}

/**
 * Calculates Levenshtein distance between two strings.
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Computes hybrid similarity score combining token Jaccard and Levenshtein similarity.
 * Score ranges from 0.0 (entirely different) to 1.0 (exact duplicate).
 */
export function calculateSimilarity(textA: string, textB: string): number {
  const normA = normalizeQuestionText(textA);
  const normB = normalizeQuestionText(textB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const jaccard = jaccardSimilarity(textA, textB);

  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  const levRatio = 1.0 - levenshteinDistance(normA, normB) / maxLen;

  // Weighted hybrid score
  return jaccard * 0.6 + levRatio * 0.4;
}

/**
 * Tests whether a candidate question is duplicate or near-duplicate to any question in existingList.
 * Default threshold is 0.68 (68% similarity).
 * Also checks structural skeleton equality.
 */
export function isDuplicate(
  candidate: string,
  existingList: string[],
  threshold = 0.68
): boolean {
  const normCandidate = normalizeQuestionText(candidate);
  if (!normCandidate) return false;

  for (const existing of existingList) {
    const normExisting = normalizeQuestionText(existing);
    // 1. Exact normalized match
    if (normCandidate === normExisting) {
      return true;
    }
    // 2. High lexical / token similarity match
    const sim = calculateSimilarity(candidate, existing);
    if (sim >= threshold) {
      return true;
    }
  }

  // 3. Check structural formulaic duplication
  if (isStructuralDuplicate(candidate, existingList)) {
    return true;
  }

  return false;
}

export interface CandidateQuestion {
  questionText: string;
  [key: string]: any;
}

/**
 * Filters out duplicates from a generated batch:
 * 1. Compares each candidate against existing database questions.
 * 2. Compares each candidate against preceding questions in the same batch (intra-batch deduplication).
 */
export function filterDuplicates<T extends CandidateQuestion>(
  batch: T[],
  existingQuestions: string[],
  threshold = 0.68
): { uniqueQuestions: T[]; duplicatesFound: number } {
  const seenTexts: string[] = [...existingQuestions];
  const uniqueQuestions: T[] = [];
  let duplicatesFound = 0;

  for (const item of batch) {
    if (isDuplicate(item.questionText, seenTexts, threshold)) {
      duplicatesFound++;
    } else {
      uniqueQuestions.push(item);
      seenTexts.push(item.questionText);
    }
  }

  return { uniqueQuestions, duplicatesFound };
}
