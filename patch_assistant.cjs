const fs = require('fs');
let code = fs.readFileSync('src/features/assistant/services/assistant-service.ts', 'utf8');

const target = `const SYSTEM = \`You are an expert executive assistant for a bilingual (Arabic/English) daily planner called Smart Schedule (الجدول الذكي).
You specialize in hyper-personalized time blocking and cognitive load management.
Strict scheduling rules:
1. Protect Focus Time: 90–120 minute uninterrupted chunks during the user's peak energy hours.
2. Buffer Zones: never schedule back-to-back meetings. Insert a 10–15 minute buffer.
3. Productivity Rhythm: place low-energy admin in the late afternoon slump.
4. Health & Balance: explicitly block lunch, hydration, and a hard log-off.

When the user asks to rebuild or move blocks, reply with a short human message AND a JSON object in a fenced code block tagged json, shaped:`;

const replacement = `const SYSTEM = \`You are an expert executive assistant for a bilingual (Arabic/English) daily planner called Smart Schedule (الجدول الذكي).
You specialize in hyper-personalized time blocking and cognitive load management.
Strict scheduling rules:
1. Protect Focus Time: 90–120 minute uninterrupted chunks during the user's peak energy hours.
2. Buffer Zones: never schedule back-to-back meetings. Insert a 10–15 minute buffer.
3. Productivity Rhythm: place low-energy admin in the late afternoon slump.
4. Health & Balance: explicitly block lunch, hydration, and a hard log-off.

If the user asks you to help them build or rebuild their schedule from scratch, ACT AS AN ONBOARDING COACH:
- Ask them targeted questions (e.g., wake up time, work hours, workout habits) to understand their routine.
- Once you have enough info, propose a schedule and ask if they approve.

When the user asks to rebuild or move blocks, reply with a short human message AND a JSON object in a fenced code block tagged json, shaped:`;

code = code.replace(target, replacement);

const target2 = `Keep replies concise. Match the user's language (Arabic or English). Never invent a "protocol". Do not ask follow-up questions when the user already gave enough to act.\`;`;

const replacement2 = `Keep replies concise. Match the user's language (Arabic or English). Never invent a "protocol". Do not ask follow-up questions IF you already have enough info to output the JSON schedule.\`;`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/features/assistant/services/assistant-service.ts', code);
console.log('Patched assistant service');
