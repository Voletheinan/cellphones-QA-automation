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

describe('TC09 - Thêm vào giỏ', function () {
  let browser;

  // Mỗi test dùng một browser mới để tránh dữ liệu cũ trong phiên trước.
  beforeEach(async function () {
    browser = await createDriver();
  });

  // Chụp screenshot cuối test và đóng browser.
  afterEach(async function () {
    if (!browser) {
      return;
    }

    await takeScreenshot(browser, `${this.currentTest.title}-${this.currentTest.state || 'unknown'}`, this);
    await browser.quit();
    browser = null;
  });

  it('TC09 - Thêm vào giỏ', async function () {
    // Precondition: người dùng đã đăng nhập đúng tài khoản và giỏ hàng đang trống.
    await loginDirect();
    await clearCartDirect();

    // Dữ liệu kiểm tra: sản phẩm Huawei Band 11 cần thêm vào giỏ.
    const keyword = 'Vòng đeo tay thông minh Huawei Band 11';

    // Action: tìm sản phẩm, mở chi tiết và thêm vào giỏ sau khi đã đăng nhập.
    await browser.get(BASE_URL);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    const input = await findVisibleElement(SEARCH_INPUT);
    await input.click();
    await input.clear();
    await input.sendKeys(keyword, Key.ENTER);

    try {
      await browser.wait(until.urlContains('/catalogsearch/result'), 8000);
    } catch {
      await browser.get(`${BASE_URL}/catalogsearch/result?q=${encodeURIComponent(keyword)}`);
    }

    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);
    await clickProductByMatchers([/huawei/i, /band\s*11/i]);

    const productPrice = await getPrimaryProductPrice();
    const productName = (await browser.findElement(By.css('.box-product-name h1, h1')).getText()).trim();

    // Kiểm tra: sản phẩm mở đúng và đọc được giá trước khi thêm vào giỏ.
    // Mong đợi: tên có Huawei Band 11 và giá là số lớn hơn 0.
    expect(productName, 'Fail: mở sai sản phẩm sau khi tìm kiếm Huawei Band 11').to.match(/huawei.*band\s*11|band\s*11.*huawei/i);
    expect(productPrice, `Fail: không đọc được giá chính của ${productName}`).to.be.a('number').and.greaterThan(0);

    const addToCartButton = await findVisibleElement('.add-to-cart-button, button[class*="add-to-cart"], button[class*="cart"]');
    await safeClick(addToCartButton);
    await browser.sleep(2500);

    try {
      await clickVisibleText(['xem\\s+giỏ\\s+hàng', 'giỏ\\s+hàng', 'cart'], 5000);
    } catch {
      await browser.get(`${BASE_URL}/cart`);
    }

    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    const body = await browser.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
    const cartText = await body.getText();
    const cartPrices = parseVndPrices(cartText);
    const quantity = await readVisibleQuantityDirect();

    // Dữ liệu đối chiếu: text giỏ hàng, giá trong giỏ và số lượng sản phẩm.
    // Kiểm tra: các expect bên dưới xác nhận thêm vào giỏ đúng sản phẩm.
    // Mong đợi: sản phẩm xuất hiện trong giỏ, đúng giá và số lượng.
    expect(cartText.toLowerCase(), 'Fail: thêm giỏ nhưng không thấy sản phẩm Huawei Band 11 trong giỏ').to.include('huawei');
    expect(cartPrices, 'Fail: sản phẩm trong giỏ không hiển thị đúng giá').to.include(productPrice);
    expect(quantity === 1 || /\b1\b/.test(cartText), 'Fail: số lượng sản phẩm trong giỏ không phải 1').to.equal(true);
  });

  // Đợi trang ở trạng thái có thể thao tác.
  async function waitUntilReady() {
    await browser.wait(async () => {
      const readyState = await browser.executeScript('return document.readyState;');
      return readyState === 'complete' || readyState === 'interactive';
    }, DEFAULT_TIMEOUT);
  }

  // Tìm element đang hiển thị thật sự trên màn hình.
  async function findVisibleElement(cssSelector, timeout = DEFAULT_TIMEOUT) {
    await browser.wait(async () => {
      const elements = await browser.findElements(By.css(cssSelector));

      for (const element of elements) {
        if (await element.isDisplayed().catch(() => false)) {
          return true;
        }
      }

      return false;
    }, timeout);

    const elements = await browser.findElements(By.css(cssSelector));

    for (const element of elements) {
      if (await element.isDisplayed().catch(() => false)) {
        return element;
      }
    }

    throw new Error(`Không tìm thấy element visible: ${cssSelector}`);
  }

  // Scroll tới element rồi click bằng JavaScript để tránh bị overlay nhỏ cản click.
  async function safeClick(element) {
    await browser.executeScript('arguments[0].scrollIntoView({ block: "center", inline: "center" });', element);
    await browser.executeScript('arguments[0].click();', element);
  }

  // Click phần tử theo text hiển thị, phù hợp với button/link không có selector ổn định.
  async function clickVisibleText(textPatterns, timeout = DEFAULT_TIMEOUT) {
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
    }, textPatterns), timeout);
  }

  // Đăng nhập bằng tài khoản cá nhân cấu hình trong file local.
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

  // Làm sạch giỏ hàng trước khi test thêm sản phẩm mới.
  async function clearCartDirect() {
    await browser.get(BASE_URL);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);
    await browser.executeScript(() => {
      const shouldRemove = (key) => /cart|order|paid-products|product-added|total-cart/i.test(key);

      Object.keys(localStorage).forEach((key) => {
        if (shouldRemove(key)) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach((key) => {
        if (shouldRemove(key)) {
          sessionStorage.removeItem(key);
        }
      });
    });

    await browser.get(`${BASE_URL}/cart`);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const deleted = await browser.executeScript(() => {
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const candidates = Array.from(document.querySelectorAll('button, [role="button"], a, svg, i, span, div'))
          .filter((element) => {
            const text = (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim();
            const className = element.getAttribute('class') || '';
            const label = `${text} ${className}`;
            return visible(element) && /xóa|xoá|delete|remove|trash|fa-trash|icon-delete/i.test(label) && !/bỏ chọn|bo chon/i.test(label);
          });
        const targetElement = candidates[0];
        const target = targetElement?.closest('button, [role="button"], a') || targetElement;

        if (!target) {
          return false;
        }

        target.click();
        return true;
      });

      if (!deleted) {
        break;
      }

      await browser.sleep(700);
      await clickVisibleText(['đồng\\s+ý', 'xác\\s+nhận', 'xóa', 'xoá', 'delete', 'remove'], 1500).catch(() => {});
      await browser.sleep(1200);
    }
  }

  // Click đúng sản phẩm trong danh sách kết quả bằng các từ khóa cần khớp.
  async function clickProductByMatchers(productMatchers) {
    await browser.wait(async () => browser.executeScript((patternSources) => {
      const regexes = patternSources.map((source) => new RegExp(source, 'i'));
      const links = Array.from(document.querySelectorAll('.product-list-filter a[href*=".html"], a[href*=".html"]'));
      const target = links.find((link) => {
        const rect = link.getBoundingClientRect();
        const style = window.getComputedStyle(link);
        const text = (link.innerText || link.textContent || '').replace(/\s+/g, ' ').trim();
        return text && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && regexes.every((regex) => regex.test(text));
      });

      if (!target) {
        return false;
      }

      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    }, productMatchers.map((matcher) => matcher.source)), DEFAULT_TIMEOUT);

    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);
  }

  // Lấy giá bán chính đang hiển thị trên trang chi tiết sản phẩm.
  async function getPrimaryProductPrice() {
    return browser.executeScript(() => {
      const selectors = ['.sale-price', '.box-info__box-price .product__price--show', '.product__price--show', '[class*="sale-price"]', '[class*="price"]'];
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const parsePrice = (text) => {
        const match = `${text}`.match(/(\d{1,3}(?:\.\d{3}){1,}|\d{4,})\s*(?:đ|₫)/i);
        return match ? Number(match[1].replace(/\./g, '')) : null;
      };

      for (const selector of selectors) {
        for (const element of Array.from(document.querySelectorAll(selector))) {
          if (!visible(element)) {
            continue;
          }

          const price = parsePrice(element.innerText || element.textContent || '');

          if (price) {
            return price;
          }
        }
      }

      return parsePrice(document.body.innerText || '');
    });
  }

  // Đọc số lượng sản phẩm trong giỏ từ input hoặc cụm nút +/-.
  async function readVisibleQuantityDirect() {
    return browser.executeScript(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const readNumber = (text) => {
        const match = `${text}`.match(/\b([1-9]\d?)\b/);
        return match ? Number(match[1]) : null;
      };
      const inputs = Array.from(document.querySelectorAll('input[type="number"], input[class*="quantity"], input[name*="quantity"]'))
        .filter(visible)
        .map((input) => Number(input.value))
        .filter((value) => Number.isFinite(value) && value > 0);

      if (inputs.length > 0) {
        return inputs[0];
      }

      for (const plusControl of Array.from(document.querySelectorAll('button, [role="button"], span, div')).filter((element) => visible(element) && /^(\+|＋)$/.test((element.innerText || element.textContent || '').trim()))) {
        let container = plusControl.parentElement;

        for (let depth = 0; container && depth < 5; depth += 1, container = container.parentElement) {
          const text = (container.innerText || container.textContent || '').replace(/\s+/g, ' ').trim();

          if (text.length <= 60 && /(\+|＋)/.test(text) && /(-|−)/.test(text)) {
            const value = readNumber(text);

            if (value !== null) {
              return value;
            }
          }
        }
      }

      return null;
    });
  }
});

// Tách toàn bộ giá tiền VND trong text và đổi về dạng number.
function parseVndPrices(text) {
  return Array.from(`${text}`.matchAll(/(\d{1,3}(?:\.\d{3}){1,}|\d{4,})\s*(?:đ|₫)/gi))
    .map((match) => Number(match[1].replace(/\./g, '')))
    .filter((price) => price > 0);
}
