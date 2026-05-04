import fs from 'node:fs/promises';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('screenshots');

function sanitizeFileName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export async function takeScreenshot(driver, name) {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(SCREENSHOT_DIR, `${timestamp}-${sanitizeFileName(name)}.png`);
  const image = await driver.takeScreenshot();

  await fs.writeFile(filePath, image, 'base64');
  return filePath;
}
