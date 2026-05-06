import { By, until } from 'selenium-webdriver';
import { DEFAULT_TIMEOUT, SMEMBER_URL } from '../config/environment.js';
import { getPersonalAccount } from '../support/testData.js';
import { clickVisibleText, findVisibleElement, waitUntilReady } from '../support/domActions.js';

const LOGIN_IDENTIFIER_INPUT = [
  'input[type="email"]',
  'input[placeholder*="email"]',
  'input[placeholder*="Email"]',
  'input[placeholder*="số điện thoại"]',
  'input[placeholder*="Số điện thoại"]',
  'input[placeholder*="SĐT"]',
  'input[maxlength="10"]',
  'input[name*="email"]',
  'input[name*="phone"]'
].join(', ');

const LOGIN_PASSWORD_INPUT = [
  'input[type="password"]',
  'input[placeholder*="mật khẩu"]',
  'input[placeholder*="Mật khẩu"]'
].join(', ');

export async function loginWithPersonalAccount(driver) {
  const account = getPersonalAccount();

  if (!account.identifier || !account.password) {
    throw new Error('Thiếu tài khoản hợp lệ trong src/data/account.local.json');
  }

  await driver.get(`${SMEMBER_URL}/login`);
  await waitUntilReady(driver);

  const identifierInput = await findVisibleElement(driver, LOGIN_IDENTIFIER_INPUT);
  const passwordInput = await findVisibleElement(driver, LOGIN_PASSWORD_INPUT);

  await identifierInput.clear();
  await identifierInput.sendKeys(account.identifier);
  await passwordInput.clear();
  await passwordInput.sendKeys(account.password);
  await clickVisibleText(driver, ['^đăng\\s+nhập$', '^dang\\s+nhap$', 'login']);

  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    const body = await driver.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
    const text = await body.getText();

    return !currentUrl.includes('/login') && /đăng nhập thành công|dang nhap thanh cong/i.test(text);
  }, DEFAULT_TIMEOUT);
}
