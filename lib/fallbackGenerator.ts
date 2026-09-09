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

  const generatedQuestions: GeneratedQuestion[] = [];
  const maxAttempts = count * 4;
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
    if (lowerTopic.includes("fraction") || lowerTopic.includes("mixed number") || lowerTopic.includes("decimal")) {
      const mode = (attempts + randInt(1, 10)) % 5;
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
      } else {
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
      }

    // ==========================================
    // 2. GEOMETRY, ANGLES, PERIMETER & 3D SHAPES
    // ==========================================
    } else if (
      lowerTopic.includes("shape") ||
      lowerTopic.includes("geometry") ||
      lowerTopic.includes("angle") ||
      lowerTopic.includes("triangle") ||
      lowerTopic.includes("perimeter") ||
      lowerTopic.includes("volume") ||
      lowerTopic.includes("prism")
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
    } else if (lowerTopic.includes("coordinate") || lowerTopic.includes("graph") || lowerTopic.includes("plane")) {
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
    } else if (lowerTopic.includes("pemdas") || lowerTopic.includes("order of operation") || lowerTopic.includes("numerical pattern") || lowerTopic.includes("equation")) {
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
    } else if (lowerTopic.includes("mean") || lowerTopic.includes("median") || lowerTopic.includes("range") || lowerTopic.includes("measure") || lowerTopic.includes("convert") || lowerTopic.includes("inch") || lowerTopic.includes("meter")) {
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
      const mode = (attempts + randInt(1, 10)) % 5;
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
      } else {
        qText = "What primary role do DECOMPOSERS (like fungi, mushrooms, and soil bacteria) perform in nature?";
        opts = [
          { id: "A", text: "They hunt other animals for meat", isCorrect: false },
          { id: "B", text: "They break down dead organic matter and recycle nutrients back into the soil", isCorrect: true },
          { id: "C", text: "They produce oxygen through photosynthesis", isCorrect: false },
          { id: "D", text: "They reflect sunlight back into outer space", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Decomposers break down dead plant and animal matter. Step 2: This returns vital nutrients to soil so new plants can grow. 💡 Tip: Decomposers are nature's ultimate recyclers!";
      }

    // ==========================================
    // 7. SOCIAL STUDIES & CIVICS
    // ==========================================
    } else if (lowerSubject.includes("social") || lowerSubject.includes("history") || lowerSubject.includes("geography") || lowerSubject.includes("civic")) {
      const mode = (attempts + randInt(1, 10)) % 4;
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
        qText = `Why do democratic communities establish written laws and rules related to "${cleanTopic}"?`;
        opts = [
          { id: "A", text: "To give all power to a single individual", isCorrect: false },
          { id: "B", text: "To protect individual rights, ensure public safety, and resolve disputes peacefully", isCorrect: true },
          { id: "C", text: "To prevent citizens from communicating with each other", isCorrect: false },
          { id: "D", text: "Because rules cannot be changed once written", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: The rule of law exists to protect equal rights, maintain order, and ensure justice for everyone. 💡 Tip: Laws protect both freedom and safety!";
      } else if (mode === 2) {
        qText = `When studying "${cleanTopic}", analyzing CAUSE AND EFFECT helps students understand...`;
        opts = [
          { id: "A", text: "Only the exact dates on a calendar", isCorrect: false },
          { id: "B", text: "Why historical events occurred and the consequences they had on people's lives", isCorrect: true },
          { id: "C", text: "How to solve arithmetic equations", isCorrect: false },
          { id: "D", text: "The spelling of geographic names only", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Cause is why something happened; effect is what resulted from it. 💡 Tip: Always ask: 'What led to this, and what happened next?'";
      } else {
        qText = `Which geographic tool would be MOST effective for analyzing the physical elevation, rivers, and terrain of a region?`;
        opts = [
          { id: "A", text: "A political map showing state boundaries", isCorrect: false },
          { id: "B", text: "A topographic or physical map", isCorrect: true },
          { id: "C", text: "A line graph of rainfall by month", isCorrect: false },
          { id: "D", text: "A dictionary index", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Topographic and physical maps show landforms, mountains, elevation contours, and bodies of water. 💡 Tip: Physical maps show natural features!";
      }

    // ==========================================
    // 8. READING & LANGUAGE ARTS
    // ==========================================
    } else if (lowerSubject.includes("reading") || lowerSubject.includes("english") || lowerSubject.includes("language")) {
      const mode = (attempts + randInt(1, 10)) % 4;
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
        qText = "When an author describes a character's actions and speech instead of directly telling the reader how they feel, the reader must make an...";
        opts = [
          { id: "A", text: "Index", isCorrect: false },
          { id: "B", text: "Inference (logical conclusion based on evidence + background knowledge)", isCorrect: true },
          { id: "C", text: "Alliteration", isCorrect: false },
          { id: "D", text: "Antonym", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Inferring means reading between the lines using clues from the text and your own thinking. 💡 Tip: Text Clues + What You Know = Inference!";
      } else if (mode === 2) {
        qText = "What is the primary function of a PREFIX in the English language?";
        opts = [
          { id: "A", text: "It ends a paragraph with punctuation", isCorrect: false },
          { id: "B", text: "It attaches to the beginning of a root word to modify its meaning (e.g., un-, re-, pre-)", isCorrect: true },
          { id: "C", text: "It changes a noun into a vowel", isCorrect: false },
          { id: "D", text: "It is only used in poetry rhyming", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: 'Pre' means before. Prefixes go before the root word (like 're-write' or 'un-happy'). 💡 Tip: Pre = Before, Fix = Attach!";
      } else {
        qText = "Which text structure organizes events in the exact sequence in which they occurred over time?";
        opts = [
          { id: "A", text: "Problem and Solution", isCorrect: false },
          { id: "B", text: "Chronological / Sequential order", isCorrect: true },
          { id: "C", text: "Compare and Contrast", isCorrect: false },
          { id: "D", text: "Cause and Effect only", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Chronological order arranges events along a timeline from earliest to latest. 💡 Tip: Look for clue words: First, Next, Later, Finally!";
      }

    // ==========================================
    // 9. GENERAL HIGH-DIVERSITY COGNITIVE ENGINE
    // ==========================================
    } else {
      const mode = (attempts + randInt(1, 10)) % 5;
      if (mode === 0) {
        qText = `Which statement describes a foundational concept of "${cleanTopic}" within ${subject}?`;
        opts = [
          { id: "A", text: `It applies only to unrelated topics in advanced graduate studies`, isCorrect: false },
          { id: "B", text: `It provides essential principles and problem-solving tools used throughout ${subject}`, isCorrect: true },
          { id: "C", text: `It contradicts the standard facts taught in ${gradeLevel}`, isCorrect: false },
          { id: "D", text: `It has no connection to practical real-world scenarios`, isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Understanding "${cleanTopic}" builds a solid foundation for mastering ${subject}. 💡 Tip: Master the core idea first, then explore the details!`;
      } else if (mode === 1) {
        qText = `A ${gradeLevel} student is analyzing a problem involving "${cleanTopic}". What is the MOST effective first step?`;
        opts = [
          { id: "A", text: "Select a random answer immediately without reading the prompt", isCorrect: false },
          { id: "B", text: "Identify the known facts, clarify what question is being asked, and determine which strategy applies", isCorrect: true },
          { id: "C", text: "Skip all instructions and write down unrelated equations", isCorrect: false },
          { id: "D", text: "Assume the problem cannot be solved", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Careful problem analysis starts with identifying the knowns and the goal before applying a solution method. 💡 Tip: Understand the question before calculating!`;
      } else if (mode === 2) {
        qText = `How does knowledge of "${cleanTopic}" apply to everyday real-world situations?`;
        opts = [
          { id: "A", text: "It is only useful when taking an exam", isCorrect: false },
          { id: "B", text: `It helps individuals make informed decisions, interpret information, and solve practical challenges in ${subject}`, isCorrect: true },
          { id: "C", text: "It is only used by computers and has no human application", isCorrect: false },
          { id: "D", text: "It only applies to historical events that happened centuries ago", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: Concepts like "${cleanTopic}" are designed to help us understand and navigate the world around us. 💡 Tip: Look for connections between your lessons and your daily life!`;
      } else if (mode === 3) {
        qText = `Which skill is MOST essential for demonstrating mastery of "${cleanTopic}" in ${subject}?`;
        opts = [
          { id: "A", text: "Memorizing answers without understanding the underlying steps", isCorrect: false },
          { id: "B", text: "Explaining the reasoning step-by-step and applying concepts to new, unfamiliar situations", isCorrect: true },
          { id: "C", text: "Guessing based on the shortest answer option", isCorrect: false },
          { id: "D", text: "Ignoring vocabulary definitions", isCorrect: false },
        ];
        correct = "B";
        explanation = `Step 1: True mastery means being able to explain 'why' a method works and applying it to new contexts. 💡 Tip: If you can teach it to a friend, you truly know it!`;
      } else {
        qText = `When evaluating claims or data related to "${cleanTopic}", what should a student look for to verify accuracy?`;
        opts = [
          { id: "A", text: "Whether the statement is popular on social media", isCorrect: false },
          { id: "B", text: "Reliable evidence, verified source data, and logical consistency", isCorrect: true },
          { id: "C", text: "The length of the paragraph only", isCorrect: false },
          { id: "D", text: "Only opinions from people who agree with you", isCorrect: false },
        ];
        correct = "B";
        explanation = "Step 1: Critical thinking requires evaluating factual evidence and checking reputable sources. 💡 Tip: Evidence is the anchor of truth in every subject!";
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
