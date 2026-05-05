import { expect } from 'chai';
import { By, until } from 'selenium-webdriver';
import { DEFAULT_TIMEOUT, SMEMBER_URL } from '../../src/config/environment.js';
import { createDriver } from '../../src/support/driver.js';
import { takeScreenshot } from '../../src/support/screenshot.js';

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

describe('TC02 - Đăng nhập thất bại', function () {
  let browser;

  // Mỗi test mở browser mới để không bị ảnh hưởng bởi session cũ.
  beforeEach(async function () {
    browser = await createDriver();
  });

  // Sau test luôn chụp màn hình rồi đóng browser để dễ kiểm tra lỗi.
  afterEach(async function () {
    if (!browser) {
      return;
    }

    await takeScreenshot(browser, `${this.currentTest.title}-${this.currentTest.state || 'unknown'}`, this);
    await browser.quit();
    browser = null;
  });

  it('TC02 - Đăng nhập thất bại', async function () {
    // Action: nhập email/số điện thoại hoặc password sai.
    await browser.get(`${SMEMBER_URL}/login`);
    await browser.wait(async () => {
      const readyState = await browser.executeScript('return document.readyState;');
      return readyState === 'complete' || readyState === 'interactive';
    }, DEFAULT_TIMEOUT);

    const identifierInput = await findVisibleElement(LOGIN_IDENTIFIER_INPUT);
    const passwordInput = await findVisibleElement(LOGIN_PASSWORD_INPUT);

    await identifierInput.clear();
    await identifierInput.sendKeys('0123456789');
    await passwordInput.clear();
    await passwordInput.sendKeys('wrong_password_123');
    await clickVisibleText(['^đăng\\s+nhập$', '^dang\\s+nhap$', 'login']);
    await browser.sleep(2500);

    const currentUrl = await browser.getCurrentUrl();
    const body = await browser.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
    const text = await body.getText();

    // Expected: có thông báo lỗi và vẫn chưa đăng nhập.
    expect(currentUrl, 'Fail: tài khoản sai nhưng vẫn bị redirect như đã đăng nhập').to.include('/login');
    expect(text, 'Fail: đăng nhập sai nhưng không hiển thị thông báo lỗi').to.match(/sai|không đúng|không tồn tại|không hợp lệ|thất bại|vui lòng/i);
  });

  // Tìm element đầu tiên đang hiển thị thật sự trên màn hình.
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

  // Click theo chữ hiển thị, ưu tiên button/link có text khớp nhất.
  async function clickVisibleText(textPatterns) {
    await browser.wait(async () => {
      const clicked = await browser.executeScript((patterns) => {
        const regexes = patterns.map((pattern) => new RegExp(pattern, 'i'));
        const elements = Array.from(document.querySelectorAll('button, a, [role="button"], label, div, span, li'));
        const target = elements.map((element) => {
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
        }).filter(Boolean).sort((left, right) => {
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
