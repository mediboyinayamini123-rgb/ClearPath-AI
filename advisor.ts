import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const SYSTEM_CONTEXT = `You are ClearPath AI Advisor, a friendly and knowledgeable assistant helping Indian students understand government scholarships, fee reimbursement schemes, and educational support programs. You have expertise in:
- National Scholarship Portal (scholarships.gov.in) schemes
- Post-Matric Scholarships
- Fee Reimbursement Schemes (AP/Telangana ePASS)
- PMKVY Skill Development programs
- Merit-based scholarships
- Student financial assistance programs
- Application procedures, required documents, and deadlines

Keep your answers concise (3-5 sentences), warm, and practical. Write in plain English — no markdown formatting, no bullet lists, no bold text. Speak directly to the student. If asked something outside your expertise, gently redirect to scholarship-related topics.`;

router.post("/advisor", async (req, res) => {
  const { question, history } = req.body as {
    question: string;
    history?: { role: "user" | "model"; text: string }[];
  };

  if (!question?.trim()) { res.status(400).json({ error: "Question is required" }); return; }

  if (!gemini) {
    res.json({ answer: "The AI Advisor is not available right now. Please ensure the GEMINI_API_KEY is configured." });
    return;
  }

  const contents = [
    { role: "user" as const, parts: [{ text: SYSTEM_CONTEXT + "\n\nNow answer student questions helpfully." }] },
    { role: "model" as const, parts: [{ text: "Hello! I'm your ClearPath AI Advisor. What would you like to know?" }] },
    ...(history || []).map((m) => ({ role: m.role as "user" | "model", parts: [{ text: m.text }] })),
    { role: "user" as const, parts: [{ text: question }] },
  ];

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash", contents, config: { maxOutputTokens: 512 },
    });
    res.json({ answer: response.text?.trim() || "I'm sorry, I couldn't generate a response. Please try again." });
  } catch {
    res.json({ answer: "I'm having trouble connecting right now. Please try again in a moment." });
  }
});

export default router;
