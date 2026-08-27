import { prisma } from "../lib/prisma";
import { CURRICULUM_PRESETS } from "../lib/presets";
import { generateCurriculumQuestions } from "../lib/fallbackGenerator";

async function main() {
  console.log("🚀 Starting ZenBank automated curriculum upload...");
  let totalPacks = 0;
  let totalQuestions = 0;

  for (const preset of CURRICULUM_PRESETS) {
    console.log(`\n📚 Processing: ${preset.title} (${preset.gradeLevel})`);

    const pack = await prisma.syllabusPack.create({
      data: {
        title: preset.title,
        gradeLevel: preset.gradeLevel,
        subject: preset.subject,
        topics: preset.topics,
      },
    });
    totalPacks++;

    for (const topic of preset.topics) {
      const questions = generateCurriculumQuestions(
        topic,
        preset.subject,
        preset.gradeLevel,
        5
      );

      for (const q of questions) {
        await prisma.question.create({
          data: {
            syllabusPackId: pack.id,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            gradeLevel: preset.gradeLevel,
            subject: preset.subject,
            topic,
            difficulty: q.difficulty,
            confidence: q.confidence,
            status: "verified",
            verifiedAt: new Date(),
            verifiedBy: "Curriculum Auto-Engine",
          },
        });
        totalQuestions++;
      }
      console.log(`  ✓ Topic "${topic}": 5 verified questions created`);
    }
  }

  console.log(`\n🎉 Done! Created ${totalQuestions} verified questions across ${totalPacks} curriculum packs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
