import { expect } from 'chai';
import { By, Key, until } from 'selenium-webdriver';
import { BASE_URL, DEFAULT_TIMEOUT, SMEMBER_URL } from '../../src/config/environment.js';
import { createDriver } from '../../src/support/driver.js';
import { hideCookieConsentIfPresent } from '../../src/support/overlays.js';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { getPersonalAccount } from '../../src/support/testData.js';

const SEARCH_INPUT = 'input[data-slot="input"], input[placeholder*="muốn mua"], input[placeholder*="Bạn muốn mua"]';
const LOGIN_IDENTIFIER_INPUT = 'input[type="email"], input[placeholder*="email"], input[placeholder*="Email"], input[placeholder*="số điện thoại"], input[placeholder*="Số điện thoại"], input[placeholder*="SĐT"], input[maxlength="10"], input[name*="email"], input[name*="phone"]';
const LOGIN_PASSWORD_INPUT = 'input[type="password"], input[placeholder*="mật khẩu"], input[placeholder*="Mật khẩu"]';

describe('TC04 - Tìm kiếm 254 ký tự', function () {
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

  it('TC04 - Tìm kiếm 254 ký tự', async function () {
    // Dữ liệu kiểm tra: chuỗi 254 ký tự để kiểm tra giới hạn ô tìm kiếm.
    const longKeyword = 'a'.repeat(254);

    // Precondition: đăng nhập đúng tài khoản trước khi kiểm tra chức năng chính.
    await loginDirect();

    // Action: tìm kiếm chuỗi 254 ký tự "a".
    await browser.get(BASE_URL);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    const input = await findVisibleElement(SEARCH_INPUT);
    await input.click();
    await input.clear();
    await input.sendKeys(longKeyword, Key.ENTER);

    try {
      await browser.wait(until.urlContains('/catalogsearch/result'), 8000);
    } catch {
      await browser.get(`${BASE_URL}/catalogsearch/result?q=${encodeURIComponent(longKeyword)}`);
    }

    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    const body = await browser.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
    const text = await body.getText();
    // Dữ liệu đối chiếu: trạng thái tải trang, nội dung trang và kích thước UI sau khi search.
    const health = await browser.executeScript(() => ({
      readyState: document.readyState,
      title: document.title,
      url: location.href,
      bodyLength: document.body.innerText.length,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    }));

    // Kiểm tra: các expect bên dưới xác nhận hệ thống xử lý input dài ổn định.
    // Mong đợi: hệ thống vẫn phản hồi, không crash, có thể trả về rỗng.
    expect(health.readyState, 'Fail: trang không phản hồi sau khi search 254 ký tự').to.match(/complete|interactive/);
    expect(health.bodyLength, 'Fail: trang trắng hoàn toàn sau khi search 254 ký tự').to.be.greaterThan(0);
    expect(`${health.title}\n${health.url}`, 'Fail: search 254 ký tự gây lỗi 500/server error').to.not.match(/500|server error/i);
    expect(text, 'Fail: search 254 ký tự bị chuyển sang trang maintenance/crash').to.not.match(/website đang bảo trì|website dang bao tri|maintenance mode/i);
    expect(health.scrollWidth, 'Fail: UI vỡ/tràn ngang bất thường sau khi search 254 ký tự').to.be.lessThan(health.viewportWidth + 240);
  });

  async function waitUntilReady() {
    await browser.wait(async () => {
      const readyState = await browser.executeScript('return document.readyState;');
      return readyState === 'complete' || readyState === 'interactive';
    }, DEFAULT_TIMEOUT);
  }

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
    await browser.wait(async () => browser.executeScript((patterns) => {
      const regexes = patterns.map((pattern) => new RegExp(pattern, 'i'));
      const elements = Array.from(document.querySelectorAll('button, a, [role="button"], label, div, span, li'));
      const target = elements.find((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
        return text && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && regexes.some((regex) => regex.test(text));
      });

      if (!target) {
        return false;
      }

      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    }, textPatterns), DEFAULT_TIMEOUT);
  }

  async function loginDirect() {
    const account = getPersonalAccount();

    if (!account.identifier || !account.password) {
      throw new Error('Thiếu tài khoản hợp lệ trong src/data/account.local.json');
    }

    await browser.get(`${SMEMBER_URL}/login`);
    await waitUntilReady();

    const identifierInput = await findVisibleElement(LOGIN_IDENTIFIER_INPUT);
    const passwordInput = await findVisibleElement(LOGIN_PASSWORD_INPUT);

    await identifierInput.clear();
    await identifierInput.sendKeys(account.identifier);
    await passwordInput.clear();
    await passwordInput.sendKeys(account.password);
    await clickVisibleText(['^đăng\\s+nhập$', '^dang\\s+nhap$', 'login']);

    await browser.wait(async () => {
      const currentUrl = await browser.getCurrentUrl();
      const body = await browser.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
      const text = await body.getText();
      return !currentUrl.includes('/login') && /đăng nhập thành công|dang nhap thanh cong/i.test(text);
    }, DEFAULT_TIMEOUT);
  }
});
