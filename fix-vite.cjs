const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf8');

const target = `    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
          }),
        ]
      : []),`;

const replacement = `    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
          }),
        ]
      : []),
    tanstackStart(),`;

if(content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('vite.config.ts', content);
  console.log('Fixed');
} else {
  console.log('Target not found');
}
