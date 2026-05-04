export const BASE_URL = 'https://cellphones.com.vn';
export const SMEMBER_URL = 'https://smember.com.vn';

export const DEFAULT_TIMEOUT = 20000;

export const BROWSER_CONFIG = {
  headless: process.env.HEADLESS !== 'false',
  width: Number(process.env.BROWSER_WIDTH || 1440),
  height: Number(process.env.BROWSER_HEIGHT || 1200)
};
