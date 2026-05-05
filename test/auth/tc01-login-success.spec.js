import { expect } from 'chai';
import { By, until } from 'selenium-webdriver';
import { DEFAULT_TIMEOUT, SMEMBER_URL } from '../../src/config/environment.js';
import { createDriver } from '../../src/support/driver.js';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { getPersonalAccount } from '../../src/support/testData.js';

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
const LOGIN_PASSWORD_INPUT = 'input[type="password"], input[placeholder*="mật khẩu"], input[placeholder*="Mật khẩu"]';

describe('TC01 - Đăng nhập thành công', function () {
  let browser;

  beforeEach(async function () {
    browser = await createDriver();
  });

  afterEach(async function () {
    if (!browser) {
      return;
    }

    await takeScreenshot(browser, `${this.currentTest.title}-${this.currentTest.state || 'unknown'}`, this);
    await browser.quit();
    browser = null;
  });

  it('TC01 - Đăng nhập thành công', async function () {
    const account = getPersonalAccount();

    if (!account.identifier || !account.password) {
      this.skip();
    }

    // Action: nhập email/số điện thoại và password hợp lệ, sau đó bấm Đăng nhập.
    await browser.get(`${SMEMBER_URL}/login`);
    await browser.wait(async () => {
      const readyState = await browser.executeScript('return document.readyState;');
      return readyState === 'complete' || readyState === 'interactive';
    }, DEFAULT_TIMEOUT);

    const identifierInput = await findVisibleElement(LOGIN_IDENTIFIER_INPUT);
    const passwordInput = await findVisibleElement(LOGIN_PASSWORD_INPUT);

    await identifierInput.clear();
    await identifierInput.sendKeys(account.identifier);
    await passwordInput.clear();
    await passwordInput.sendKeys(account.password);
    await clickVisibleText(['^đăng\\s+nhập$', '^dang\\s+nhap$', 'login']);

    await browser.wait(async () => !(await browser.getCurrentUrl()).includes('/login'), DEFAULT_TIMEOUT);

    const currentUrl = await browser.getCurrentUrl();
    const body = await browser.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
    const text = await body.getText();

    const userIsDisplayed = account.expectedName
      ? text.includes(account.expectedName)
      : /đăng nhập thành công|dang nhap thanh cong|tài khoản|tai khoan|smember|thành viên|thanh vien|hạng|hang|điểm|diem/i.test(text)
        || text.includes(account.identifier);

    // Expected: đăng nhập thành công, chuyển khỏi form login/dashboard và hiển thị tín hiệu user đã đăng nhập.
    expect(currentUrl, 'Fail: vẫn ở form login, không chuyển trang sau khi đăng nhập').to.not.include('/login');
    expect(userIsDisplayed, 'Fail: đăng nhập xong nhưng không hiển thị thông tin user').to.equal(true);
    expect(text, 'Fail: login thành công nhưng vẫn hiển thị lỗi').to.not.match(/sai|không đúng|không hợp lệ|thất bại/i);
  });

  async function findVisibleElement(cssSelector) {
    await browser.wait(async () => {
      const elements = await browser.findElements(By.css(cssSelector));

      for (const element of elements) {
        if (await element.isDisplayed().catch(() => false)) {
          return true;
        }
      }

      return false;
    }, DEFAULT_TIMEOUT);

    const elements = await browser.findElements(By.css(cssSelector));

    for (const element of elements) {
      if (await element.isDisplayed().catch(() => false)) {
        return element;
      }
    }

    throw new Error(`Không tìm thấy element visible: ${cssSelector}`);
  }

  async function clickVisibleText(textPatterns) {
    await browser.wait(async () => {
      const clicked = await browser.executeScript((patterns) => {
        const regexes = patterns.map((pattern) => new RegExp(pattern, 'i'));
        const elements = Array.from(document.querySelectorAll('button, a, [role="button"], label, div, span, li'));
        const candidates = elements.map((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
          const directText = Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          const textToMatch = directText || text;

          if (!textToMatch || rect.width <= 0 || rect.height <= 0 || style.display === 'none' || style.visibility === 'hidden') {
            return null;
          }

          if (!regexes.some((regex) => regex.test(textToMatch))) {
            return null;
          }

          return {
            element,
            area: rect.width * rect.height,
            isInteractive: /^(BUTTON|A|LABEL)$/i.test(element.tagName) || element.getAttribute('role') === 'button',
            hasDirectText: Boolean(directText),
            top: rect.top
          };
        }).filter(Boolean);
        const target = candidates.sort((left, right) => {
          if (left.isInteractive !== right.isInteractive) {
            return left.isInteractive ? -1 : 1;
          }

          if (left.hasDirectText !== right.hasDirectText) {
            return left.hasDirectText ? -1 : 1;
          }

          return left.area - right.area || left.top - right.top;
        })[0]?.element;

        if (!target) {
          return false;
        }

        target.scrollIntoView({ block: 'center', inline: 'center' });
        target.click();
        return true;
      }, textPatterns);

      return clicked;
    }, DEFAULT_TIMEOUT);
  }
});
