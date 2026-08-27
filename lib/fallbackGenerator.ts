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
  const lowerGrade = (gradeLevel || "").toLowerCase();

  const questions: GeneratedQuestion[] = [];

  // Determine grade tier
  const isK = lowerGrade.includes("k") || lowerGrade.includes("kinder");
  const is1st = lowerGrade.includes("1");
  const is2nd = lowerGrade.includes("2");
  const is3rd = lowerGrade.includes("3");
  const is4th = lowerGrade.includes("4");
  const is5th = lowerGrade.includes("5");
  const isMiddle = lowerGrade.includes("6") || lowerGrade.includes("7") || lowerGrade.includes("8") || lowerGrade.includes("middle");
  const isHigh = lowerGrade.includes("9") || lowerGrade.includes("10") || lowerGrade.includes("11") || lowerGrade.includes("12") || lowerGrade.includes("high") || lowerGrade.includes("sat");

  for (let i = 1; i <= count; i++) {
    let qText = "";
    let opts: { id: string; text: string; isCorrect: boolean }[] = [];
    let correct = "B";
    let explanation = "";
    let difficulty: "easy" | "medium" | "hard" = i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy";
    const confidence = 95 + (i % 5);

    if (lowerSubject.includes("math")) {
      if (isK) {
        // Kindergarten Math: 1-10 counting, simple +1
        const num1 = ((i * 2 + 1) % 5) + 1; // 1 to 5
        const num2 = (i % 3) + 1;           // 1 to 3
        const sum = num1 + num2;
        const apples = "🍎 ".repeat(num1).trim();

        if (i % 2 === 1) {
          qText = `How many apples are here: ${apples} ?`;
          opts = [
            { id: "A", text: `${Math.max(1, num1 - 1)}`, isCorrect: false },
            { id: "B", text: `${num1}`, isCorrect: true },
            { id: "C", text: `${num1 + 2}`, isCorrect: false },
            { id: "D", text: `${num1 + 3}`, isCorrect: false },
          ];
          correct = "B";
          explanation = `Count the apples one by one: there are ${num1} apples!`;
        } else {
          qText = `What is ${num1} + ${num2}?`;
          opts = [
            { id: "A", text: `${sum - 1}`, isCorrect: false },
            { id: "B", text: `${sum}`, isCorrect: true },
            { id: "C", text: `${sum + 2}`, isCorrect: false },
            { id: "D", text: `${sum + 3}`, isCorrect: false },
          ];
          correct = "B";
          explanation = `Count together: ${num1} plus ${num2} equals ${sum}.`;
        }
      } else if (is1st) {
        // 1st Grade Math: Addition / Subtraction within 20
        const a = (i * 3) % 10 + 4; // 4 to 13
        const b = (i * 2) % 6 + 2;  // 2 to 7
        const sum = a + b;
        const diff = a - Math.min(a - 1, b);

        if (i % 2 === 1) {
          qText = `What is ${a} + ${b}? (Topic: ${cleanTopic})`;
          opts = [
            { id: "A", text: `${sum - 2}`, isCorrect: false },
            { id: "B", text: `${sum}`, isCorrect: true },
            { id: "C", text: `${sum + 1}`, isCorrect: false },
            { id: "D", text: `${sum + 3}`, isCorrect: false },
          ];
          correct = "B";
          explanation = `Add step-by-step: ${a} + ${b} = ${sum}.`;
        } else {
          qText = `What is ${a} - ${b}? (Topic: ${cleanTopic})`;
          const ans = a - b;
          opts = [
            { id: "A", text: `${ans + 2}`, isCorrect: false },
            { id: "B", text: `${ans}`, isCorrect: true },
            { id: "C", text: `${ans - 1}`, isCorrect: false },
            { id: "D", text: `${ans + 4}`, isCorrect: false },
          ];
          correct = "B";
          explanation = `Subtract: ${a} - ${b} = ${ans}.`;
        }
      } else if (is2nd) {
        // 2nd Grade Math: 2-digit addition to 100, coins
        const a = i * 12 + 15;
        const b = i * 8 + 10;
        const sum = a + b;
        qText = `What is ${a} + ${b}? (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${sum - 10}`, isCorrect: false },
          { id: "B", text: `${sum}`, isCorrect: true },
          { id: "C", text: `${sum + 10}`, isCorrect: false },
          { id: "D", text: `${sum + 2}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Add tens and ones: ${a} + ${b} = ${sum}.`;
      } else if (is3rd) {
        // 3rd Grade Math: Times tables 2-9 & Division
        const factorA = ((i * 2 + 1) % 8) + 2; // 2 to 9
        const factorB = ((i * 3 + 2) % 8) + 2; // 2 to 9
        const prod = factorA * factorB;
        qText = `What is ${factorA} × ${factorB}? (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${prod - factorA}`, isCorrect: false },
          { id: "B", text: `${prod}`, isCorrect: true },
          { id: "C", text: `${prod + factorB}`, isCorrect: false },
          { id: "D", text: `${prod + 6}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Multiply: ${factorA} × ${factorB} = ${prod}.`;
      } else if (is4th) {
        // 4th Grade Math: 2-digit multiplication, division
        const a = i * 6 + 18;
        const b = (i % 5) + 4;
        const prod = a * b;
        qText = `Evaluate: ${a} × ${b} (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${prod - a}`, isCorrect: false },
          { id: "B", text: `${prod}`, isCorrect: true },
          { id: "C", text: `${prod + 10}`, isCorrect: false },
          { id: "D", text: `${prod + a}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Multiply: ${a} × ${b} = ${prod}.`;
      } else if (is5th) {
        // 5th Grade Math: Multi-digit operations, fractions
        const a = i * 14 + 12;
        const b = i * 5 + 11;
        const prod = a * b;
        qText = `Calculate: ${a} × ${b} (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${prod - 20}`, isCorrect: false },
          { id: "B", text: `${prod}`, isCorrect: true },
          { id: "C", text: `${prod + 20}`, isCorrect: false },
          { id: "D", text: `${prod + a}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step-by-step: ${a} × ${b} = ${prod}.`;
      } else if (isMiddle) {
        // Middle School: Pre-algebra, ratios
        const xVal = i + 3;
        const coeff = (i % 3) + 2;
        const constVal = i * 4;
        const result = coeff * xVal + constVal;
        qText = `Solve for x: ${coeff}x + ${constVal} = ${result}`;
        opts = [
          { id: "A", text: `x = ${xVal - 1}`, isCorrect: false },
          { id: "B", text: `x = ${xVal}`, isCorrect: true },
          { id: "C", text: `x = ${xVal + 2}`, isCorrect: false },
          { id: "D", text: `x = ${xVal + 3}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Subtract ${constVal}: ${coeff}x = ${result - constVal}. Divide by ${coeff}: x = ${xVal}.`;
      } else {
        // High School / SAT
        const m = (i % 3) + 2;
        const bVal = i * 3 - 2;
        const x = 4;
        const y = m * x + bVal;
        qText = `If f(x) = ${m}x + ${bVal}, what is f(${x})?`;
        opts = [
          { id: "A", text: `${y - 4}`, isCorrect: false },
          { id: "B", text: `${y}`, isCorrect: true },
          { id: "C", text: `${y + 4}`, isCorrect: false },
          { id: "D", text: `${y + 10}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Substitute x = ${x}: f(${x}) = ${m}(${x}) + ${bVal} = ${m * x} + ${bVal} = ${y}.`;
      }
    } else if (lowerSubject.includes("reading") || lowerSubject.includes("english")) {
      if (isK) {
        qText = `Which word starts with the letter sound /m/ like 'Monkey'?`;
        opts = [
          { id: "A", text: "Tiger", isCorrect: false },
          { id: "B", text: "Moon", isCorrect: true },
          { id: "C", text: "Elephant", isCorrect: false },
          { id: "D", text: "Dog", isCorrect: false },
        ];
        correct = "B";
        explanation = "'Moon' and 'Monkey' both start with the letter M.";
      } else if (is1st || is2nd) {
        qText = `What is the main character in a story? (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: "The place where the story happens", isCorrect: false },
          { id: "B", text: "The person or animal the story is mostly about", isCorrect: true },
          { id: "C", text: "The last page of the book", isCorrect: false },
          { id: "D", text: "The color of the cover", isCorrect: false },
        ];
        correct = "B";
        explanation = "The main character is who the story is centered around.";
      } else {
        qText = `When analyzing ${cleanTopic}, what is the best way to determine the author's main idea?`;
        opts = [
          { id: "A", text: "Only read the first word of each sentence", isCorrect: false },
          { id: "B", text: "Identify the central claim and the key supporting evidence", isCorrect: true },
          { id: "C", text: "Pick the longest vocabulary word in the text", isCorrect: false },
          { id: "D", text: "Ignore the conclusion paragraph", isCorrect: false },
        ];
        correct = "B";
        explanation = "The main idea combines the central theme and key supporting evidence.";
      }
    } else {
      qText = `Regarding ${cleanTopic} (${gradeLevel}): Which statement describes the core concept accurately?`;
      opts = [
        { id: "A", text: "It functions randomly with no observable rules.", isCorrect: false },
        { id: "B", text: `It follows standard principles of ${cleanTopic} verified by science and observation.`, isCorrect: true },
        { id: "C", text: "It cannot be studied or measured.", isCorrect: false },
        { id: "D", text: "It only occurs in imaginary scenarios.", isCorrect: false },
      ];
      correct = "B";
      explanation = `Understanding ${cleanTopic} involves learning proven concepts and cause-and-effect relationships.`;
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
