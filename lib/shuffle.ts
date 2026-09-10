export interface McqOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

const GENERAL_PLAUSIBLE_DISTRACTORS = [
  "It was only enforced during times of declared regional emergencies.",
  "It applied exclusively to appointed colonial leaders rather than everyday citizens.",
  "It was decided by an informal agreement rather than written colonial law.",
  "It required the governor to receive written permission directly from England.",
  "It was used as a short-term trial policy that was discontinued after one year.",
  "It allowed community leaders to make verdicts without recording evidence.",
  "It was determined through an annual town lottery.",
  "It was only valid for settlements established along maritime harbors.",
  "It required unanimous approval from all neighboring regional councils.",
  "It was based strictly on oral tradition rather than formal civic charters.",
  "It served as a preliminary recommendation before a final military ruling.",
  "It was restricted to commercial maritime trading companies.",
];

/**
 * Generously and uniformly shuffles MCQ options using Fisher-Yates algorithm.
 * Strictly guarantees that returned options always contain EXACTLY 4 options: A, B, C, and D.
 * If input has fewer than 4 options, synthesizes realistic plausible distractors.
 * If input has more than 4 options, trims to the correct answer + 3 distractors.
 */
export function shuffleMcqOptions(
  rawOptions: any[],
  targetCorrectAnswerIdOrText?: string
): { options: McqOption[]; correctAnswer: string } {
  if (!rawOptions || rawOptions.length === 0) {
    return {
      options: [
        { id: "A", text: "Option A", isCorrect: true },
        { id: "B", text: "Option B", isCorrect: false },
        { id: "C", text: "Option C", isCorrect: false },
        { id: "D", text: "Option D", isCorrect: false },
      ],
      correctAnswer: "A",
    };
  }

  const defaultLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  // 1. Identify which option is actually correct
  let foundCorrect = false;
  const normalized = rawOptions.map((rawOpt, idx) => {
    const opt =
      typeof rawOpt === "string"
        ? { id: defaultLetters[idx] || String(idx + 1), text: rawOpt, isCorrect: false }
        : {
            id: rawOpt.id || defaultLetters[idx] || String(idx + 1),
            text: rawOpt.text !== undefined ? String(rawOpt.text) : String(rawOpt),
            isCorrect: Boolean(rawOpt.isCorrect),
          };

    const isThisCorrect =
      opt.isCorrect === true ||
      (targetCorrectAnswerIdOrText &&
        (opt.id?.toUpperCase() === targetCorrectAnswerIdOrText?.trim().toUpperCase() ||
          opt.text?.trim().toLowerCase() === targetCorrectAnswerIdOrText?.trim().toLowerCase()));

    if (isThisCorrect && !foundCorrect) {
      foundCorrect = true;
      return { text: opt.text.trim(), isCorrect: true };
    }
    return { text: opt.text.trim(), isCorrect: false };
  });

  // If no option was marked correct, designate the first option as correct
  if (!foundCorrect && normalized.length > 0) {
    normalized[0].isCorrect = true;
  }

  // 2. Guarantee EXACTLY 4 options
  // Check if existing options are predominantly numerical
  const numericValues = normalized
    .map((o) => {
      const match = o.text.match(/^[-+]?\d+(?:\.\d+)?/);
      return match ? parseFloat(match[0]) : null;
    })
    .filter((v): v is number => v !== null);

  const isPredominantlyNumeric =
    numericValues.length >= Math.max(1, Math.floor(normalized.length * 0.7));

  const existingTexts = new Set(normalized.map((o) => o.text.toLowerCase()));

  // Backfill if fewer than 4 options
  if (normalized.length < 4) {
    if (isPredominantlyNumeric && numericValues.length > 0) {
      const minVal = Math.min(...numericValues);
      const maxVal = Math.max(...numericValues);
      const step = Math.max(1, Math.round((maxVal - minVal) / 2) || 2);
      const unitMatch = normalized[0].text.match(/[a-zA-Z°%$]+$/);
      const unit = unitMatch ? ` ${unitMatch[0]}` : "";

      const candidates = [
        maxVal + step,
        Math.max(0, minVal - step),
        maxVal + step * 2,
        Math.round((minVal + maxVal) / 2) + 1,
        maxVal * 2,
        Math.max(1, Math.floor(minVal / 2)),
      ];

      for (const cand of candidates) {
        if (normalized.length >= 4) break;
        const formatted = `${cand}${unit}`;
        if (!existingTexts.has(formatted.toLowerCase())) {
          existingTexts.add(formatted.toLowerCase());
          normalized.push({ text: formatted, isCorrect: false });
        }
      }
    }

    // If still under 4 (or for text/conceptual questions), use general high-quality distractors
    let distractorIdx = 0;
    while (normalized.length < 4 && distractorIdx < GENERAL_PLAUSIBLE_DISTRACTORS.length) {
      const cand = GENERAL_PLAUSIBLE_DISTRACTORS[distractorIdx++];
      if (!existingTexts.has(cand.toLowerCase())) {
        existingTexts.add(cand.toLowerCase());
        normalized.push({ text: cand, isCorrect: false });
      }
    }

    // Safety fallback if pool exhausted
    let fallbackCounter = 1;
    while (normalized.length < 4) {
      const fallback = `None of the above conditions apply (Alternative ${fallbackCounter++})`;
      normalized.push({ text: fallback, isCorrect: false });
    }
  }

  // If more than 4 options, trim to exactly 4 while strictly keeping the correct answer
  let exactlyFour = normalized;
  if (normalized.length > 4) {
    const correctOpt = normalized.find((o) => o.isCorrect) || normalized[0];
    const distractors = normalized.filter((o) => o !== correctOpt).slice(0, 3);
    exactlyFour = [correctOpt, ...distractors];
  }

  // 3. Fisher-Yates uniform shuffle
  const shuffled = [...exactlyFour];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 4. Re-assign clean IDs: A, B, C, D
  const letters = ["A", "B", "C", "D"];
  let newCorrectLetter = "A";

  const finalOptions: McqOption[] = shuffled.map((opt, idx) => {
    const letter = letters[idx];
    if (opt.isCorrect) {
      newCorrectLetter = letter;
    }
    return {
      id: letter,
      text: opt.text,
      isCorrect: opt.isCorrect,
    };
  });

  return {
    options: finalOptions,
    correctAnswer: newCorrectLetter,
  };
}
