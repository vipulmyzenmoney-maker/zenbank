import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://postgres:AjGBCHQxiHtWQRYryceFeVnORevqPPQM@switchyard.proxy.rlwy.net:27764/railway",
    },
  },
});

function normalizeQuestionText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[×*]/g, "x")
    .replace(/[÷/]/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/[^a-z0-9\s/]/g, "")
    .replace(/^(what is|which of the following|calculate|find the|determine the|solve for|how much is|identify the)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Starting production database deduplication...");

  const allQuestions = await prisma.question.findMany({
    select: {
      id: true,
      questionText: true,
      gradeLevel: true,
      subject: true,
      topic: true,
      status: true,
      confidence: true,
      createdAt: true,
    },
  });

  console.log(`Loaded ${allQuestions.length} total questions from database.`);

  const groups = new Map<string, typeof allQuestions>();

  for (const q of allQuestions) {
    const normText = normalizeQuestionText(q.questionText);
    const groupKey = `${q.gradeLevel.trim().toLowerCase()}::${q.subject.trim().toLowerCase()}::${q.topic.trim().toLowerCase()}::${normText}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(q);
  }

  const idsToDelete: bigint[] = [];
  let duplicateGroupsCount = 0;

  for (const [key, items] of groups.entries()) {
    if (items.length > 1) {
      duplicateGroupsCount++;
      items.sort((a, b) => {
        if (a.status === "verified" && b.status !== "verified") return -1;
        if (b.status === "verified" && a.status !== "verified") return 1;
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return Number(a.id - b.id);
      });

      const toDelete = items.slice(1);
      for (const item of toDelete) {
        idsToDelete.push(item.id);
      }
    }
  }

  console.log(`Found ${duplicateGroupsCount} duplicate groups with ${idsToDelete.length} redundant rows.`);

  if (idsToDelete.length > 0) {
    console.log("Cleaning associated question_analytics if any...");
    try {
      await prisma.questionAnalytics.deleteMany({
        where: { questionId: { in: idsToDelete } },
      });
    } catch (e) {
      console.warn("Analytics deletion note:", e);
    }

    console.log(`Deleting ${idsToDelete.length} duplicate questions...`);
    const delResult = await prisma.question.deleteMany({
      where: { id: { in: idsToDelete } },
    });
    console.log(`Successfully deleted ${delResult.count} duplicate questions!`);
  }

  const remaining = await prisma.question.count();
  console.log(`Deduplication complete. Remaining unique questions: ${remaining}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
