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


    const application = await prisma.application.findFirst({ where: { id, userId: req.userId, deletedAt: null } });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const jobDescription = jdText || application.jdText;
    if (!jobDescription) {
      return res.status(400).json({ error: "Job description is required to score resume" });
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


    const aiResult = JSON.parse(response.text);


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
