const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const { Readable } = require('stream');
const prisma = require('../lib/prisma');
const { requireRole } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = express.Router();

const SYSTEM_CONTEXT =
  'You are a clinical care assistant helping summarise elderly care shifts. Write clearly and professionally. Keep summaries concise — 3 to 5 sentences maximum.';

async function getCaregiverProfile(userId) {
  return prisma.caregiverProfile.findUnique({ where: { userId } });
}

function formatVitalsLine(entry) {
  const date = entry.recordedAt.toISOString().split('T')[0];
  const parts = [];

  if (entry.heartRate != null) {
    parts.push(`HR: ${entry.heartRate}`);
  }
  if (entry.systolic != null || entry.diastolic != null) {
    parts.push(`BP: ${entry.systolic ?? '—'}/${entry.diastolic ?? '—'}`);
  }
  if (entry.bloodOxygen != null) {
    parts.push(`SpO2: ${entry.bloodOxygen}%`);
  }
  if (entry.temperatureCelsius != null) {
    parts.push(`Temp: ${entry.temperatureCelsius}°C`);
  }

  return parts.length > 0 ? `${date} — ${parts.join(', ')}` : null;
}

function buildPrompt(shift, vitals) {
  const patientName = shift.patientProfile.user.name;
  const completedCount = shift.tasks.filter((t) => t.isCompleted).length;
  const totalCount = shift.tasks.length;

  const taskLines = shift.tasks
    .map((task) => `${task.isCompleted ? '✓' : '✗'} ${task.title}`)
    .join('\n');

  const vitalsLines = vitals
    .map(formatVitalsLine)
    .filter(Boolean)
    .join('\n');

  return `Generate a care summary for the following shift:

Patient: ${patientName}
Shift: ${shift.startTime.toISOString()} to ${shift.endTime.toISOString()} (${shift.status})

Care Notes:
${shift.careNote?.rawText || 'No notes recorded.'}

Tasks (${completedCount}/${totalCount} completed):
${taskLines || 'No tasks recorded.'}

Recent Vitals (last 5 readings):
${vitalsLines || 'No vitals recorded.'}

Please write a professional care summary paragraph suitable for a handover report.`;
}

router.post('/care-summary', requireRole('CAREGIVER'), async (req, res) => {
  const { shiftId } = req.body;

  if (!shiftId) {
    return res.status(400).json({ error: 'shiftId is required' });
  }

  try {
    const caregiverProfile = await getCaregiverProfile(req.user.userId);

    if (!caregiverProfile) {
      return res.status(404).json({ error: 'Caregiver profile not found' });
    }

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        patientProfile: {
          include: {
            user: { select: { name: true } },
          },
        },
        careNote: true,
        tasks: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.caregiverProfileId !== caregiverProfile.id) {
      return res.status(403).json({ error: 'Forbidden: shift does not belong to this caregiver' });
    }

    const vitals = await prisma.vitalsEntry.findMany({
      where: { patientProfileId: shift.patientProfileId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
    });

    const prompt = buildPrompt(shift, vitals);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_CONTEXT }],
          },
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json();
      console.error('Gemini API error:', errData);
      if (geminiRes.status === 429) {
        return res.status(429).json({
          error: 'AI service is busy. Please wait a moment and try again.',
        });
      }
      throw new Error('Gemini API failed');
    }

    const geminiData = await geminiRes.json();
    const summary = geminiData.candidates[0].content.parts[0].text;

    return res.status(200).json({ summary });
  } catch (err) {
    console.error(err);
    if (err.status === 429) {
      return res.status(429).json({
        error: 'AI service is busy. Please wait a moment and try again.',
      });
    }
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
});

router.post(
  '/transcribe',
  requireRole('CAREGIVER'),
  upload.single('audio'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const stream = Readable.from(req.file.buffer);
      stream.path = 'audio.webm';

      const transcription = await openai.audio.transcriptions.create({
        file: stream,
        model: 'whisper-1',
      });

      return res.status(200).json({ transcript: transcription.text });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Transcription failed' });
    }
  }
);

module.exports = router;
