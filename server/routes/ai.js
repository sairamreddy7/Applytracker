const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// All routes require authentication
router.use(authenticateToken);

// Helper to get model
const getModel = () => genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Generate Cover Letter
router.post('/cover-letter', async (req, res) => {
    try {
        const { jobTitle, companyName, jobDescription, resumeText, tone = 'professional' } = req.body;

        if (!jobTitle || !companyName) {
            return res.status(400).json({ error: 'Job title and company name are required' });
        }

        const prompt = `Write a ${tone} cover letter for a ${jobTitle} position at ${companyName}.

Job Description:
${jobDescription || 'Not provided'}

Candidate's Resume/Background:
${resumeText || 'Not provided'}

Requirements:
- Write a compelling, personalized cover letter
- Highlight relevant skills and experience
- Keep it to 3-4 paragraphs
- Include a strong opening and closing
- Be specific about why the candidate is a good fit
- Do not include placeholder brackets like [Your Name]`;

        const model = getModel();
        const result = await model.generateContent(prompt);
        const coverLetter = result.response.text();

        res.json({ coverLetter });
    } catch (error) {
        console.error('Cover letter generation error:', error);
        res.status(500).json({ error: 'Failed to generate cover letter' });
    }
});

// Resume-Job Match Analysis
router.post('/match-resume', async (req, res) => {
    try {
        const { jobDescription, resumeText } = req.body;

        if (!jobDescription || !resumeText) {
            return res.status(400).json({ error: 'Job description and resume are required' });
        }

        const prompt = `Analyze how well this resume matches the job description. Provide:
1. A match score from 0-100
2. Key matching skills/qualifications
3. Missing skills or gaps
4. Recommendations to improve the application

Job Description:
${jobDescription}

Resume:
${resumeText}

Respond in this exact JSON format:
{
    "matchScore": <number>,
    "matchingSkills": ["skill1", "skill2"],
    "missingSkills": ["skill1", "skill2"],
    "recommendations": ["rec1", "rec2"],
    "summary": "<brief summary>"
}`;

        const model = getModel();
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // Clean up response to extract JSON
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const analysis = JSON.parse(responseText);
            res.json(analysis);
        } catch {
            // If JSON parsing fails, return raw text
            res.json({
                matchScore: 70,
                summary: responseText,
                matchingSkills: [],
                missingSkills: [],
                recommendations: []
            });
        }
    } catch (error) {
        console.error('Resume match error:', error);
        res.status(500).json({ error: 'Failed to analyze resume match' });
    }
});

// Generate Interview Questions
router.post('/interview-questions', async (req, res) => {
    try {
        const { jobTitle, companyName, jobDescription, experienceLevel = 'Mid-Level' } = req.body;

        if (!jobTitle) {
            return res.status(400).json({ error: 'Job title is required' });
        }

        const prompt = `Generate interview preparation questions for a ${experienceLevel} ${jobTitle} position${companyName ? ` at ${companyName}` : ''}.

Job Description:
${jobDescription || 'General ' + jobTitle + ' position'}

Provide 10-15 questions in these categories:
1. Technical/Role-Specific Questions (5-6 questions)
2. Behavioral Questions (3-4 questions)
3. Questions to Ask the Interviewer (3-4 questions)

For each question, include a brief tip on how to answer it.

Respond in this exact JSON format:
{
    "technical": [{"question": "...", "tip": "..."}],
    "behavioral": [{"question": "...", "tip": "..."}],
    "askInterviewer": [{"question": "...", "tip": "..."}]
}`;

        const model = getModel();
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // Clean up response to extract JSON
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const questions = JSON.parse(responseText);
            res.json(questions);
        } catch {
            res.json({
                technical: [{ question: 'Tell me about your experience as a ' + jobTitle, tip: 'Focus on relevant achievements' }],
                behavioral: [{ question: 'Describe a challenging project you worked on', tip: 'Use the STAR method' }],
                askInterviewer: [{ question: 'What does success look like in this role?', tip: 'Shows you care about performing well' }]
            });
        }
    } catch (error) {
        console.error('Interview questions error:', error);
        res.status(500).json({ error: 'Failed to generate interview questions' });
    }
});

module.exports = router;
