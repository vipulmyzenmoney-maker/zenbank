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

  for (let i = 1; i <= count; i++) {
    let qText = "";
    let opts: { id: string; text: string; isCorrect: boolean }[] = [];
    let correct = "B";
    let explanation = "";
    let difficulty: "easy" | "medium" | "hard" = i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy";
    const confidence = 95 + (i % 5);

    // ==========================================
    // TOPIC-SPECIFIC GENERATORS
    // ==========================================
    if (lowerTopic.includes("shape") || lowerTopic.includes("geometry") || lowerTopic.includes("angle")) {
      const geoQuestions = [
        {
          q: "What shape has exactly 3 straight sides and 3 corners?",
          correct: "Triangle",
          w1: "Square",
          w2: "Circle",
          w3: "Rectangle",
          exp: "A triangle is defined by having 3 sides and 3 angles.",
        },
        {
          q: "An angle that measures exactly 90 degrees and forms a square corner is called a...",
          correct: "Right angle",
          w1: "Acute angle",
          w2: "Obtuse angle",
          w3: "Straight angle",
          exp: "A 90° angle is a right angle.",
        },
        {
          q: "What is the area of a rectangle with length 8 cm and width 5 cm?",
          correct: "40 cm²",
          w1: "26 cm²",
          w2: "35 cm²",
          w3: "45 cm²",
          exp: "Area = Length × Width = 8 × 5 = 40 cm².",
        },
        {
          q: "Lines in the same plane that never meet or intersect no matter how far they extend are...",
          correct: "Parallel lines",
          w1: "Perpendicular lines",
          w2: "Curved lines",
          w3: "Intersecting lines",
          exp: "Parallel lines run side-by-side with equal distance between them.",
        },
        {
          q: "What 3D shape has 6 flat square faces all of equal size?",
          correct: "Cube",
          w1: "Sphere",
          w2: "Cylinder",
          w3: "Cone",
          exp: "A cube has 6 congruent square faces.",
        },
      ];
      const g = geoQuestions[(i - 1) % geoQuestions.length];
      qText = `${g.q} (Topic: ${cleanTopic})`;
      opts = [
        { id: "A", text: g.w1, isCorrect: false },
        { id: "B", text: g.correct, isCorrect: true },
        { id: "C", text: g.w2, isCorrect: false },
        { id: "D", text: g.w3, isCorrect: false },
      ];
      correct = "B";
      explanation = g.exp;
    } else if (lowerTopic.includes("fraction")) {
      const fracQuestions = [
        {
          q: "What is 1/3 + 1/4?",
          correct: "7/12",
          w1: "2/7",
          w2: "5/12",
          w3: "3/4",
          exp: "Find LCD (12): 1/3 = 4/12, 1/4 = 3/12. 4/12 + 3/12 = 7/12.",
        },
        {
          q: "Which fraction is equivalent to 2/3?",
          correct: "4/6",
          w1: "3/4",
          w2: "2/6",
          w3: "5/9",
          exp: "Multiply numerator and denominator by 2: (2×2)/(3×2) = 4/6.",
        },
        {
          q: "Calculate: 3/4 - 1/2",
          correct: "1/4",
          w1: "2/4",
          w2: "1/2",
          w3: "1/8",
          exp: "Convert 1/2 to 2/4. 3/4 - 2/4 = 1/4.",
        },
        {
          q: "In any fraction, what does the DENOMINATOR represent?",
          correct: "The total number of equal parts in the whole",
          w1: "The number of parts you currently have",
          w2: "The whole number in front of the fraction",
          w3: "The product of multiplication",
          exp: "The bottom number (denominator) tells how many equal parts divide the whole.",
        },
        {
          q: "What is 1/2 × 3/5?",
          correct: "3/10",
          w1: "4/7",
          w2: "3/7",
          w3: "1/5",
          exp: "Multiply across: (1 × 3) / (2 × 5) = 3/10.",
        },
      ];
      const f = fracQuestions[(i - 1) % fracQuestions.length];
      qText = `${f.q} (Topic: ${cleanTopic})`;
      opts = [
        { id: "A", text: f.w1, isCorrect: false },
        { id: "B", text: f.correct, isCorrect: true },
        { id: "C", text: f.w2, isCorrect: false },
        { id: "D", text: f.w3, isCorrect: false },
      ];
      correct = "B";
      explanation = f.exp;
    } else if (lowerTopic.includes("volume") || lowerTopic.includes("pemdas") || lowerTopic.includes("order of operation")) {
      if (lowerTopic.includes("volume") || i % 2 === 1) {
        const l = i * 2 + 2;
        const w = i + 3;
        const h = i + 1;
        const vol = l * w * h;
        qText = `What is the volume of a rectangular prism with length ${l} cm, width ${w} cm, and height ${h} cm?`;
        opts = [
          { id: "A", text: `${vol - 10} cm³`, isCorrect: false },
          { id: "B", text: `${vol} cm³`, isCorrect: true },
          { id: "C", text: `${vol + 12} cm³`, isCorrect: false },
          { id: "D", text: `${vol + 24} cm³`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Volume = Length × Width × Height = ${l} × ${w} × ${h} = ${vol} cm³.`;
      } else {
        qText = "Evaluate using PEMDAS: 6 + 4 × (10 - 3)";
        opts = [
          { id: "A", text: "70", isCorrect: false },
          { id: "B", text: "34", isCorrect: true },
          { id: "C", text: "38", isCorrect: false },
          { id: "D", text: "42", isCorrect: false },
        ];
        correct = "B";
        explanation = "1. Parentheses: (10 - 3) = 7. 2. Multiply: 4 × 7 = 28. 3. Add: 6 + 28 = 34.";
      }
    } else if (lowerTopic.includes("money") || lowerTopic.includes("coin") || lowerTopic.includes("time") || lowerTopic.includes("clock")) {
      if (lowerTopic.includes("money") || lowerTopic.includes("coin") || i % 2 === 1) {
        qText = "How much money is 3 quarters (25¢ each) + 2 dimes (10¢ each) + 1 nickel (5¢)?";
        opts = [
          { id: "A", text: "95¢", isCorrect: false },
          { id: "B", text: "$1.00", isCorrect: true },
          { id: "C", text: "85¢", isCorrect: false },
          { id: "D", text: "$1.05", isCorrect: false },
        ];
        correct = "B";
        explanation = "3 quarters = 75¢. 2 dimes = 20¢. 1 nickel = 5¢. 75 + 20 + 5 = 100¢ = $1.00.";
      } else {
        qText = "When the hour hand points to 6 and the minute hand points to 6, what time is it?";
        opts = [
          { id: "A", text: "6:00", isCorrect: false },
          { id: "B", text: "6:30", isCorrect: true },
          { id: "C", text: "6:15", isCorrect: false },
          { id: "D", text: "12:30", isCorrect: false },
        ];
        correct = "B";
        explanation = "The minute hand on 6 equals 30 minutes (6 × 5 = 30), so it is 6:30.";
      }
    } else if (lowerSubject.includes("science") || lowerTopic.includes("ecosystem") || lowerTopic.includes("earth") || lowerTopic.includes("matter") || lowerTopic.includes("solar")) {
      const sciQuestions = [
        {
          q: "Which organism is a PRODUCER that makes its own food using sunlight?",
          correct: "Oak Tree (Green Plant)",
          w1: "Red Fox",
          w2: "Earthworm",
          w3: "Mushroom",
          exp: "Plants produce glucose through photosynthesis using sunlight.",
        },
        {
          q: "What is the primary role of DECOMPOSERS (like fungi and soil bacteria) in an ecosystem?",
          correct: "Break down dead organisms and recycle nutrients back into soil",
          w1: "Hunt herbivores for energy",
          w2: "Reflect solar radiation away from Earth",
          w3: "Generate oxygen from deep underground",
          exp: "Decomposers break down organic matter and return essential nutrients to soil.",
        },
        {
          q: "Which Earth sphere includes all liquid water, ice caps, rivers, and oceans?",
          correct: "Hydrosphere",
          w1: "Atmosphere",
          w2: "Geosphere",
          w3: "Biosphere",
          exp: "'Hydro' means water, so the hydrosphere encompasses all Earth's water.",
        },
        {
          q: "Which state of matter has a DEFINITE volume but takes the shape of its container?",
          correct: "Liquid",
          w1: "Solid",
          w2: "Gas",
          w3: "Plasma",
          exp: "Liquids have fixed volume and flow to fill container shapes.",
        },
      ];
      const s = sciQuestions[(i - 1) % sciQuestions.length];
      qText = `${s.q} (Topic: ${cleanTopic})`;
      opts = [
        { id: "A", text: s.w1, isCorrect: false },
        { id: "B", text: s.correct, isCorrect: true },
        { id: "C", text: s.w2, isCorrect: false },
        { id: "D", text: s.w3, isCorrect: false },
      ];
      correct = "B";
      explanation = s.exp;
    } else if (lowerSubject.includes("reading") || lowerSubject.includes("english") || lowerTopic.includes("reading") || lowerTopic.includes("sight") || lowerTopic.includes("sound")) {
      const readQuestions = [
        {
          q: "What is the MAIN IDEA of a passage?",
          correct: "The central message or primary point the author conveys",
          w1: "A minor supporting detail in the middle paragraph",
          w2: "The longest word in the dictionary",
          w3: "The title on the book spine",
          exp: "The main idea expresses the overall key concept of the entire text.",
        },
        {
          q: "Which sentence contains a SIMILE (figurative comparison using 'like' or 'as')?",
          correct: "The child was as brave as a lion.",
          w1: "The snow was a white blanket.",
          w2: "The clock ticked loudly on the wall.",
          w3: "She walked to the library.",
          exp: "A simile compares two things using 'like' or 'as' ('as brave as a lion').",
        },
        {
          q: "When a story is narrated by a character using 'I', 'me', and 'my', what is the point of view?",
          correct: "First-person point of view",
          w1: "Third-person point of view",
          w2: "Omniscient perspective",
          w3: "Second-person directive",
          exp: "First-person point of view is told from the speaker's own perspective using 'I'.",
        },
        {
          q: "What is a PREFIX?",
          correct: "A word part attached to the BEGINNING of a root word to alter its meaning",
          w1: "A punctuation mark at the end of a sentence",
          w2: "The concluding chapter of a novel",
          w3: "A word part attached only at the end of a word",
          exp: "Prefixes (like un-, re-, dis-) attach to the beginning of root words.",
        },
      ];
      const r = readQuestions[(i - 1) % readQuestions.length];
      qText = `${r.q} (Topic: ${cleanTopic})`;
      opts = [
        { id: "A", text: r.w1, isCorrect: false },
        { id: "B", text: r.correct, isCorrect: true },
        { id: "C", text: r.w2, isCorrect: false },
        { id: "D", text: r.w3, isCorrect: false },
      ];
      correct = "B";
      explanation = r.exp;
    } else {
      // Default Math arithmetic based on grade level
      const a = i * 3 + 4;
      const b = i * 2 + 3;
      const sum = a + b;
      const prod = a * b;

      if (lowerGrade.includes("k") || lowerGrade.includes("1")) {
        qText = `What is ${a} + ${b}? (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${sum - 1}`, isCorrect: false },
          { id: "B", text: `${sum}`, isCorrect: true },
          { id: "C", text: `${sum + 2}`, isCorrect: false },
          { id: "D", text: `${sum + 3}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Add step-by-step: ${a} + ${b} = ${sum}.`;
      } else {
        qText = `What is ${a} × ${b}? (Topic: ${cleanTopic})`;
        opts = [
          { id: "A", text: `${prod - a}`, isCorrect: false },
          { id: "B", text: `${prod}`, isCorrect: true },
          { id: "C", text: `${prod + b}`, isCorrect: false },
          { id: "D", text: `${prod + 10}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Multiply: ${a} × ${b} = ${prod}.`;
      }
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
