import fs from 'node:fs/promises';
import path from 'node:path';
import addContext from 'mochawesome/addContext.js';

const SCREENSHOT_DIR = path.resolve('screenshots');
const REPORT_DIR = path.resolve(process.env.MOCHAWESOME_REPORT_DIR || 'mochawesome-report');

function sanitizeFileName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export async function takeScreenshot(driver, name, mochaContext) {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(SCREENSHOT_DIR, `${timestamp}-${sanitizeFileName(name)}.png`);
  const image = await driver.takeScreenshot();

  await fs.writeFile(filePath, image, 'base64');

  if (mochaContext?.currentTest) {
    const reportRelativePath = path.relative(REPORT_DIR, filePath).replace(/\\/g, '/');

    addContext(mochaContext, {
      title: 'Screenshot',
      value: reportRelativePath
    });
  }

  return filePath;
}
