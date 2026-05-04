import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { BROWSER_CONFIG } from '../config.js';

function findExistingPath(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate));
}

function findChromeBinaryPath() {
  return findExistingPath([
    process.env.CHROME_BINARY_PATH,
    process.env.GOOGLE_CHROME_BIN,
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ]);
}

function findCachedChromeDriverPath() {
  if (process.env.CHROMEDRIVER_PATH && fs.existsSync(process.env.CHROMEDRIVER_PATH)) {
    return process.env.CHROMEDRIVER_PATH;
  }

  const chromeDriverRoot = path.join(os.homedir(), '.cache', 'selenium', 'chromedriver', 'win64');

  if (!fs.existsSync(chromeDriverRoot)) {
    return null;
  }

  return fs.readdirSync(chromeDriverRoot)
    .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))
    .map((version) => path.join(chromeDriverRoot, version, 'chromedriver.exe'))
    .find((candidate) => fs.existsSync(candidate));
}

function getSeleniumManagerBinaryPath() {
  const binaryName = process.platform === 'win32' ? 'selenium-manager.exe' : 'selenium-manager';
  const platformDir = process.platform === 'win32'
    ? 'windows'
    : process.platform === 'darwin'
      ? 'macos'
      : 'linux';

  return path.resolve('node_modules', 'selenium-webdriver', 'bin', platformDir, binaryName);
}

function getManagedChromePaths() {
  const cachedPaths = {
    browserPath: findChromeBinaryPath(),
    driverPath: findCachedChromeDriverPath()
  };

  if (cachedPaths.browserPath && cachedPaths.driverPath) {
    return cachedPaths;
  }

  const output = execFileSync(getSeleniumManagerBinaryPath(), [
    '--browser',
    'chrome',
    '--language-binding',
    'javascript',
    '--output',
    'json'
  ], { encoding: 'utf8' });
  const result = JSON.parse(output).result || {};

  return {
    browserPath: result.browser_path || cachedPaths.browserPath,
    driverPath: result.driver_path || cachedPaths.driverPath
  };
}

export async function createDriver() {
  const options = new chrome.Options();
  const builder = new Builder().forBrowser('chrome');
  const userDataDir = path.resolve('.selenium', `chrome-profile-${process.pid}-${Date.now()}`);

  fs.mkdirSync(userDataDir, { recursive: true });

  if (BROWSER_CONFIG.headless) {
    options.addArguments('--headless=new');
  }

  options.addArguments(
    `--window-size=${BROWSER_CONFIG.width},${BROWSER_CONFIG.height}`,
    '--disable-notifications',
    '--disable-popup-blocking',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`
  );

  try {
    const { browserPath, driverPath } = getManagedChromePaths();

    if (browserPath) {
      options.setChromeBinaryPath(browserPath);
    }

    if (driverPath) {
      builder.setChromeService(new chrome.ServiceBuilder(driverPath));
    }
  } catch {
    // Fallback ve Selenium Manager mac dinh neu moi truong khong cho goi binary truc tiep.
  }

  // Selenium Manager tu dong tim ChromeDriver phu hop voi Chrome dang cai tren may.
  return builder.setChromeOptions(options).build();
}
