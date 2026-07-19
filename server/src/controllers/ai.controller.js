// src/controllers/ai.controller.js
//
// Uses the official @google/genai SDK to score a user's resume against a job description.
// Returns structured JSON (score 0-100, matched keywords, missing keywords, suggestions)
// and saves the result in the database linked to the application.

const { GoogleGenAI, Type } = require("@google/genai");
const prisma = require("../lib/prisma");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



const scoreResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resumeText, jdText } = req.body;

    // Enforce 10 AI calls/user/day limit
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const aiCallsToday = await prisma.aiScore.count({
      where: {
        application: { userId: req.userId },
        createdAt: { gte: startOfDay },
      },
    });
    if (aiCallsToday >= 10) {
      return res.status(429).json({
        error: "Daily AI scoring limit reached (10/day). Please try again tomorrow.",
      });
    }

    const application = await prisma.application.findFirst({
      where: { id, userId: req.userId, deletedAt: null },
      include: { resume: { select: { extractedText: true, label: true } } },
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const jobDescription = jdText || application.jdText;
    if (!jobDescription) {
      return res.status(400).json({ error: "Job description is required to score resume" });
    }

    // Auto-use the linked resume's extracted text.
    // If the user manually passed resumeText in the request body, use that as an override.
    const resumeText = req.body.resumeText || application.resume?.extractedText;
    if (!resumeText) {
      return res.status(400).json({
        error: "Please edit this application and attach a resume first.",
      });
    }


    const prompt = `
      Compare the following resume against the job description.
      Evaluate keyword alignment, skills match, and experience relevance.
      
      Resume:
      ${resumeText}
      
      Job Description:
      ${jobDescription}
    `;


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "Overall match score from 0 to 100",
            },
            matched: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of top matching skills and keywords found in both",
            },
            missing: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Important keywords or requirements from JD missing from the resume",
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of actionable bullet-point suggestions on how to improve the resume for this specific role",
            },
          },
          required: ["score", "matched", "missing", "suggestions"],
        },
      },
    });


    let rawText = response.text || "";
    // Strip markdown code fences if Gemini returned ```json ... ```
    rawText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();

    let aiResult;
    try {
      aiResult = JSON.parse(rawText);
    } catch (parseErr) {
      return res.status(502).json({
        error: "AI service returned an invalid response format. Please try again.",
      });
    }


    const savedScore = await prisma.aiScore.create({
      data: {
        applicationId: id,
        score: aiResult.score,
        matched: aiResult.matched,
        missing: aiResult.missing,
        suggestions: aiResult.suggestions,
      },
    });

    return res.status(201).json(savedScore);

  } catch (err) {
    next(err);
  }
};

module.exports = {
  scoreResume,
};
