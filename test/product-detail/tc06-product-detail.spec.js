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

describe('TC06 - Xem chi tiết sản phẩm', function () {
  let browser;

  beforeEach(async function () {
    browser = await createDriver();
  });

  afterEach(async function () {
    if (!browser) {
      return;
    }

    await takeScreenshot(browser, `${this.currentTest.title}-${this.currentTest.state || 'unknown'}`);
    await browser.quit();
    browser = null;
  });

  it('TC06 - Xem chi tiết sản phẩm', async function () {
    // Precondition: đăng nhập đúng tài khoản trước khi kiểm tra chức năng chính.
    await loginDirect();

    // Action: tìm Laptop ASUS Vivobook S 14 FLIP TP3402VA-LZ632W và click vào sản phẩm đầu tiên.
    await browser.get(BASE_URL);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    const input = await findVisibleElement(SEARCH_INPUT);
    await input.click();
    await input.clear();
    await input.sendKeys('Laptop ASUS Vivobook S 14 FLIP TP3402VA-LZ632W', Key.ENTER);

    try {
      await browser.wait(until.urlContains('/catalogsearch/result'), 8000);
    } catch {
      await browser.get(`${BASE_URL}/catalogsearch/result?q=${encodeURIComponent('Laptop ASUS Vivobook S 14 FLIP TP3402VA-LZ632W')}`);
    }

    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    const products = await getVisibleProductsDirect(3);
    expect(products.length, 'Fail: không có sản phẩm để mở chi tiết').to.be.greaterThan(0);

    const expectedToken = products[0].name
      .toLowerCase()
      .split(/\s+/)
      .find((word) => word.length >= 4 && !/^\d/.test(word) && !/^(laptop|máy|tính|chính|hãng)$/i.test(word)) || products[0].name.toLowerCase().split(/\s+/)[0];
    const clicked = await browser.executeScript(() => {
      const links = Array.from(document.querySelectorAll('.product-list-filter a[href*=".html"], a[href*=".html"]'));

      for (const link of links) {
        const rect = link.getBoundingClientRect();
        const style = window.getComputedStyle(link);
        const text = (link.innerText || '').replace(/\s+/g, ' ').trim();

        if (text && /(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:đ|₫)/i.test(text) && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
          link.scrollIntoView({ block: 'center', inline: 'center' });
          link.click();
          return true;
        }
      }

      return false;
    });

    expect(clicked, 'Fail: click sản phẩm không mở được trang chi tiết').to.equal(true);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    const currentUrl = await browser.getCurrentUrl();
    const detail = await browser.executeScript(() => {
      const visible = (element) => {
        if (!element) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const name = document.querySelector('.box-product-name h1, h1')?.innerText?.trim() || '';
      const text = document.body.innerText || '';
      const imageCount = Array.from(document.querySelectorAll('img')).filter((img) => visible(img) && img.naturalWidth > 0).length;

      return {
        name,
        imageCount,
        hasPrice: /(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:đ|₫)/i.test(text),
        hasDescription: /mô tả|mo ta|thông số|thong so|đặc điểm|dac diem/i.test(text)
      };
    });

    // Expected: mở đúng trang chi tiết, có tên, giá, ảnh, mô tả/thông số.
    expect(currentUrl, 'Fail: click sản phẩm không chuyển sang URL chi tiết').to.match(/\.html/i);
    expect(detail.name.toLowerCase(), 'Fail: mở sai sản phẩm so với item đã click').to.include(expectedToken);
    expect(detail.name, 'Fail: trang chi tiết không phải sản phẩm ASUS Vivobook').to.match(/asus|vivobook/i);
    expect(detail.hasPrice, 'Fail: trang chi tiết thiếu giá').to.equal(true);
    expect(detail.imageCount, 'Fail: trang chi tiết thiếu ảnh sản phẩm').to.be.greaterThan(0);
    expect(detail.hasDescription, 'Fail: trang chi tiết thiếu mô tả/thông số').to.equal(true);
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
      const target = Array.from(document.querySelectorAll('button, a, [role="button"], label, div, span, li')).find((element) => {
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

  async function getVisibleProductsDirect(limit = 12) {
    return browser.executeScript((maxItems) => {
      const seen = new Set();
      const products = [];
      const links = Array.from(document.querySelectorAll('.product-list-filter a[href*=".html"], a[href*=".html"]'));

      for (const link of links) {
        const rect = link.getBoundingClientRect();
        const style = window.getComputedStyle(link);
        const text = (link.innerText || '').replace(/\s+/g, ' ').trim();
        const title = (link.querySelector('h3, [class*="name"], [class*="title"]')?.innerText || text).replace(/\s+/g, ' ').trim();
        const priceText = text.match(/(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:đ|₫)/i)?.[0] || '';
        const href = link.href;

        if (href && title && priceText && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && !seen.has(href) && !/tin-tuc|news|phu-kien|sim-so/i.test(href)) {
          seen.add(href);
          products.push({ name: title, href, price: priceText });
        }

        if (products.length >= maxItems) {
          break;
        }
      }

      return products;
    }, limit);
  }
});
