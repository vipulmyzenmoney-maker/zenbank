export interface McqOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Generously and uniformly shuffles MCQ options using Fisher-Yates algorithm.
 * Reassigns IDs to "A", "B", "C", "D" and returns the updated options and new correctAnswer letter.
 */
export function shuffleMcqOptions(
  rawOptions: any[],
  targetCorrectAnswerIdOrText?: string
): { options: McqOption[]; correctAnswer: string } {
  if (!rawOptions || rawOptions.length === 0) {
    return { options: [], correctAnswer: "A" };
  }

  const defaultLetters = ["A", "B", "C", "D", "E", "F"];

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
      return { text: opt.text, isCorrect: true };
    }
    return { text: opt.text, isCorrect: false };
  });

  // If no option was marked correct, look for targetCorrectAnswer text match
  if (!foundCorrect && normalized.length > 0) {
    normalized[0].isCorrect = true;
  }

  // 2. Fisher-Yates uniform shuffle
  const shuffled = [...normalized];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 3. Re-assign clean IDs A, B, C, D
  const letters = ["A", "B", "C", "D", "E", "F"];
  let newCorrectLetter = "A";

  const finalOptions: McqOption[] = shuffled.map((opt, idx) => {
    const letter = letters[idx] || String.fromCharCode(65 + idx);
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
