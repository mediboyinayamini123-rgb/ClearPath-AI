import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import PROGRAMS_DATA from "../data/programs.json" with { type: "json" };

const router = Router();
const PROGRAMS: Program[] = PROGRAMS_DATA as Program[];

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

interface Program {
  name: string; short_desc: string; income_limit: number;
  education_levels: string[]; categories: string[];
  min_age: number; max_age: number; states: string | string[];
  min_marks_percent: number; benefit: string; portal: string;
  deadline: string; documents: string[]; source: string;
}

interface StudentData {
  name: string; age: number; education: string;
  category: string; income: number; state: string; marks: number;
}

function checkEligibility(student: StudentData) {
  const results: { program: Program; eligible: boolean; reasons_failed: string[] }[] = [];
  const { income, education, category, age, state, marks } = student;

  for (const program of PROGRAMS) {
    const reasonsFailed: string[] = [];

    if (income > program.income_limit && program.income_limit < 999999)
      reasonsFailed.push(`Income ₹${income.toLocaleString("en-IN")} exceeds limit of ₹${program.income_limit.toLocaleString("en-IN")}`);

    if (!program.education_levels.includes(education.toLowerCase()))
      reasonsFailed.push(`Education level '${education}' not covered by this scheme`);

    if (!program.categories.includes("General") && !program.categories.includes(category))
      reasonsFailed.push(`Category '${category}' not eligible (requires: ${program.categories.join(", ")})`);

    if (age < program.min_age || age > program.max_age)
      reasonsFailed.push(`Age ${age} outside eligible range (${program.min_age}–${program.max_age})`);

    if (program.states !== "all" && Array.isArray(program.states) && !program.states.includes(state))
      reasonsFailed.push(`Scheme available only in: ${(program.states as string[]).join(", ")}`);

    if (program.min_marks_percent > 0 && marks < program.min_marks_percent)
      reasonsFailed.push(`Marks ${marks}% below required ${program.min_marks_percent}%`);

    results.push({ program, eligible: reasonsFailed.length === 0, reasons_failed: reasonsFailed });
  }
  return results;
}

function fallbackExplanation(student: StudentData, results: ReturnType<typeof checkEligibility>): string {
  const eligibleNames = results.filter((r) => r.eligible).map((r) => r.program.name);
  if (eligibleNames.length === 0) return "Based on the details you provided, none of our listed programs currently match your profile. Try checking scholarships.gov.in for more options.";
  const top = results.find((r) => r.eligible)?.program;
  return `Based on your profile, ${student.name}, you qualify for ${eligibleNames.join(", ")}. ` +
    (top ? `The ${top.name} could be especially beneficial — offering ${top.benefit}. ` : "") +
    `Review the details below and apply before the deadlines.`;
}

function fallbackActionPlan(results: ReturnType<typeof checkEligibility>): string[] {
  const eligibleNames = results.filter((r) => r.eligible).map((r) => r.program.name);
  if (eligibleNames.length === 0) return [];
  return [
    "Gather all required documents listed for each program.",
    `Visit the official portal for ${eligibleNames[0]} and register with your Aadhaar number.`,
    "Fill out the application form accurately with your details.",
    "Upload scanned copies of all required documents in the correct format.",
    "Submit the application before the deadline shown on the program card.",
    "Note down your application reference number and keep copies of all submissions.",
  ];
}

async function getGeminiExplanation(student: StudentData, results: ReturnType<typeof checkEligibility>): Promise<string> {
  if (!gemini) return fallbackExplanation(student, results);
  const eligibleNames = results.filter((r) => r.eligible).map((r) => r.program.name);

  let prompt: string;
  if (eligibleNames.length === 0) {
    prompt = `A student named ${student.name} did not match any programs. In 2-3 warm sentences, encourage them to check scholarships.gov.in. Write directly to the student. Plain sentences only.`;
  } else {
    const programDetails = results.filter((r) => r.eligible).map((r) => `- ${r.program.name}: ${r.program.benefit}`).join("\n");
    prompt = `Student ${student.name}: Age ${student.age}, ${student.education}, ₹${student.income.toLocaleString("en-IN")}/yr income, ${student.category}, ${student.state}, ${student.marks}% marks.\n\nEligible for:\n${programDetails}\n\nWrite 3-4 warm sentences explaining why they qualify and which program is most beneficial. Name them, be specific. No markdown, no bullet points, plain sentences only.`;
  }

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 512 },
    });
    return response.text?.trim() || fallbackExplanation(student, results);
  } catch {
    return fallbackExplanation(student, results);
  }
}

async function getGeminiActionPlan(student: StudentData, results: ReturnType<typeof checkEligibility>): Promise<string[]> {
  if (!gemini) return fallbackActionPlan(results);
  const eligibleNames = results.filter((r) => r.eligible).map((r) => r.program.name);
  if (eligibleNames.length === 0) return [];

  const prompt = `Create a 6-step action plan for ${student.name} (${student.state}, ${student.education}) to apply for: ${eligibleNames.join(", ")}. Each step: one short sentence. Start each with number and period. No markdown.`;

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 512 },
    });
    const steps = (response.text?.trim() || "")
      .split("\n").map((l) => l.trim())
      .filter((l) => l && /^\d+\./.test(l))
      .map((l) => l.replace(/^\d+\.\s*/, ""))
      .slice(0, 6);
    return steps.length >= 3 ? steps : fallbackActionPlan(results);
  } catch {
    return fallbackActionPlan(results);
  }
}

router.post("/analyze", async (req, res) => {
  const data = req.body as StudentData;
  if (!data.name || !data.education || !data.category || !data.state) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }
  const results = checkEligibility(data);
  const [aiExplanation, actionPlan] = await Promise.all([
    getGeminiExplanation(data, results),
    getGeminiActionPlan(data, results),
  ]);
  res.json({
    student: data,
    eligible: results.filter((r) => r.eligible).map((r) => ({
      name: r.program.name, short_desc: r.program.short_desc,
      benefit: r.program.benefit, portal: r.program.portal,
      deadline: r.program.deadline, documents: r.program.documents, source: r.program.source,
    })),
    ineligible: results.filter((r) => !r.eligible).map((r) => ({ name: r.program.name, reasons: r.reasons_failed })),
    ai_explanation: aiExplanation,
    action_plan: actionPlan,
  });
});

export default router;
