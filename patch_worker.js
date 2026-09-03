import fs from 'fs';

let content = fs.readFileSync('worker.js', 'utf8');

const importStatement = `import { handleBuildSchedule } from './src/features/schedule/controllers/scheduleController.js';\n`;

if (!content.includes('handleBuildSchedule')) {
  // Add import to top
  const allowOriginIndex = content.indexOf('const ALLOWED_ORIGIN');
  content = content.slice(0, allowOriginIndex) + importStatement + content.slice(allowOriginIndex);

  // Replace old block with handleBuildSchedule
  const blockStart = content.indexOf('if (request.method === "POST" && url.pathname === "/api/build-schedule") {');
  const blockEnd = content.indexOf('// ===== end build-schedule =====') + '// ===== end build-schedule ====='.length;

  const newBlock = `if (request.method === "POST" && url.pathname === "/api/build-schedule") {
      return handleBuildSchedule(request, env);
    }`;

  content = content.slice(0, blockStart) + newBlock + content.slice(blockEnd);
  fs.writeFileSync('worker.js', content, 'utf8');
  console.log('Worker updated successfully');
}
