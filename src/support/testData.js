import fs from 'node:fs';
import path from 'node:path';

const LOCAL_ACCOUNT_PATH = path.resolve('src/data/account.local.json');

function readLocalAccount() {
  if (!fs.existsSync(LOCAL_ACCOUNT_PATH)) {
    return {};
  }

  const rawData = fs.readFileSync(LOCAL_ACCOUNT_PATH, 'utf8');
  return JSON.parse(rawData);
}

export function getPersonalAccount() {
  const localAccount = readLocalAccount();

  return {
    phone: process.env.CELLPHONES_PHONE || localAccount.phone || '',
    password: process.env.CELLPHONES_PASSWORD || localAccount.password || ''
  };
}
