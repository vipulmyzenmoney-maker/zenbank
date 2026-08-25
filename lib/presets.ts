export interface CurriculumPreset {
  id: string;
  title: string;
  gradeLevel: string;
  subject: string;
  icon: string;
  color: string;
  topics: string[];
}

export const CURRICULUM_PRESETS: CurriculumPreset[] = [
  {
    id: "math-k",
    title: "Kindergarten Math",
    gradeLevel: "Kindergarten",
    subject: "Math",
    icon: "🔢",
    color: "emerald",
    topics: ["Counting to 20", "Shapes & Patterns", "Bigger & Smaller", "Simple Addition", "Simple Subtraction"],
  },
  {
    id: "math-1",
    title: "1st Grade Math",
    gradeLevel: "1st Grade",
    subject: "Math",
    icon: "➕",
    color: "emerald",
    topics: ["Addition to 20", "Subtraction to 20", "Place Value (Tens & Ones)", "Measurement & Length", "Telling Time"],
  },
  {
    id: "math-2",
    title: "2nd Grade Math",
    gradeLevel: "2nd Grade",
    subject: "Math",
    icon: "✖️",
    color: "emerald",
    topics: ["Addition to 100", "Subtraction to 100", "Skip Counting", "Money & Coins", "Intro to Multiplication"],
  },
  {
    id: "math-3",
    title: "3rd Grade Math",
    gradeLevel: "3rd Grade",
    subject: "Math",
    icon: "📐",
    color: "emerald",
    topics: ["Multiplication Facts", "Division Facts", "Fractions Intro", "Area & Perimeter", "Rounding Numbers"],
  },
  {
    id: "math-4",
    title: "4th Grade Math",
    gradeLevel: "4th Grade",
    subject: "Math",
    icon: "📊",
    color: "emerald",
    topics: ["Multi-digit Multiplication", "Long Division", "Equivalent Fractions", "Decimals Intro", "Angles & Lines"],
  },
  {
    id: "math-5",
    title: "5th Grade Math",
    gradeLevel: "5th Grade",
    subject: "Math",
    icon: "🧮",
    color: "emerald",
    topics: ["Fraction Operations", "Decimal Operations", "Volume", "Coordinate Plane", "Order of Operations"],
  },
  {
    id: "reading-3",
    title: "3rd Grade Reading",
    gradeLevel: "3rd Grade",
    subject: "Reading",
    icon: "📖",
    color: "blue",
    topics: ["Main Idea", "Supporting Details", "Character Traits", "Story Elements", "Context Clues"],
  },
  {
    id: "reading-5",
    title: "5th Grade Reading",
    gradeLevel: "5th Grade",
    subject: "Reading",
    icon: "📚",
    color: "blue",
    topics: ["Theme & Central Idea", "Author's Purpose", "Text Structure", "Compare & Contrast", "Inference & Evidence"],
  },
  {
    id: "science-5",
    title: "5th Grade Science",
    gradeLevel: "5th Grade",
    subject: "Science",
    icon: "🔬",
    color: "purple",
    topics: ["States of Matter", "Earth's Systems", "Ecosystems & Food Chains", "Force & Motion", "Solar System"],
  },
  {
    id: "science-8",
    title: "8th Grade Science",
    gradeLevel: "8th Grade",
    subject: "Science",
    icon: "⚗️",
    color: "purple",
    topics: ["Atoms & Elements", "Chemical Reactions", "Genetics & DNA", "Waves & Light", "Newton's Laws"],
  },
  {
    id: "sat-math",
    title: "SAT Math Prep",
    gradeLevel: "SAT/ACT",
    subject: "Math",
    icon: "🎯",
    color: "amber",
    topics: ["Heart of Algebra", "Passport to Advanced Math", "Problem Solving & Data", "Geometry & Trigonometry"],
  },
  {
    id: "sat-reading",
    title: "SAT Reading & Writing",
    gradeLevel: "SAT/ACT",
    subject: "Reading",
    icon: "✍️",
    color: "amber",
    topics: ["Reading Comprehension", "Command of Evidence", "Words in Context", "Grammar & Usage"],
  },
];
