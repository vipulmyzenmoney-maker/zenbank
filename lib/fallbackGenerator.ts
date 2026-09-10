import { shuffleMcqOptions } from "./shuffle";
import { filterDuplicates } from "./deduplication";

export interface GeneratedQuestion {
  questionText: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  confidence: number;
}

// Helper to pick random integer between min and max (inclusive)
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to pick a random item from an array
function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const STUDENT_NAMES = ["Aarav", "Priya", "Maya", "Lucas", "Elena", "Rohan", "Chloe", "Zayn", "Ananya", "Liam"];

/**
 * Robust, randomized, non-repeating curriculum question generator.
 * Uses parameterized templates, dynamic numbers, and randomized real-world contexts
 * to guarantee that no two questions are identical or repetitive.
 */
export function generateCurriculumQuestions(
  topic: string,
  subject: string,
  gradeLevel: string,
  count: number = 5,
  existingQuestions: string[] = []
): GeneratedQuestion[] {
  const cleanTopic = topic.trim();
  const lowerTopic = cleanTopic.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  const lowerGrade = (gradeLevel || "").toLowerCase();

  const isSocialStudies =
    lowerSubject.includes("social") ||
    lowerSubject.includes("history") ||
    lowerSubject.includes("civic") ||
    lowerSubject.includes("government") ||
    lowerSubject.includes("geography");

  const isScience =
    lowerSubject.includes("science") ||
    lowerSubject.includes("biology") ||
    lowerSubject.includes("chemistry") ||
    lowerSubject.includes("physics");

  const isReading =
    lowerSubject.includes("reading") ||
    lowerSubject.includes("english") ||
    lowerSubject.includes("language") ||
    lowerSubject.includes("literature") ||
    lowerSubject.includes("writing");

  const isMath =
    lowerSubject.includes("math") ||
    lowerSubject.includes("algebra") ||
    lowerSubject.includes("geometry") ||
    lowerSubject.includes("arithmetic") ||
    (!isSocialStudies && !isScience && !isReading);

  const generatedQuestions: GeneratedQuestion[] = [];
  const maxAttempts = count * 15;
  let attempts = 0;

  while (generatedQuestions.length < count && attempts < maxAttempts) {
    attempts++;
    const i = generatedQuestions.length + 1;
    let qText = "";
    let opts: { id: string; text: string; isCorrect: boolean }[] = [];
    let correct = "B";
    let explanation = "";
    let difficulty: "easy" | "medium" | "hard" =
      i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy";
    const confidence = 94 + (i % 6);
    const student = randChoice(STUDENT_NAMES);

    // ==========================================
    // 1. FRACTIONS & DECIMALS
    // ==========================================
    if (isMath && (lowerTopic.includes("fraction") || lowerTopic.includes("mixed number") || lowerTopic.includes("decimal"))) {
      const mode = (attempts + randInt(1, 20)) % 10;
      if (mode === 0) {
        // Unlike denominator addition
        const d1 = randChoice([2, 3, 4, 5]);
        const d2 = randChoice([3, 5, 6, 7]);
        const n1 = randInt(1, d1 - 1);
        const n2 = randInt(1, d2 - 1);
        const commonD = d1 * d2;
        const sumN = n1 * d2 + n2 * d1;
        qText = `What is ${n1}/${d1} + ${n2}/${d2}?`;
        const correctStr = `${sumN}/${commonD}`;
        opts = [
          { id: "A", text: `${n1 + n2}/${d1 + d2}`, isCorrect: false },
          { id: "B", text: correctStr, isCorrect: true },
          { id: "C", text: `${sumN - 1}/${commonD}`, isCorrect: false },
          { id: "D", text: `${sumN}/${commonD + 2}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Find the common denominator of ${d1} and ${d2}, which is ${commonD}. Step 2: Convert fractions to ${n1 * d2}/${commonD} + ${n2 * d1}/${commonD} = ${sumN}/${commonD}. 💡 Tip: Never just add the bottom numbers together!`;
      } else if (mode === 1) {
        // Mixed number / fraction word problem
        const whole = randInt(2, 5);
        const part = randInt(1, 3);
        const denom = 4;
        qText = `${student} used ${whole} ${part}/${denom} cups of flour to bake bread and gave away 1 1/${denom} cups. How much flour is left?`;
        const leftWhole = whole - 1;
        const leftPart = part >= 1 ? part - 1 : 0;
        const ans = leftPart === 0 ? `${leftWhole} cups` : `${leftWhole} ${leftPart}/${denom} cups`;
        opts = [
          { id: "A", text: `${leftWhole + 1} cups`, isCorrect: false },
          { id: "B", text: ans, isCorrect: true },
          { id: "C", text: `${leftWhole} 3/${denom} cups`, isCorrect: false },
          { id: "D", text: `${whole + 1} cups`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Subtract whole numbers: ${whole} - 1 = ${leftWhole}. Step 2: Subtract fractions: ${part}/${denom} - 1/${denom} = ${leftPart}/${denom}. Result is ${ans}. 💡 Tip: Keep wholes and fractions grouped cleanly.`;
      } else if (mode === 2) {
        // Decimal place value / multiplication
        const factor1 = (randInt(11, 49) / 10).toFixed(1);
        const factor2 = randInt(2, 6);
        const prod = (parseFloat(factor1) * factor2).toFixed(1);
        qText = `Calculate: ${factor1} × ${factor2}`;
        opts = [
          { id: "A", text: (parseFloat(prod) + 1.2).toFixed(1), isCorrect: false },
          { id: "B", text: prod, isCorrect: true },
          { id: "C", text: (parseFloat(prod) - 0.9).toFixed(1), isCorrect: false },
          { id: "D", text: (parseFloat(factor1) * factor2 * 10).toFixed(0), isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Multiply ignoring decimal: ${factor1.replace(".", "")} × ${factor2} = ${Math.round(parseFloat(factor1) * factor2 * 10)}. Step 2: Place one decimal spot to get ${prod}. 💡 Tip: Count total decimal places in factors.`;
      } else if (mode === 3) {
        // Fraction concept / unit fraction
        const den = randChoice([5, 6, 8, 10, 12]);
        qText = `In any fraction with denominator ${den}, what does the number ${den} represent?`;
        opts = [
          { id: "A", text: "The number of pieces that were taken away", isCorrect: false },
          { id: "B", text: `The total number of equal parts that make up one whole unit`, isCorrect: true },
          { id: "C", text: "The whole number multiplied by itself", isCorrect: false },
          { id: "D", text: "The remainder after division", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: The denominator (bottom number) always tells how many equal parts the whole is partitioned into. 💡 Tip: "D" for Denominator, "D" for Down at the bottom!`;
      } else if (mode === 4) {
        // Equivalent fractions
        const mult = randInt(3, 5);
        const top = randInt(2, 4);
        const bot = top + randInt(1, 3);
        qText = `Which fraction is equivalent to ${top}/${bot}?`;
        const eqStr = `${top * mult}/${bot * mult}`;
        opts = [
          { id: "A", text: `${top + 1}/${bot + 1}`, isCorrect: false },
          { id: "B", text: eqStr, isCorrect: true },
          { id: "C", text: `${top * mult}/${bot * mult + 1}`, isCorrect: false },
          { id: "D", text: `${top}/${bot * mult}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Multiply both top and bottom by ${mult}: (${top} × ${mult}) / (${bot} × ${mult}) = ${eqStr}. 💡 Tip: Whatever you do to the top, you must do to the bottom!`;
      } else if (mode === 5) {
        // Spot the Mistake (Error Analysis)
        const d1 = randChoice([3, 4, 5]);
        const d2 = randChoice([2, 5, 6]);
        const n1 = randInt(1, 2);
        const n2 = randInt(1, 2);
        qText = `${student} attempted to solve ${n1}/${d1} + ${n2}/${d2} and wrote ${n1 + n2}/${d1 + d2}. What fundamental error did ${student} make?`;
        opts = [
          { id: "A", text: "Multiplied the numerators instead of adding them", isCorrect: false },
          { id: "B", text: "Added the denominators directly instead of converting to a common denominator", isCorrect: true },
          { id: "C", text: "Simplified the fraction incorrectly at the end", isCorrect: false },
          { id: "D", text: "Subtracted the fractions instead of adding", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: ⚠️ Trap Alert: You can NEVER simply add the denominators (${d1} + ${d2}). You MUST find a common denominator first before combining parts. 💡 Memory Trick: Denominators are the name of the piece; you don't add the names!`;
      } else if (mode === 6) {
        // Visual / Spatial Number Line
        const parts = randChoice([6, 8, 10]);
        const mark = randInt(2, parts - 2);
        qText = `A number line from 0 to 1 is divided into ${parts} equal intervals. What fraction is represented by the point located at the ${mark}th tick mark past 0?`;
        opts = [
          { id: "A", text: `${parts}/${mark}`, isCorrect: false },
          { id: "B", text: `${mark}/${parts}`, isCorrect: true },
          { id: "C", text: `1/${parts}`, isCorrect: false },
          { id: "D", text: `${mark + 1}/${parts + 1}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Each tick represents 1/${parts}. Moving ${mark} ticks past 0 lands at ${mark}/${parts}. 💡 Tip: The number of jumps is the numerator, the total divisions in one whole is the denominator!`;
      } else if (mode === 7) {
        // Multi-step Word Problem (Drink / Recipe)
        const bottleSize = randChoice([1, 2]);
        const drankA = "1/4";
        const drankB = "1/3";
        qText = `${student} had a full water bottle. ${student} drank ${drankA} of it during morning recess and ${drankB} during lunch. What fraction of the bottle did ${student} drink in total?`;
        opts = [
          { id: "A", text: "2/7 of the bottle", isCorrect: false },
          { id: "B", text: "7/12 of the bottle", isCorrect: true },
          { id: "C", text: "5/12 of the bottle", isCorrect: false },
          { id: "D", text: "1/12 of the bottle", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Find common denominator for 4 and 3 (which is 12). Step 2: 1/4 = 3/12 and 1/3 = 4/12. 3/12 + 4/12 = 7/12. 💡 Tip: Always convert to like units before adding!`;
      } else if (mode === 8) {
        // Unlike denominator subtraction
        const d1 = 6;
        const d2 = 4;
        const n1 = 5;
        const n2 = 1;
        // 5/6 - 1/4 = 10/12 - 3/12 = 7/12
        qText = `Evaluate and simplify: 5/6 - 1/4`;
        opts = [
          { id: "A", text: "4/2 = 2", isCorrect: false },
          { id: "B", text: "7/12", isCorrect: true },
          { id: "C", text: "4/12 = 1/3", isCorrect: false },
          { id: "D", text: "1/2", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Least common multiple of 6 and 4 is 12. Step 2: 5/6 = 10/12, and 1/4 = 3/12. 10/12 - 3/12 = 7/12. 💡 Tip: Check your LCM to keep numbers manageable!`;
      } else {
        // Comparing / Reasoning challenge
        qText = `Which statement correctly compares the fractions 3/4 and 5/8?`;
        opts = [
          { id: "A", text: "3/4 < 5/8 because 3 is less than 5", isCorrect: false },
          { id: "B", text: "3/4 > 5/8 because 3/4 is equivalent to 6/8, and 6/8 > 5/8", isCorrect: true },
          { id: "C", text: "3/4 = 5/8 because both are greater than one half", isCorrect: false },
          { id: "D", text: "5/8 > 3/4 because the denominator 8 is larger than 4", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Convert 3/4 to eighths: (3 × 2) / (4 × 2) = 6/8. Step 2: Compare numerators: 6/8 > 5/8. ⚠️ Trap Alert: A bigger denominator actually means smaller slice sizes!`;
      }

    // ==========================================
    // 2. GEOMETRY, ANGLES, PERIMETER & 3D SHAPES
    // ==========================================
    } else if (
      isMath &&
      (lowerTopic.includes("shape") ||
        lowerTopic.includes("geometry") ||
        lowerTopic.includes("angle") ||
        lowerTopic.includes("triangle") ||
        lowerTopic.includes("perimeter") ||
        lowerTopic.includes("volume") ||
        lowerTopic.includes("prism"))
    ) {
      const mode = (attempts + randInt(1, 10)) % 6;
      if (mode === 0) {
        // Perimeter of polygon
        const sides = randInt(4, 6);
        const length = randInt(4, 12);
        const perim = sides * length;
        const shapeName = sides === 4 ? "regular square" : sides === 5 ? "regular pentagon" : "regular hexagon";
        qText = `A ${shapeName} has side lengths of ${length} cm each. What is its total perimeter?`;
        opts = [
          { id: "A", text: `${perim - sides} cm`, isCorrect: false },
          { id: "B", text: `${perim} cm`, isCorrect: true },
          { id: "C", text: `${length * length} cm`, isCorrect: false },
          { id: "D", text: `${perim + 8} cm`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Perimeter is the distance around the outside. Step 2: Multiply ${sides} sides × ${length} cm = ${perim} cm. 💡 Tip: Perimeter = Add all outer borders!`;
      } else if (mode === 1) {
        // Angles classification
        const deg = randChoice([35, 48, 72, 95, 118, 135, 160]);
        const isAcute = deg < 90;
        const angleType = isAcute ? "acute angle" : "obtuse angle";
        qText = `An angle measuring ${deg}° is classified as an...`;
        opts = [
          { id: "A", text: isAcute ? "obtuse angle (greater than 90°)" : "acute angle (less than 90°)", isCorrect: false },
          { id: "B", text: `${angleType} (${isAcute ? "less than 90°" : "greater than 90° but less than 180°"})`, isCorrect: true },
          { id: "C", text: "right angle (exactly 90°)", isCorrect: false },
          { id: "D", text: "straight angle (exactly 180°)", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Compare to 90°: ${deg}° is ${isAcute ? "less than" : "greater than"} 90°. Therefore it is an ${angleType}. 💡 Tip: Acute angles are small and "cute"; obtuse angles are open wide!`;
      } else if (mode === 2) {
        // 3D Volume
        const l = randInt(3, 8);
        const w = randInt(2, 6);
        const h = randInt(2, 5);
        const vol = l * w * h;
        qText = `What is the volume of a rectangular prism with length ${l} cm, width ${w} cm, and height ${h} cm?`;
        opts = [
          { id: "A", text: `${vol + 14} cm³`, isCorrect: false },
          { id: "B", text: `${vol} cm³`, isCorrect: true },
          { id: "C", text: `${l * w + h} cm³`, isCorrect: false },
          { id: "D", text: `${vol - 8} cm³`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Volume formula = Length × Width × Height. Step 2: ${l} × ${w} × ${h} = ${vol} cm³. 💡 Tip: Volume measures how many 1×1 unit cubes fit inside!`;
      } else if (mode === 3) {
        // Triangle classification
        const triangleTypes = [
          { name: "Equilateral", desc: "All 3 sides are of equal length and all angles are 60°", wrong: "Scalene" },
          { name: "Isosceles", desc: "Exactly 2 sides are of equal length and 2 angles are equal", wrong: "Right" },
          { name: "Scalene", desc: "All 3 sides have completely different lengths", wrong: "Equilateral" },
        ];
        const pick = randChoice(triangleTypes);
        qText = `Which triangle has ${pick.desc.toLowerCase()}?`;
        opts = [
          { id: "A", text: `${pick.wrong} triangle`, isCorrect: false },
          { id: "B", text: `${pick.name} triangle`, isCorrect: true },
          { id: "C", text: "Reflex triangle", isCorrect: false },
          { id: "D", text: "Supplementary triangle", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: An ${pick.name.toLowerCase()} triangle is defined by: ${pick.desc}. 💡 Tip: Match the side-length rules carefully!`;
      } else if (mode === 4) {
        // 3D faces, edges, vertices
        const solid = randChoice([
          { name: "rectangular prism", faces: 6, edges: 12, vertices: 8 },
          { name: "triangular pyramid", faces: 4, edges: 6, vertices: 4 },
          { name: "cube", faces: 6, edges: 12, vertices: 8 },
        ]);
        qText = `How many vertices (corner points) does a standard ${solid.name} have?`;
        opts = [
          { id: "A", text: `${solid.faces}`, isCorrect: false },
          { id: "B", text: `${solid.vertices}`, isCorrect: true },
          { id: "C", text: `${solid.edges}`, isCorrect: false },
          { id: "D", text: `${solid.vertices + 4}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Vertices are the sharp corners where 3 or more edges meet. A ${solid.name} has exactly ${solid.vertices} vertices. 💡 Tip: Faces are flat surfaces, edges are lines, vertices are corner dots!`;
      } else {
        // Parallel & Perpendicular
        qText = "When two streets cross and form four perfect square (90-degree) corners, the street lines are...";
        opts = [
          { id: "A", text: "Parallel to each other", isCorrect: false },
          { id: "B", text: "Perpendicular to each other", isCorrect: true },
          { id: "C", text: "Curved lines", isCorrect: false },
          { id: "D", text: "Skew lines that never intersect", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Lines that intersect at exact 90° right angles are perpendicular. 💡 Tip: Perpendicular lines form the letter 'T' or a plus sign '+'.";
      }

    // ==========================================
    // 3. COORDINATE PLANE & GRAPHING
    // ==========================================
    } else if (isMath && (lowerTopic.includes("coordinate") || lowerTopic.includes("cartesian") || /\bgraphing\b|\bcoordinate plane\b|\bquadrant\b/.test(lowerTopic))) {
      const mode = (attempts + randInt(1, 10)) % 4;
      if (mode === 0) {
        const x = randInt(2, 9);
        const y = randInt(2, 9);
        qText = `In the ordered pair (${x}, ${y}), what does the number ${x} instruct you to do from the origin (0, 0)?`;
        opts = [
          { id: "A", text: `Move ${x} units straight up along the y-axis`, isCorrect: false },
          { id: "B", text: `Move ${x} units horizontally to the right along the x-axis`, isCorrect: true },
          { id: "C", text: `Multiply by ${y} and stay at the origin`, isCorrect: false },
          { id: "D", text: `Move diagonally across the plane`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: In (x, y), the first coordinate is always horizontal along the x-axis. Step 2: Positive ${x} moves ${x} units right. 💡 Tip: Crawl across the floor before you climb up the ladder! (x before y).`;
      } else if (mode === 1) {
        const x = randInt(1, 8);
        const y = randInt(1, 8);
        qText = `To graph the point P(${x}, ${y}) on a coordinate grid, which sequence of steps is correct?`;
        opts = [
          { id: "A", text: `Start at (0, 0), move ${y} units right, then ${x} units up`, isCorrect: false },
          { id: "B", text: `Start at (0, 0), move ${x} units right along the x-axis, then ${y} units up along the y-axis`, isCorrect: true },
          { id: "C", text: `Start at (${x}, ${x}), move ${y} units diagonally`, isCorrect: false },
          { id: "D", text: `Move up ${y} units first, then backwards ${x} units`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Always begin at origin (0, 0). Step 2: Move right ${x} on x-axis, then up ${y} on y-axis. 💡 Tip: Alphabetical order: X comes before Y!`;
      } else if (mode === 2) {
        qText = "What is the name of the central intersection point (0, 0) where the horizontal x-axis and vertical y-axis meet?";
        opts = [
          { id: "A", text: "The Vertex", isCorrect: false },
          { id: "B", text: "The Origin", isCorrect: true },
          { id: "C", text: "The Quadrant", isCorrect: false },
          { id: "D", text: "The Midpoint", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: The point (0, 0) is called the origin because it is where all graphing begins. 💡 Tip: 'Origin' means the start or beginning!";
      } else {
        qText = "Which axis on a standard coordinate grid runs vertically from bottom to top?";
        opts = [
          { id: "A", text: "The x-axis", isCorrect: false },
          { id: "B", text: "The y-axis", isCorrect: true },
          { id: "C", text: "The diagonal axis", isCorrect: false },
          { id: "D", text: "The scale axis", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: The horizontal axis is x, and the vertical axis running up and down is y. 💡 Tip: 'Y to the sky!' (y points vertically up).";
      }

    // ==========================================
    // 4. PEMDAS & ORDER OF OPERATIONS
    // ==========================================
    } else if (isMath && (lowerTopic.includes("pemdas") || lowerTopic.includes("order of operation") || lowerTopic.includes("numerical pattern") || lowerTopic.includes("equation"))) {
      const a = randInt(3, 8);
      const b = randInt(2, 5);
      const c = randInt(3, 6);
      const inner = randInt(2, 5);
      // Expression: a + b * (c + inner)
      const res = a + b * (c + inner);
      qText = `Evaluate using the order of operations (PEMDAS): ${a} + ${b} × (${c} + ${inner})`;
      opts = [
        { id: "A", text: `${(a + b) * (c + inner)}`, isCorrect: false },
        { id: "B", text: `${res}`, isCorrect: true },
        { id: "C", text: `${res + b}`, isCorrect: false },
        { id: "D", text: `${a * b + c}`, isCorrect: false },
      ];
      correct = "B";
      explanation = `Step 1: Parentheses first: (${c} + ${inner}) = ${c + inner}. Step 2: Multiply next: ${b} × ${c + inner} = ${b * (c + inner)}. Step 3: Add last: ${a} + ${b * (c + inner)} = ${res}. 💡 Tip: PEMDAS: Parentheses, Exponents, Multiply/Divide, Add/Subtract!`;

    // ==========================================
    // 5. MEASUREMENT, DATA, MEAN & RANGE
    // ==========================================
    } else if (isMath && (lowerTopic.includes("mean") || lowerTopic.includes("median") || lowerTopic.includes("range") || lowerTopic.includes("measure") || lowerTopic.includes("convert") || lowerTopic.includes("inch") || lowerTopic.includes("meter"))) {
      const mode = (attempts + randInt(1, 10)) % 4;
      if (mode === 0) {
        // Measurement conversion
        const feet = randInt(3, 8);
        const inches = feet * 12;
        qText = `${student} measured a piece of wood that is ${feet} feet long. How many inches is this? (1 foot = 12 inches)`;
        opts = [
          { id: "A", text: `${inches - 12} inches`, isCorrect: false },
          { id: "B", text: `${inches} inches`, isCorrect: true },
          { id: "C", text: `${feet * 10} inches`, isCorrect: false },
          { id: "D", text: `${inches + 6} inches`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: There are 12 inches in each foot. Step 2: Multiply ${feet} × 12 = ${inches} inches. 💡 Tip: When converting from larger to smaller units, multiply!`;
      } else if (mode === 1) {
        // Range of dataset
        const minVal = randInt(4, 12);
        const maxVal = minVal + randInt(10, 25);
        const mid1 = minVal + randInt(2, 5);
        const mid2 = minVal + randInt(6, 9);
        const range = maxVal - minVal;
        qText = `Find the RANGE of this data set: [${minVal}, ${mid1}, ${mid2}, ${maxVal}]`;
        opts = [
          { id: "A", text: `${minVal + maxVal}`, isCorrect: false },
          { id: "B", text: `${range}`, isCorrect: true },
          { id: "C", text: `${range + 4}`, isCorrect: false },
          { id: "D", text: `${mid2 - mid1}`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Range is the difference between the greatest and least values. Step 2: ${maxVal} - ${minVal} = ${range}. 💡 Tip: Range = Highest value minus Lowest value!`;
      } else if (mode === 2) {
        // Metric conversion
        const meters = randInt(3, 9);
        const cm = meters * 100;
        qText = `Convert ${meters} meters into centimeters (1 meter = 100 centimeters):`;
        opts = [
          { id: "A", text: `${meters * 10} cm`, isCorrect: false },
          { id: "B", text: `${cm} cm`, isCorrect: true },
          { id: "C", text: `${cm + 50} cm`, isCorrect: false },
          { id: "D", text: `${meters * 1000} cm`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Each meter equals 100 centimeters. Step 2: Multiply ${meters} × 100 = ${cm} cm. 💡 Tip: 'Centi' means 100, just like 100 cents in a dollar!`;
      } else {
        // Concept of Mean
        qText = "In statistics, why is the MEAN often called the 'leveling out' or balance point of a dataset?";
        opts = [
          { id: "A", text: "Because it is always equal to the highest number", isCorrect: false },
          { id: "B", text: "Because it redistributes the total value equally across all data points", isCorrect: true },
          { id: "C", text: "Because it counts how many items are odd numbers", isCorrect: false },
          { id: "D", text: "Because it only uses the middle two numbers", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: The mean (average) adds all values and divides equally among all items. 💡 Tip: Think of leveling towers of blocks so every tower has the exact same height!";
      }

    // ==========================================
    // 6. SCIENCE (ECOSYSTEMS, MATTER, EARTH, ENERGY)
    // ==========================================
    } else if (lowerSubject.includes("science") || lowerTopic.includes("ecosystem") || lowerTopic.includes("earth") || lowerTopic.includes("matter") || lowerTopic.includes("energy")) {
      const mode = (attempts + randInt(1, 20)) % 14;
      if (mode === 0) {
        qText = "In a forest ecosystem, which of the following organisms acts as a PRODUCER by transforming sunlight into food?";
        opts = [
          { id: "A", text: "Barn Owl", isCorrect: false },
          { id: "B", text: "Fern or Pine Tree", isCorrect: true },
          { id: "C", text: "Earthworm", isCorrect: false },
          { id: "D", text: "Field Mouse", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Producers are plants that make glucose through photosynthesis using sunlight, water, and CO2. 💡 Tip: Green plants are the foundation of almost every food chain!";
      } else if (mode === 1) {
        qText = "What happens to the molecules of liquid water when water freezes into solid ice?";
        opts = [
          { id: "A", text: "They speed up and fly far apart into the air", isCorrect: false },
          { id: "B", text: "They slow down, lose thermal energy, and lock into a fixed crystalline structure", isCorrect: true },
          { id: "C", text: "They chemically transform into carbon dioxide", isCorrect: false },
          { id: "D", text: "They completely disappear", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: When liquids cool, particles lose kinetic energy and vibrate in fixed positions. 💡 Tip: Temperature is a measure of molecular motion!";
      } else if (mode === 2) {
        qText = "Which Earth system or sphere includes all lakes, glaciers, underground aquifers, and oceans?";
        opts = [
          { id: "A", text: "Atmosphere (air envelope)", isCorrect: false },
          { id: "B", text: "Hydrosphere (all Earth's water)", isCorrect: true },
          { id: "C", text: "Geosphere (rocks and crust)", isCorrect: false },
          { id: "D", text: "Biosphere (all living organisms)", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: 'Hydro' comes from the Greek word for water. The hydrosphere contains all water on, under, and above Earth. 💡 Tip: Hydro = Water, Atmo = Air, Geo = Rock, Bio = Life!";
      } else if (mode === 3) {
        qText = `When conducting a science investigation about "${cleanTopic}", why is it critical to change only ONE variable at a time?`;
        opts = [
          { id: "A", text: "To finish the experiment in less time", isCorrect: false },
          { id: "B", text: "To ensure a fair test and know exactly which variable caused the observed results", isCorrect: true },
          { id: "C", text: "Because scientists are not allowed to measure more than one thing", isCorrect: false },
          { id: "D", text: "So you never need to record data", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: In a controlled experiment, keeping all other variables constant ensures that the independent variable is the true cause of the result. 💡 Tip: Fair tests change only ONE factor at a time!";
      } else if (mode === 4) {
        qText = "What primary role do DECOMPOSERS (like fungi, mushrooms, and soil bacteria) perform in nature?";
        opts = [
          { id: "A", text: "They hunt other animals for meat", isCorrect: false },
          { id: "B", text: "They break down dead organic matter and recycle nutrients back into the soil", isCorrect: true },
          { id: "C", text: "They produce oxygen through photosynthesis", isCorrect: false },
          { id: "D", text: "They reflect sunlight back into outer space", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Decomposers break down dead plant and animal matter. Step 2: This returns vital nutrients to soil so new plants can grow. 💡 Tip: Decomposers are nature's ultimate recyclers!";
      } else if (mode === 5) {
        qText = "Which energy transformation takes place when a solar panel powers an electric fan?";
        opts = [
          { id: "A", text: "Nuclear energy transforms directly into sound energy", isCorrect: false },
          { id: "B", text: "Light (radiant) energy transforms into electrical energy, then into mechanical (kinetic) energy", isCorrect: true },
          { id: "C", text: "Chemical energy transforms into gravitational energy", isCorrect: false },
          { id: "D", text: "Thermal energy creates new atoms", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: The solar cell absorbs radiant light photons and produces electrical current. Step 2: The motor converts electricity into mechanical rotation. 💡 Tip: Energy cannot be created or destroyed, only transformed!";
      } else if (mode === 6) {
        qText = "During the water cycle, what term describes water vapor cooling and changing from a gas back into liquid droplets to form clouds?";
        opts = [
          { id: "A", text: "Evaporation", isCorrect: false },
          { id: "B", text: "Condensation", isCorrect: true },
          { id: "C", text: "Precipitation", isCorrect: false },
          { id: "D", text: "Transpiration", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Evaporation turns liquid into gas. Step 2: Condensation cools gas back into tiny liquid drops that cluster into clouds. 💡 Tip: Think of cold dew condensing on a cold glass in summer!";
      } else if (mode === 7) {
        qText = "Two forces act on a wooden block: 10 Newtons pushing right and 10 Newtons pushing left. What is the net force and movement of the block?";
        opts = [
          { id: "A", text: "20 Newtons right; the block accelerates rapidly", isCorrect: false },
          { id: "B", text: "0 Newtons; the forces are balanced so the block does not accelerate", isCorrect: true },
          { id: "C", text: "10 Newtons upward; the block floats", isCorrect: false },
          { id: "D", text: "5 Newtons left; friction overcomes all forces", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Equal and opposite forces cancel out: 10 N - 10 N = 0 N. Step 2: A net force of zero means motion does not change. 💡 Tip: Balanced forces = zero acceleration!";
      } else if (mode === 8) {
        qText = "Which type of rock is formed when layers of sediment, sand, and mineral fragments are compressed and cemented over millions of years?";
        opts = [
          { id: "A", text: "Igneous rock (hardened lava)", isCorrect: false },
          { id: "B", text: "Sedimentary rock (e.g., sandstone, limestone, shale)", isCorrect: true },
          { id: "C", text: "Metamorphic rock (altered by extreme heat and pressure)", isCorrect: false },
          { id: "D", text: "Volcanic obsidian glass", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Weathering and erosion break down rocks. Step 2: Deposition, compaction, and cementation form sedimentary rock layers. 💡 Tip: Look for fossils—they are almost always preserved in sedimentary rock!";
      } else if (mode === 9) {
        qText = "How do camouflage and thick insulating blubber help an Arctic seal survive in its polar biome?";
        opts = [
          { id: "A", text: "They allow the animal to photosynthesize energy from snow", isCorrect: false },
          { id: "B", text: "They provide physical adaptations that conserve body heat and conceal the seal from predators", isCorrect: true },
          { id: "C", text: "They eliminate the seal's need to drink or eat food", isCorrect: false },
          { id: "D", text: "They change the climate of the surrounding arctic waters", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Blubber traps body heat in freezing temperatures. Step 2: Camouflage hides the animal against snow and ice. 💡 Tip: Physical adaptations are body traits that aid survival!";
      } else if (mode === 10) {
        qText = "Which of the following is considered a RENEWABLE natural energy resource?";
        opts = [
          { id: "A", text: "Coal burned in power plants", isCorrect: false },
          { id: "B", text: "Wind harnessed through modern turbines", isCorrect: true },
          { id: "C", text: "Crude petroleum oil drilled from underground", isCorrect: false },
          { id: "D", text: "Uranium extracted from mines", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Renewable resources naturally replenish on a human timescale (wind, solar, hydro). Fossil fuels take millions of years to form. 💡 Tip: Wind and sunlight never run out!";
      } else if (mode === 11) {
        qText = "What causes the predictable cycle of day and night on planet Earth?";
        opts = [
          { id: "A", text: "The moon moving directly between the Earth and Sun", isCorrect: false },
          { id: "B", text: "The rotation of Earth on its own central axis once every 24 hours", isCorrect: true },
          { id: "C", text: "The revolution of Earth in its year-long orbit around the Sun", isCorrect: false },
          { id: "D", text: "The Sun turning its light off and on periodically", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Rotation = spinning on its axis (takes 24 hours, creates day/night). Step 2: Revolution = orbiting the Sun (takes 365 days, creates seasons). 💡 Tip: Spin = Day; Orbit = Year!";
      } else if (mode === 12) {
        qText = "When iron nails are left outside in moist air, they react with oxygen to form reddish-brown rust. This process is an example of...";
        opts = [
          { id: "A", text: "A reversible physical change in shape only", isCorrect: false },
          { id: "B", text: "A chemical reaction forming an entirely new substance (iron oxide)", isCorrect: true },
          { id: "C", text: "Evaporation of iron atoms into a gas", isCorrect: false },
          { id: "D", text: "Static electricity discharge", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Rusting creates a completely new compound (iron oxide) with different chemical properties. 💡 Tip: Chemical changes create new substances; physical changes only change state or appearance!";
      } else {
        qText = `Why do scientists use physical or digital computer models when studying "${cleanTopic}"?`;
        opts = [
          { id: "A", text: "To replace all laboratory experiments permanently", isCorrect: false },
          { id: "B", text: "To visualize, analyze, and test systems that are too massive, microscopic, dangerous, or slow to study directly", isCorrect: true },
          { id: "C", text: "Because models are guaranteed to be 100% free of uncertainty", isCorrect: false },
          { id: "D", text: "To prevent other scientists from verifying their hypotheses", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Scientific models represent complex systems (like solar systems, atoms, or weather) so we can run simulations and test predictions. 💡 Tip: Models help us see the unseeable!";
      }

    // ==========================================
    // 7. SOCIAL STUDIES & CIVICS
    // ==========================================
    } else if (lowerSubject.includes("social") || lowerSubject.includes("history") || lowerSubject.includes("geography") || lowerSubject.includes("civic")) {
      const mode = (attempts + randInt(1, 20)) % 16;
      if (mode === 0) {
        qText = `Which of the following is considered a PRIMARY SOURCE when researching "${cleanTopic}"?`;
        opts = [
          { id: "A", text: "A modern encyclopedia article written 100 years later", isCorrect: false },
          { id: "B", text: "A diary entry, original photograph, or letter written by a person who experienced the event firsthand", isCorrect: true },
          { id: "C", text: "A fictional movie inspired by the historical period", isCorrect: false },
          { id: "D", text: "A summary chapter in a school textbook", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Primary sources are direct, firsthand evidence created during the actual time of the event. 💡 Tip: Primary = Firsthand witness; Secondary = Secondhand retelling!`;
      } else if (mode === 1) {
        qText = `Why do democratic communities establish written constitutions and rule of law regarding "${cleanTopic}"?`;
        opts = [
          { id: "A", text: "To give unlimited power to a single ruler without oversight", isCorrect: false },
          { id: "B", text: "To protect individual rights, establish clear limits on government, and ensure justice for all citizens", isCorrect: true },
          { id: "C", text: "To eliminate all public debate and community elections", isCorrect: false },
          { id: "D", text: "Because legal codes can never be amended or updated", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Constitutions create the fundamental framework for government, balancing public order with individual liberties. 💡 Tip: The Rule of Law applies equally to everyone, including leaders!";
      } else if (mode === 2) {
        qText = `When studying "${cleanTopic}", analyzing CAUSE AND EFFECT helps students understand...`;
        opts = [
          { id: "A", text: "Only the exact dates on a calendar", isCorrect: false },
          { id: "B", text: "Why historical events occurred and how their consequences shaped society and future generations", isCorrect: true },
          { id: "C", text: "How to solve algebraic equations", isCorrect: false },
          { id: "D", text: "The spelling of geographic names only", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Cause explains why an event began; effect examines the long-term impact on communities. 💡 Tip: Always ask: 'What sparked this, and what changed as a result?'";
      } else if (mode === 3) {
        qText = "Which geographic tool would be MOST effective for analyzing the physical elevation, mountains, rivers, and terrain of a region?";
        opts = [
          { id: "A", text: "A political map showing voting districts and boundary lines", isCorrect: false },
          { id: "B", text: "A topographic or physical elevation map", isCorrect: true },
          { id: "C", text: "A bar graph showing annual city tax revenue", isCorrect: false },
          { id: "D", text: "A dictionary index of state capitals", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Topographic maps use contour lines and color shading to display natural physical landforms and elevations. 💡 Tip: Physical maps show the land; political maps show boundaries made by people!";
      } else if (mode === 4) {
        qText = "In a constitutional democracy with three branches of government, what is the core purpose of 'CHECKS AND BALANCES'?";
        opts = [
          { id: "A", text: "To ensure that one branch holds supreme authority over the others", isCorrect: false },
          { id: "B", text: "To prevent any single branch from abusing power by allowing each branch to oversee and limit the others", isCorrect: true },
          { id: "C", text: "To calculate annual bank deposits for public schools", isCorrect: false },
          { id: "D", text: "To replace elections with permanent judicial appointments", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: The Legislative (makes laws), Executive (enforces laws), and Judicial (interprets laws) branches check each other so no monarch or dictator emerges. 💡 Tip: Divided power protects citizen liberty!";
      } else if (mode === 5) {
        qText = "In economics, what fundamental concept explains why people, businesses, and nations must make choices about how to allocate limited resources?";
        opts = [
          { id: "A", text: "Unlimited abundance of all natural materials", isCorrect: false },
          { id: "B", text: "Scarcity (wants and needs exceed available resources)", isCorrect: true },
          { id: "C", text: "Price ceilings that never fluctuate", isCorrect: false },
          { id: "D", text: "Barter systems that forbid currency", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Scarcity means resources (time, money, land) are limited, while human desires are virtually unlimited. 💡 Tip: Every choice has an 'opportunity cost'—the next best thing you give up!";
      } else if (mode === 6) {
        qText = "Which of the following is considered an essential CIVIC RESPONSIBILITY of citizens in a democratic republic?";
        opts = [
          { id: "A", text: "Holding public office for life without term limits", isCorrect: false },
          { id: "B", text: "Staying informed, participating in elections (voting), and serving on juries when summoned", isCorrect: true },
          { id: "C", text: "Refusing to pay local municipal taxes", isCorrect: false },
          { id: "D", text: "Only obeying laws that you personally agree with", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Civic responsibilities ensure that government remains accountable to the people. 💡 Tip: Rights are what you receive; responsibilities are how you contribute to your community!";
      } else if (mode === 7) {
        qText = "How did major river valleys (such as the Nile, Tigris-Euphrates, and Indus) encourage the development of the earliest human civilizations?";
        opts = [
          { id: "A", text: "They made building defensive castles completely unnecessary", isCorrect: false },
          { id: "B", text: "They provided fertile silt for agriculture, fresh water for drinking, and natural routes for travel and trade", isCorrect: true },
          { id: "C", text: "They prevented all migration from neighboring regions", isCorrect: false },
          { id: "D", text: "They experienced freezing blizzards that preserved harvested crops", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Annual river flooding deposited nutrient-rich silt, enabling farmers to produce food surpluses that supported towns and cities. 💡 Tip: Water and fertile soil are the seeds of early civilization!";
      } else if (mode === 8) {
        qText = "When historians evaluate a written account of a historical conflict, why is it vital to identify the author's POINT OF VIEW or possible BIAS?";
        opts = [
          { id: "A", text: "To prove that all historical writings are completely false", isCorrect: false },
          { id: "B", text: "To understand the writer's motivations, background, and whether their perspective influenced what facts they included or omitted", isCorrect: true },
          { id: "C", text: "So you can rewrite the document using modern slang", isCorrect: false },
          { id: "D", text: "Because only eyewitnesses who won the conflict are allowed to write history", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Every writer has a background and worldview that shapes how they interpret events. Comparing multiple perspectives reveals the fuller truth. 💡 Tip: Good historians cross-examine sources like detectives!";
      } else if (mode === 9) {
        qText = "What term describes the exchange and spreading of goods, ideas, technologies, and religious beliefs between different cultures along historical trade routes?";
        opts = [
          { id: "A", text: "Cultural isolation", isCorrect: false },
          { id: "B", text: "Cultural diffusion", isCorrect: true },
          { id: "C", text: "Geographic stagnation", isCorrect: false },
          { id: "D", text: "Monopoly control", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: When merchants and travelers journeyed along routes like the Silk Road, they traded spices, silk, and paper, sharing knowledge and languages. 💡 Tip: Diffusion = spread from one culture to another!";
      } else if (mode === 10) {
        qText = "In a free-market economy, what typically happens to the price of a popular seasonal good if consumer demand rises sharply while supply remains scarce?";
        opts = [
          { id: "A", text: "The market price remains identical forever", isCorrect: false },
          { id: "B", text: "The market price tends to increase because buyers compete for limited units", isCorrect: true },
          { id: "C", text: "The market price drops to zero immediately", isCorrect: false },
          { id: "D", text: "The government forbids anyone from selling the item", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: High demand + low supply = higher prices (scarcity premium). Step 2: Low demand + excess supply = falling prices. 💡 Tip: The price balances supply with demand!";
      } else if (mode === 11) {
        qText = `When organizing a historical study of "${cleanTopic}", why do historians arrange key milestones on a CHRONOLOGICAL TIMELINE?`;
        opts = [
          { id: "A", text: "To fit as many random words on one poster as possible", isCorrect: false },
          { id: "B", text: "To analyze the sequence of events over time and understand how earlier developments influenced later outcomes", isCorrect: true },
          { id: "C", text: "To prove that nothing ever changed in human history", isCorrect: false },
          { id: "D", text: "Because events in history happen in reverse alphabetical order", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Chronology tracks events from earliest to most recent, revealing historical patterns and cause-effect chains. 💡 Tip: Chronos = Time; Logic = Order!";
      } else if (mode === 12) {
        qText = "Which level of government in the United States typically manages local community services such as fire departments, police patrols, city parks, and trash collection?";
        opts = [
          { id: "A", text: "The Federal United Nations treaty council", isCorrect: false },
          { id: "B", text: "Local municipal / city or county government", isCorrect: true },
          { id: "C", text: "The national Supreme Court", isCorrect: false },
          { id: "D", text: "Foreign diplomatic ambassadors", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Federal handles national defense and foreign treaties; State manages highways and licensing; Local handles community neighborhood services. 💡 Tip: Local government is closest to your front door!";
      } else if (mode === 13) {
        qText = "How did the invention of the steam engine and mechanized factories during the Industrial Revolution change where the majority of people lived and worked?";
        opts = [
          { id: "A", text: "People abandoned cities to return to subsistence farming", isCorrect: false },
          { id: "B", text: "Massive populations migrated from rural farming villages into rapidly growing urban manufacturing centers (urbanization)", isCorrect: true },
          { id: "C", text: "Transportation between distant regions ceased completely", isCorrect: false },
          { id: "D", text: "All manufacturing was shifted back into individual home workshops", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Steam-powered machinery centralized production in factories located near rail and waterways, driving urbanization. 💡 Tip: Industrialization transformed agrarian life into urban society!";
      } else if (mode === 14) {
        qText = "Which constitutional protection ensures that an individual accused of a crime has the right to a fair, speedy, and public trial by an impartial jury?";
        opts = [
          { id: "A", text: "The system of royal decrees", isCorrect: false },
          { id: "B", text: "Due process of law protected in the Bill of Rights (Sixth Amendment)", isCorrect: true },
          { id: "C", text: "Executive privilege of state governors", isCorrect: false },
          { id: "D", text: "Unconditional martial law", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Due process guarantees legal fairness, representation by counsel, and impartial jury evaluation before any liberty or property is restricted. 💡 Tip: Due process ensures justice before judgment!";
      } else {
        qText = `When examining historical artifacts or archaeological relics connected to "${cleanTopic}", what can researchers determine about ancient communities?`;
        opts = [
          { id: "A", text: "Only the exact names of every citizen who ever lived", isCorrect: false },
          { id: "B", text: "Their technological capabilities, daily tools, trading networks, and religious or artistic traditions", isCorrect: true },
          { id: "C", text: "That ancient civilizations had identical technologies to modern smartphone eras", isCorrect: false },
          { id: "D", text: "Nothing factual because physical objects cannot provide historical clues", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Pottery, tools, architecture, and burial sites provide tangible clues about how people lived, ate, and traded long before written records. 💡 Tip: Artifacts are the physical clues left behind by history!";
      }

    // ==========================================
    // 8. READING & LANGUAGE ARTS
    // ==========================================
    } else if (lowerSubject.includes("reading") || lowerSubject.includes("english") || lowerSubject.includes("language")) {
      const mode = (attempts + randInt(1, 20)) % 12;
      if (mode === 0) {
        qText = "Read the sentence: 'The stars were diamond jewels scattered across the dark night velvet.' What figurative language device is used here?";
        opts = [
          { id: "A", text: "Simile (using like or as)", isCorrect: false },
          { id: "B", text: "Metaphor (direct comparison without like or as)", isCorrect: true },
          { id: "C", text: "Onomatopoeia (sound word)", isCorrect: false },
          { id: "D", text: "Literal scientific fact", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: The sentence directly states the stars WERE jewels and the sky was velvet without using 'like' or 'as'. That makes it a metaphor! 💡 Tip: Metaphors say one thing IS another!";
      } else if (mode === 1) {
        qText = "When an author describes a character's actions and trembling speech instead of explicitly stating that they are frightened, what reading strategy must the student use?";
        opts = [
          { id: "A", text: "Consulting an alphabetized table of contents", isCorrect: false },
          { id: "B", text: "Making an inference by combining text evidence with personal background knowledge", isCorrect: true },
          { id: "C", text: "Memorizing all spelling words phonetically", isCorrect: false },
          { id: "D", text: "Skimming only the first sentence of the book", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Inferring means reading between the lines using clues from the text plus your own understanding. 💡 Tip: Text Clues + What You Know = Inference!";
      } else if (mode === 2) {
        qText = "What is the primary function of a PREFIX (such as 'un-', 're-', or 'mis-') when attached to a base root word?";
        opts = [
          { id: "A", text: "It ends a paragraph with appropriate punctuation marks", isCorrect: false },
          { id: "B", text: "It attaches to the beginning of a root word to alter or reverse its fundamental meaning", isCorrect: true },
          { id: "C", text: "It transforms a noun into a vowel sound", isCorrect: false },
          { id: "D", text: "It is only used when writing rhyming poetry", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: 'Pre' means before. Attaching 'un-' to 'wrap' creates 'unwrap' (the opposite). 💡 Tip: Pre = Before, Fix = Attach!";
      } else if (mode === 3) {
        qText = "Which text structure organizes informational writing by explaining why something occurred and what resulted from that event?";
        opts = [
          { id: "A", text: "Problem and Solution only", isCorrect: false },
          { id: "B", text: "Cause and Effect", isCorrect: true },
          { id: "C", text: "Compare and Contrast", isCorrect: false },
          { id: "D", text: "Spatial / Descriptive layout only", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Cause is the catalyst; effect is the outcome or consequence. Look for transitional signal words: 'therefore', 'as a result', 'because'. 💡 Tip: Why it happened = Cause; What happened = Effect!";
      } else if (mode === 4) {
        qText = "What is the MAIN IDEA of an informational text, and how does it differ from supporting details?";
        opts = [
          { id: "A", text: "The main idea is a single random minor fact mentioned in paragraph three", isCorrect: false },
          { id: "B", text: "The main idea is the primary overarching point the author wants readers to understand, supported by specific evidence", isCorrect: true },
          { id: "C", text: "The main idea is always identical to the dictionary definition of the title", isCorrect: false },
          { id: "D", text: "There is no difference between a main idea and a supporting detail", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: The main idea is the big umbrella concept. Supporting details are facts, statistics, and examples that hold that umbrella up! 💡 Tip: Main Idea = The point; Details = The proof!";
      } else if (mode === 5) {
        qText = "From which POINT OF VIEW is a story narrated when the speaker uses pronouns like 'I', 'me', 'my', and 'we'?";
        opts = [
          { id: "A", text: "Third-Person Omniscient", isCorrect: false },
          { id: "B", text: "First-Person Point of View", isCorrect: true },
          { id: "C", text: "Second-Person Instruction ('you')", isCorrect: false },
          { id: "D", text: "Third-Person Objective", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: First person is told from the narrator's personal perspective using 'I' and 'we'. 💡 Tip: 1st person = I am in the story; 3rd person = He, she, or they are in the story!";
      } else if (mode === 6) {
        qText = "Read the phrase: 'Her backpack weighed ten thousand pounds on the first day of school!' What literary device is being used for dramatic effect?";
        opts = [
          { id: "A", text: "Understatement", isCorrect: false },
          { id: "B", text: "Hyperbole (deliberate, extreme exaggeration)", isCorrect: true },
          { id: "C", text: "Personification", isCorrect: false },
          { id: "D", text: "Literal mathematical measurement", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: A backpack cannot literally weigh 10,000 lbs; the author is intentionally exaggerating to emphasize how heavy it felt. That is hyperbole! 💡 Tip: Hyperbole = Hyper-exaggeration!";
      } else if (mode === 7) {
        qText = "When readers encounter an unfamiliar vocabulary word in a complex paragraph, what are 'CONTEXT CLUES'?";
        opts = [
          { id: "A", text: "The page numbers and header titles at the top of the book", isCorrect: false },
          { id: "B", text: "Surrounding words, synonyms, antonyms, or explanations in nearby sentences that hint at the word's meaning", isCorrect: true },
          { id: "C", text: "Only the illustrations drawn on the book cover", isCorrect: false },
          { id: "D", text: "The author's biography on the back jacket", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Authors often leave clues in the surrounding sentence—such as restatements or contrast words—to reveal meaning. 💡 Tip: Look at the sentence before and after the mystery word!";
      } else if (mode === 8) {
        qText = "What distinguishes an AUTHOR'S PURPOSE when writing a persuasive essay versus an informative textbook chapter?";
        opts = [
          { id: "A", text: "A persuasive essay only uses rhymes, while a textbook uses capital letters", isCorrect: false },
          { id: "B", text: "A persuasive essay aims to convince the reader to adopt a viewpoint, whereas an informative text aims to educate using objective facts", isCorrect: true },
          { id: "C", text: "There is no difference; all texts share the identical purpose", isCorrect: false },
          { id: "D", text: "Persuasive essays never include reasons or arguments", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Remember 'PIE': Persuade (convince), Inform (teach facts), Entertain (amuse or tell a story). 💡 Tip: Check if the author is arguing a side or presenting neutral facts!";
      } else if (mode === 9) {
        qText = "In literature, what is the THEME of a fictional story or fable?";
        opts = [
          { id: "A", text: "The physical city or country where the characters reside", isCorrect: false },
          { id: "B", text: "The underlying universal lesson, moral, or message about human life conveyed through the story", isCorrect: true },
          { id: "C", text: "The list of characters in order of appearance", isCorrect: false },
          { id: "D", text: "The font size chosen by the printer", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: The theme is the deeper insight (e.g., 'Courage overcomes fear' or 'Honesty builds trust') that applies beyond the characters. 💡 Tip: Theme = The 'Me'ssage of the story!";
      } else if (mode === 10) {
        qText = "Read the sentence: 'The angry thunderstorm screamed outside our shuttered windows.' What literary technique gives human qualities to non-human things?";
        opts = [
          { id: "A", text: "Alliteration", isCorrect: false },
          { id: "B", text: "Personification", isCorrect: true },
          { id: "C", text: "Oxymoron", isCorrect: false },
          { id: "D", text: "Irony", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Storms cannot literally feel anger or scream; giving human emotions and actions to weather is personification. 💡 Tip: 'Person'ification turns things into persons!";
      } else {
        qText = "Which non-fiction text feature is located at the back of a reference book and lists specific topics, names, and keywords alphabetically with their corresponding page numbers?";
        opts = [
          { id: "A", text: "Table of Contents", isCorrect: false },
          { id: "B", text: "Index", isCorrect: true },
          { id: "C", text: "Dedication Page", isCorrect: false },
          { id: "D", text: "Title Copyright Header", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: An index appears at the very back, alphabetizing exact terms with page numbers. The Table of Contents is at the front and shows chapters in order. 💡 Tip: Index = Alphabetical lookup at the back!";
      }

    // ==========================================
    // 9. GENERAL HIGH-DIVERSITY COGNITIVE ENGINE
    // ==========================================
    } else {
      const mode = (attempts + randInt(1, 20)) % 12;
      if (mode === 0) {
        qText = `When analyzing "${cleanTopic}" in ${subject}, what is the foundational principle that guides accurate problem-solving?`;
        opts = [
          { id: "A", text: "Assuming that standard rules change randomly each day", isCorrect: false },
          { id: "B", text: `Understanding the core concepts, identifying known conditions, and applying verified systematic rules of ${subject}`, isCorrect: true },
          { id: "C", text: "Guessing the first option that appears without reviewing evidence", isCorrect: false },
          { id: "D", text: "Discarding all factual data that requires calculation", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Mastery of "${cleanTopic}" begins with solid grasp of fundamentals and methodical reasoning. 💡 Tip: Break complex problems into smaller, manageable steps!`;
      } else if (mode === 1) {
        qText = `A ${gradeLevel} student is investigating a scenario involving "${cleanTopic}". What is the MOST effective first step in approaching the challenge?`;
        opts = [
          { id: "A", text: "Jump immediately to a conclusion without reading the details", isCorrect: false },
          { id: "B", text: "Clarify what question must be answered, isolate the given information, and determine which method or tool applies", isCorrect: true },
          { id: "C", text: "Assume the problem is impossible to solve with the given information", isCorrect: false },
          { id: "D", text: "Copy an answer from an unrelated problem", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Successful problem-solvers always define the goal and organize their knowns before computing. 💡 Tip: Understand the goal before starting the work!`;
      } else if (mode === 2) {
        qText = `How does deep understanding of "${cleanTopic}" connect directly to practical, real-world applications?`;
        opts = [
          { id: "A", text: "It is strictly theoretical and has zero application outside a classroom", isCorrect: false },
          { id: "B", text: `It enables individuals to make evidence-based decisions, interpret real-world patterns, and design effective solutions in ${subject}`, isCorrect: true },
          { id: "C", text: "It is solely used to memorize trivia for quick quizzes", isCorrect: false },
          { id: "D", text: "It only applies to historical centuries with no relevance today", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: The concepts in "${cleanTopic}" provide thinking models that professionals and citizens use daily. 💡 Tip: Knowledge becomes powerful when applied to real life!`;
      } else if (mode === 3) {
        qText = `Which habit of mind is MOST critical for demonstrating true mastery of "${cleanTopic}"?`;
        opts = [
          { id: "A", text: "Memorizing surface steps without understanding why they work", isCorrect: false },
          { id: "B", text: "Being able to explain your reasoning clearly and adapt principles to new, unfamiliar problem contexts", isCorrect: true },
          { id: "C", text: "Relying strictly on rapid guessing", isCorrect: false },
          { id: "D", text: "Ignoring vocabulary definitions and notation standards", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Conceptual clarity allows you to transfer knowledge to new situations. 💡 Tip: If you can teach the concept in your own words, you truly own it!`;
      } else if (mode === 4) {
        qText = `When evaluating conflicting information or arguments related to "${cleanTopic}", how should a student verify accuracy?`;
        opts = [
          { id: "A", text: "Believe whichever claim has the most dramatic headline", isCorrect: false },
          { id: "B", text: "Cross-examine the evidence against credible primary data, logical consistency, and established principles of ${subject}", isCorrect: true },
          { id: "C", text: "Select whichever statement was written most recently without checking facts", isCorrect: false },
          { id: "D", text: "Rely exclusively on personal preference without proof", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Critical thinkers evaluate sources, test logic, and weigh evidence before accepting claims. 💡 Tip: Sound evidence is the anchor of truth!";
      } else if (mode === 5) {
        qText = `In ${subject}, what is a common pitfall or misconception students encounter when working with "${cleanTopic}"?`;
        opts = [
          { id: "A", text: "Taking the time to double-check their completed work", isCorrect: false },
          { id: "B", text: "Overlooking key constraints, confusing similar terminology, or rushing without verifying the units or conditions", isCorrect: true },
          { id: "C", text: "Drawing diagrams to visualize the problem structure", isCorrect: false },
          { id: "D", text: "Consulting established reference formulas", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Paying attention to specific constraints and units prevents easy mistakes. 💡 Tip: Reread the question after solving to ensure your answer matches what was asked!`;
      } else if (mode === 6) {
        qText = `How can a student determine whether their solution or explanation for "${cleanTopic}" is reasonable?`;
        opts = [
          { id: "A", text: "Assume any generated number must be correct without inspection", isCorrect: false },
          { id: "B", text: "Check whether the result fits the expected scale, satisfies all prompt constraints, and makes logical sense in context", isCorrect: true },
          { id: "C", text: "Make sure the answer matches an unrelated problem from yesterday", isCorrect: false },
          { id: "D", text: "Only check if the answer is an even number", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Estimation and sanity checking provide a safety net against computational or conceptual blunders. 💡 Tip: Ask yourself: 'Does this answer make sense in the real world?'";
      } else if (mode === 7) {
        qText = `When communicating findings or solutions regarding "${cleanTopic}", what makes an explanation most convincing?`;
        opts = [
          { id: "A", text: "Using emotional language without citing examples", isCorrect: false },
          { id: "B", text: "Providing a clear sequence of steps backed by factual evidence, precise terminology, and logical justification", isCorrect: true },
          { id: "C", text: "Keeping the explanation completely secret from peers", isCorrect: false },
          { id: "D", text: "Using vague generalities without specific details", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Clear communication combines precise vocabulary with step-by-step evidence. 💡 Tip: Show your work and justify your thinking clearly!";
      } else if (mode === 8) {
        qText = `If one of the central conditions or variables in "${cleanTopic}" is altered, what should a student do to predict the outcome?`;
        opts = [
          { id: "A", text: "Assume the outcome will remain completely identical no matter what changes", isCorrect: false },
          { id: "B", text: "Trace how the altered condition impacts each interconnected component of the system or calculation", isCorrect: true },
          { id: "C", text: "Ignore the change because variables do not affect outcomes", isCorrect: false },
          { id: "D", text: "Choose an outcome by coin flip", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Systems thinking involves tracking cause-and-effect relationships when conditions change. 💡 Tip: Trace the chain reaction one link at a time!";
      } else if (mode === 9) {
        qText = `What is the benefit of comparing two different valid approaches to solving a problem in "${cleanTopic}"?`;
        opts = [
          { id: "A", text: "It causes confusion and should never be attempted", isCorrect: false },
          { id: "B", text: "It deepens conceptual flexibility, highlights efficiency trade-offs, and verifies the accuracy of the result", isCorrect: true },
          { id: "C", text: "It proves that one approach must always be illegal", isCorrect: false },
          { id: "D", text: "It triples the amount of time needed for simple tasks", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Seeing multiple paths to a solution confirms the answer and builds mathematical/conceptual versatility. 💡 Tip: Different paths can lead to the same summit!";
      } else if (mode === 10) {
        qText = `Which tool or strategy is most helpful when synthesizing multiple pieces of information about "${cleanTopic}"?`;
        opts = [
          { id: "A", text: "Ignoring all data that contradicts your first guess", isCorrect: false },
          { id: "B", text: "Organizing information into a visual graphic organizer, comparison chart, or step-by-step outline", isCorrect: true },
          { id: "C", text: "Relying purely on memory without taking any notes", isCorrect: false },
          { id: "D", text: "Deleting half the data points at random", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Graphic organizers and structured notes allow you to see connections between ideas clearly. 💡 Tip: Visual structure brings mental clarity!";
      } else {
        qText = `How does continuous reflection on "${cleanTopic}" support ongoing academic growth in ${subject}?`;
        opts = [
          { id: "A", text: "It guarantees that no further practice is ever required", isCorrect: false },
          { id: "B", text: "It helps identify strengths, clarify lingering questions, and build confidence for tackling advanced material", isCorrect: true },
          { id: "C", text: "It causes previously mastered skills to be forgotten", isCorrect: false },
          { id: "D", text: "It has no relationship to learning progress", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Metacognition—thinking about how you learn—turns practice into lasting mastery. 💡 Tip: Reflect on what worked and what you learned from every problem!`;
      }
    }

    const shuffled = shuffleMcqOptions(opts, correct);
    const candidate: GeneratedQuestion = {
      questionText: qText,
      options: shuffled.options,
      correctAnswer: shuffled.correctAnswer,
      explanation,
      difficulty,
      confidence,
    };

    // Deduplicate against existing questions and against previously generated in this run
    const allSeen = [...existingQuestions, ...generatedQuestions.map((g) => g.questionText)];
    const { duplicatesFound } = filterDuplicates([candidate], allSeen, 0.70);

    if (duplicatesFound === 0) {
      generatedQuestions.push(candidate);
    }
  }

  return generatedQuestions;
}
