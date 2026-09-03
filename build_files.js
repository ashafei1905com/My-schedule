import fs from 'fs';

const extracted = JSON.parse(fs.readFileSync('extracted.json', 'utf8'));
const workerCode = fs.readFileSync('worker.js', 'utf8');

function extractFunc(name, isAsync = false) {
  return extracted[name];
}

// 1. Create Core Database / Firebase Utils
let firestoreUtils = `
export let _fbTokenCache = { token: null, expiresAt: 0 };

export function base64url(bytes) {
  let str = typeof bytes === 'string' ? bytes : String.fromCharCode(...new Uint8Array(bytes));
  return btoa(str).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
}
`;
firestoreUtils += extractFunc('importServiceAccountKey', true) + '\n\n';
firestoreUtils += extractFunc('getFirestoreAccessToken', true) + '\n\n';
firestoreUtils += extractFunc('toFirestoreValue', false) + '\n\n';
firestoreUtils += extractFunc('fromFirestoreValue', false) + '\n\n';
firestoreUtils += extractFunc('firestoreGetFood', true) + '\n\n';
firestoreUtils += extractFunc('firestoreSetFood', true) + '\n\n';
// Add exports
firestoreUtils = firestoreUtils.replace(/async function importServiceAccountKey/g, 'export async function importServiceAccountKey');
firestoreUtils = firestoreUtils.replace(/async function getFirestoreAccessToken/g, 'export async function getFirestoreAccessToken');
firestoreUtils = firestoreUtils.replace(/function toFirestoreValue/g, 'export function toFirestoreValue');
firestoreUtils = firestoreUtils.replace(/function fromFirestoreValue/g, 'export function fromFirestoreValue');
firestoreUtils = firestoreUtils.replace(/async function firestoreGetFood/g, 'export async function firestoreGetFood');
firestoreUtils = firestoreUtils.replace(/async function firestoreSetFood/g, 'export async function firestoreSetFood');

fs.mkdirSync('src/core/database', { recursive: true });
fs.writeFileSync('src/core/database/firestore.js', firestoreUtils);

// 2. Create Nutrition Service
let nutritionService = `
import { firestoreGetFood, firestoreSetFood } from '../../core/database/firestore.js';

export function normalizeFoodKey(raw) {
  // original logic...
${extractFunc('normalizeFoodKey', false).replace('function normalizeFoodKey(raw) {', '').slice(0, -1)}
}
`;
nutritionService += extractFunc('usdaNormalizeForScore', false) + '\n\n';
nutritionService += extractFunc('usdaRelevanceScoreDetailed', false) + '\n\n';
nutritionService += extractFunc('usdaRelevanceScore', false) + '\n\n';
nutritionService += extractFunc('usdaPickBestResult', false) + '\n\n';
nutritionService += extractFunc('usdaExtractPer100g', false) + '\n\n';
nutritionService += extractFunc('usdaSearchRaw', true) + '\n\n';
nutritionService += extractFunc('needsDecomposition', false) + '\n\n';
nutritionService += extractFunc('decomposeDish', true) + '\n\n';
nutritionService += extractFunc('translateToArabic', true) + '\n\n';
nutritionService += extractFunc('usdaNormalizeAndRetry', true) + '\n\n';
nutritionService += extractFunc('usdaLookupFood', true) + '\n\n';
nutritionService += extractFunc('tier3EstimateMacro', true) + '\n\n';

nutritionService = nutritionService.replace(/function usdaNormalizeForScore/g, 'export function usdaNormalizeForScore');
nutritionService = nutritionService.replace(/function usdaRelevanceScoreDetailed/g, 'export function usdaRelevanceScoreDetailed');
nutritionService = nutritionService.replace(/function usdaRelevanceScore/g, 'export function usdaRelevanceScore');
nutritionService = nutritionService.replace(/function usdaPickBestResult/g, 'export function usdaPickBestResult');
nutritionService = nutritionService.replace(/function usdaExtractPer100g/g, 'export function usdaExtractPer100g');
nutritionService = nutritionService.replace(/async function usdaSearchRaw/g, 'export async function usdaSearchRaw');
nutritionService = nutritionService.replace(/function needsDecomposition/g, 'export function needsDecomposition');
nutritionService = nutritionService.replace(/async function decomposeDish/g, 'export async function decomposeDish');
nutritionService = nutritionService.replace(/async function translateToArabic/g, 'export async function translateToArabic');
nutritionService = nutritionService.replace(/async function usdaNormalizeAndRetry/g, 'export async function usdaNormalizeAndRetry');
nutritionService = nutritionService.replace(/async function usdaLookupFood/g, 'export async function usdaLookupFood');
nutritionService = nutritionService.replace(/async function tier3EstimateMacro/g, 'export async function tier3EstimateMacro');

fs.mkdirSync('src/features/nutrition/services', { recursive: true });
fs.writeFileSync('src/features/nutrition/services/nutritionService.js', nutritionService);

// 3. Create Nutrition Controller
let nutritionController = `
import { json, corsHeaders } from '../../../core/utils/response.js';
import { normalizeFoodKey, tier3EstimateMacro, usdaLookupFood } from '../services/nutritionService.js';
import { firestoreGetFood, firestoreSetFood } from '../../../core/database/firestore.js';

${extractFunc('handleNutritionLookup', true)}
`;
nutritionController = nutritionController.replace(/async function handleNutritionLookup/g, 'export async function handleNutritionLookup');

fs.mkdirSync('src/features/nutrition/controllers', { recursive: true });
fs.writeFileSync('src/features/nutrition/controllers/nutritionController.js', nutritionController);

// 4. Create Notifications Controller
let notificationsController = `
import { json } from '../../../core/utils/response.js';
import { buildPushPayload } from '@block65/webcrypto-web-push';

function kuwaitNowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuwait',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const o = {};
  parts.forEach(p => { if (p.type !== 'literal') o[p.type] = p.value; });
  return { date: \`\${o.year}-\${o.month}-\${o.day}\`, time: \`\${o.hour}:\${o.minute}\` };
}

${extractFunc('handleSaveSubscription', true)}
${extractFunc('dispatchDueReminders', true)}
`;
notificationsController = notificationsController.replace(/async function handleSaveSubscription/g, 'export async function handleSaveSubscription');
notificationsController = notificationsController.replace(/async function dispatchDueReminders/g, 'export async function dispatchDueReminders');

fs.mkdirSync('src/features/notifications/controllers', { recursive: true });
fs.writeFileSync('src/features/notifications/controllers/notificationController.js', notificationsController);

console.log("Files written successfully");
