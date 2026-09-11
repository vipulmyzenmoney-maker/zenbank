const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const seedFile = path.join(__dirname, "seed-questions.json");
  if (!fs.existsSync(seedFile)) {
    console.log("No seed-questions.json found. Skipping seed.");
    return;
  }

  const raw = fs.readFileSync(seedFile, "utf8");
  const questions = JSON.parse(raw);
  console.log(`🌱 Seeding local ZenBank database with ${questions.length} questions...`);

  const packMap = new Map();

  for (const q of questions) {
    let packId = null;
    if (q.syllabusPack) {
      const packKey = `${q.syllabusPack.title}-${q.syllabusPack.gradeLevel}-${q.syllabusPack.subject}`;
      if (!packMap.has(packKey)) {
        let pack = await prisma.syllabusPack.findFirst({
          where: {
            title: q.syllabusPack.title,
            gradeLevel: q.syllabusPack.gradeLevel,
            subject: q.syllabusPack.subject,
          },
        });
        if (!pack) {
          pack = await prisma.syllabusPack.create({
            data: {
              title: q.syllabusPack.title,
              gradeLevel: q.syllabusPack.gradeLevel,
              subject: q.syllabusPack.subject,
              topics: [q.topic || "General Topics"],
            },
          });
        }
        packMap.set(packKey, pack.id);
      }
      packId = packMap.get(packKey);
    }

    const existing = await prisma.question.findFirst({
      where: {
        questionText: q.questionText,
        gradeLevel: q.gradeLevel,
        subject: q.subject,
      },
    });

    if (!existing) {
      await prisma.question.create({
        data: {
          syllabusPackId: packId,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          gradeLevel: q.gradeLevel,
          subject: q.subject,
          topic: q.topic || "",
          difficulty: q.difficulty || "medium",
          confidence: q.confidence || 95,
          status: q.status || "verified",
          verifiedAt: q.verifiedAt ? new Date(q.verifiedAt) : new Date(),
          verifiedBy: q.verifiedBy || "Zen Admin",
        },
      });
    }
  }

  const count = await prisma.question.count();
  console.log(`✅ Seeding complete. Total questions in local database: ${count}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
