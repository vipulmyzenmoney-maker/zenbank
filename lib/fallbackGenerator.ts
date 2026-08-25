export interface GeneratedQuestion {
  questionText: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  confidence: number;
}

export function generateCurriculumQuestions(
  topic: string,
  subject: string,
  gradeLevel: string,
  count: number = 5
): GeneratedQuestion[] {
  const cleanTopic = topic.trim();
  const lowerTopic = cleanTopic.toLowerCase();
  const lowerSubject = subject.toLowerCase();

  const questions: GeneratedQuestion[] = [];

  for (let i = 1; i <= count; i++) {
    let qText = "";
    let opts: { id: string; text: string; isCorrect: boolean }[] = [];
    let correct = "B";
    let explanation = "";
    let difficulty: "easy" | "medium" | "hard" = i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy";
    const confidence = 95 + (i % 5);

    if (lowerSubject.includes("math")) {
      const a = (i * 7) + 3;
      const b = (i * 4) + 2;
      const sum = a + b;
      const prod = a * b;
      const fracNumerator = i * 2;
      const fracDenominator = i * 4;

      if (lowerTopic.includes("fraction") || i % 4 === 1) {
        qText = `Simplify the fraction ${fracNumerator}/${fracDenominator} to its simplest form. (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${fracNumerator / 2}/${fracDenominator / 2}`, isCorrect: false },
          { id: "B", text: "1/2", isCorrect: true },
          { id: "C", text: "2/3", isCorrect: false },
          { id: "D", text: "1/4", isCorrect: false },
        ];
        correct = "B";
        explanation = `Divide both numerator (${fracNumerator}) and denominator (${fracDenominator}) by their greatest common divisor (${fracNumerator}) to get 1/2.`;
      } else if (lowerTopic.includes("multiplication") || lowerTopic.includes("algebra") || i % 4 === 2) {
        qText = `Solve for the unknown value: What is ${a} × ${b}? (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${prod - a}`, isCorrect: false },
          { id: "B", text: `${prod}`, isCorrect: true },
          { id: "C", text: `${prod + b}`, isCorrect: false },
          { id: "D", text: `${prod + 12}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Multiply ${a} by ${b} step-by-step: ${a} × ${b} = ${prod}.`;
      } else if (lowerTopic.includes("area") || lowerTopic.includes("geometry") || i % 4 === 3) {
        const sideA = i * 3 + 2;
        const sideB = i * 2 + 5;
        const area = sideA * sideB;
        qText = `What is the area of a rectangle with length ${sideA} cm and width ${sideB} cm? (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${(sideA + sideB) * 2} cm²`, isCorrect: false },
          { id: "B", text: `${area} cm²`, isCorrect: true },
          { id: "C", text: `${area - 10} cm²`, isCorrect: false },
          { id: "D", text: `${area + sideA} cm²`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Area of a rectangle = length × width = ${sideA} cm × ${sideB} cm = ${area} cm².`;
      } else {
        qText = `Calculate the result of (${a} + ${b}) × 2. (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${sum}`, isCorrect: false },
          { id: "B", text: `${sum * 2}`, isCorrect: true },
          { id: "C", text: `${sum * 2 + 4}`, isCorrect: false },
          { id: "D", text: `${sum * 3}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Follow the order of operations (PEMDAS): First calculate parentheses (${a} + ${b} = ${sum}), then multiply by 2 = ${sum * 2}.`;
      }
    } else if (lowerSubject.includes("reading") || lowerSubject.includes("english")) {
      const concepts = [
        {
          concept: "Main Idea",
          q: `Which sentence best identifies the primary purpose or main theme of a passage regarding "${cleanTopic}"?`,
          correct: `It provides evidence and explanation showing how ${cleanTopic} functions in context.`,
          wrong1: "It lists unrelated background trivia without a cohesive argument.",
          wrong2: "It contradicts the author's stated viewpoint in the conclusion.",
          wrong3: "It only focuses on a single minor vocabulary definition.",
          exp: `The main idea summarizes the central message of the entire text rather than isolated supporting details.`,
        },
        {
          concept: "Context Clues",
          q: `When analyzing a complex text in ${cleanTopic}, what is the best strategy to deduce the meaning of unfamiliar vocabulary?`,
          correct: "Examine surrounding sentences, synonyms, and contrast clues in the paragraph.",
          wrong1: "Ignore the word and skip the entire paragraph.",
          wrong2: "Assume the word means the opposite of the sentence theme.",
          wrong3: "Only read the first letter of the unfamiliar word.",
          exp: `Context clues in neighboring clauses provide direct hints and definitions for unfamiliar terminology.`,
        },
        {
          concept: "Author's Purpose",
          q: `Why does an author use concrete examples and real-world data when explaining "${cleanTopic}"?`,
          correct: "To support their central claim and provide clear, verifiable evidence for the reader.",
          wrong1: "To confuse the reader with unnecessary numbers.",
          wrong2: "To artificially extend the page count of the text.",
          wrong3: "To change the subject of the essay entirely.",
          exp: `Authors use data and concrete evidence to reinforce credibility and substantiate their claims.`,
        },
      ];
      const item = concepts[(i - 1) % concepts.length];
      qText = `Question #${i} on ${cleanTopic}: ${item.q}`;
      opts = [
        { id: "A", text: item.wrong1, isCorrect: false },
        { id: "B", text: item.correct, isCorrect: true },
        { id: "C", text: item.wrong2, isCorrect: false },
        { id: "D", text: item.wrong3, isCorrect: false },
      ];
      correct = "B";
      explanation = item.exp;
    } else {
      // General Science / Social Studies / Other Subjects
      qText = `Regarding ${cleanTopic} (${gradeLevel} ${subject}): Which of the following statements represents the fundamental scientific/core principle?`;
      opts = [
        { id: "A", text: `It occurs randomly without any predictable physical or logical laws.`, isCorrect: false },
        { id: "B", text: `It is governed by foundational principles of ${cleanTopic} observed across experiments and real-world systems.`, isCorrect: true },
        { id: "C", text: `It only applies in synthetic laboratory environments and never in nature.`, isCorrect: false },
        { id: "D", text: `It has been completely superseded by unrelated historical conjectures.`, isCorrect: false },
      ];
      correct = "B";
      explanation = `Understanding ${cleanTopic} requires applying core verified concepts and cause-and-effect relationships.`;
    }

    questions.push({
      questionText: qText,
      options: opts,
      correctAnswer: correct,
      explanation,
      difficulty,
      confidence,
    });
  }

  return questions;
}
