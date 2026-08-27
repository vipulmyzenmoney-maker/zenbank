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
  // ==========================================
  // KINDERGARTEN
  // ==========================================
  {
    id: "k-math",
    title: "Kindergarten Math: Numbers & Shapes",
    gradeLevel: "Kindergarten",
    subject: "Math",
    icon: "🎈",
    color: "emerald",
    topics: ["Counting 1 to 20", "2D & 3D Shapes", "Comparing Bigger vs Smaller", "Simple Addition (+1 and +2)", "Color & Shape Patterns"],
  },
  {
    id: "k-reading",
    title: "Kindergarten Reading: Phonics & Sounds",
    gradeLevel: "Kindergarten",
    subject: "Reading",
    icon: "📖",
    color: "teal",
    topics: ["Letter Sounds & Alphabet", "Rhyming Word Families", "Beginning Letter Sounds", "Simple Sight Words"],
  },

  // ==========================================
  // 1ST GRADE
  // ==========================================
  {
    id: "1st-math",
    title: "1st Grade Math: Addition, Tens & Time",
    gradeLevel: "1st Grade",
    subject: "Math",
    icon: "⭐",
    color: "blue",
    topics: ["Addition to 20", "Subtraction Facts", "Place Value (Tens and Ones)", "Telling Time to the Hour & Half-Hour", "Comparing Numbers (> and <)"],
  },
  {
    id: "1st-reading",
    title: "1st Grade Reading: Sentences & Sight Words",
    gradeLevel: "1st Grade",
    subject: "Reading",
    icon: "📚",
    color: "teal",
    topics: ["Sight Words Master", "Sentence Capitalization & Periods", "Asking Sentences & Question Marks", "Story Characters & Setting"],
  },

  // ==========================================
  // 2ND GRADE
  // ==========================================
  {
    id: "2nd-math",
    title: "2nd Grade Math: 2-Digit Math & Money",
    gradeLevel: "2nd Grade",
    subject: "Math",
    icon: "🚀",
    color: "blue",
    topics: ["2-Digit Addition with Regrouping", "2-Digit Subtraction", "Counting Money (Quarters, Dimes, Nickels)", "Skip Counting (5s, 10s, 100s)", "Telling Time to 5 Minutes"],
  },
  {
    id: "2nd-reading",
    title: "2nd Grade Reading: Comprehension & Cause/Effect",
    gradeLevel: "2nd Grade",
    subject: "Reading",
    icon: "📖",
    color: "teal",
    topics: ["Problem and Solution", "Cause and Effect Relationships", "Compound Words & Contractions", "Central Message & Moral"],
  },

  // ==========================================
  // 3RD GRADE
  // ==========================================
  {
    id: "3rd-math",
    title: "3rd Grade Math: Times Tables & Fractions",
    gradeLevel: "3rd Grade",
    subject: "Math",
    icon: "🎯",
    color: "blue",
    topics: ["Multiplication Facts (0-12)", "Division & Equal Sharing", "Fractions on a Number Line", "Equivalent Fractions", "Area & Perimeter Formulas"],
  },
  {
    id: "3rd-reading",
    title: "3rd Grade Reading: Context Clues & Vocabulary",
    gradeLevel: "3rd Grade",
    subject: "Reading",
    icon: "📚",
    color: "teal",
    topics: ["Context Clues in Paragraphs", "Synonyms and Antonyms", "Prefixes (un-, re-, pre-)", "Text Features (Diagrams & Glossaries)"],
  },

  // ==========================================
  // 4TH GRADE
  // ==========================================
  {
    id: "4th-math",
    title: "4th Grade Math: Multi-Digit & Decimals",
    gradeLevel: "4th Grade",
    subject: "Math",
    icon: "⚡",
    color: "blue",
    topics: ["Multi-Digit Multiplication (Standard Algorithm)", "Long Division with Remainders", "Decimals (Tenths & Hundredths)", "Angles (Acute, Right, Obtuse)", "Adding Fractions with Like Denominators"],
  },
  {
    id: "4th-reading",
    title: "4th Grade Reading: Inferences & Point of View",
    gradeLevel: "4th Grade",
    subject: "Reading",
    icon: "📖",
    color: "teal",
    topics: ["Making Inferences from Evidence", "First-Person vs Third-Person POV", "Theme & Central Message", "Fact vs Opinion"],
  },

  // ==========================================
  // 5TH GRADE
  // ==========================================
  {
    id: "5th-math-operations",
    title: "5th Grade Math: Multi-Digit & PEMDAS",
    gradeLevel: "5th Grade",
    subject: "Math",
    icon: "🧮",
    color: "blue",
    topics: ["Multi-Digit Multiplication", "Order of Operations (PEMDAS)", "Coordinate Plane Graphing (x, y)", "Volume of Rectangular Prisms"],
  },
  {
    id: "5th-math-fractions",
    title: "5th Grade Math: Fractions & Decimals",
    gradeLevel: "5th Grade",
    subject: "Math",
    icon: "📐",
    color: "blue",
    topics: ["Adding Fractions with Unlike Denominators", "Subtracting Mixed Numbers", "Multiplying Fractions", "Decimal Addition & Multiplication"],
  },
  {
    id: "5th-reading",
    title: "5th Grade Reading: Main Idea & Analysis",
    gradeLevel: "5th Grade",
    subject: "Reading",
    icon: "📚",
    color: "teal",
    topics: ["Main Idea & Key Supporting Details", "Author's Purpose & Perspective", "Text Structure (Cause/Effect, Compare/Contrast)", "Metaphors & Similes"],
  },
  {
    id: "5th-science",
    title: "5th Grade Science: Ecosystems & Earth Systems",
    gradeLevel: "5th Grade",
    subject: "Science",
    icon: "🔬",
    color: "purple",
    topics: ["Producers, Consumers & Food Webs", "Decomposers & Nutrient Cycles", "Earth's 4 Spheres (Bio, Hydro, Geo, Atmo)", "Properties of Matter & Mixtures"],
  },

  // ==========================================
  // MIDDLE SCHOOL (6TH - 8TH)
  // ==========================================
  {
    id: "ms-math-prealgebra",
    title: "Middle School Pre-Algebra & Equations",
    gradeLevel: "Middle School",
    subject: "Math",
    icon: "📐",
    color: "blue",
    topics: ["Two-Step Linear Equations", "Negative Integers Arithmetic", "Ratios & Unit Rates", "Percentages & Discounts", "Pythagorean Theorem"],
  },
  {
    id: "ms-coding",
    title: "Middle School Coding & Python Logic",
    gradeLevel: "Middle School",
    subject: "Coding",
    icon: "💻",
    color: "purple",
    topics: ["Variables & Data Types", "If-Else Conditionals", "For & While Loops", "Functions & Reusability", "Algorithmic Thinking"],
  },

  // ==========================================
  // HIGH SCHOOL & SAT PREP
  // ==========================================
  {
    id: "sat-math",
    title: "SAT Math: Linear Systems & Quadratics",
    gradeLevel: "High School",
    subject: "Math",
    icon: "🎯",
    color: "amber",
    topics: ["Heart of Algebra: Linear Equations", "Systems of Linear Equations", "Passport to Advanced Math: Quadratics", "Slope-Intercept & Coordinate Geometry"],
  },
  {
    id: "sat-reading",
    title: "High School Reading & Rhetorical Devices",
    gradeLevel: "High School",
    subject: "Reading",
    icon: "✍️",
    color: "amber",
    topics: ["Rhetorical Appeals (Ethos, Pathos, Logos)", "Author Claims & Supporting Evidence", "Advanced Vocabulary in Context", "Tone, Mood & Irony"],
  },
];
