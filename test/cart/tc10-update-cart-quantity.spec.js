import { expect } from 'chai';
import { By, until } from 'selenium-webdriver';
import { BASE_URL, DEFAULT_TIMEOUT, SMEMBER_URL } from '../../src/config/environment.js';
import { createDriver } from '../../src/support/driver.js';
import { hideCookieConsentIfPresent } from '../../src/support/overlays.js';
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
const MAX_CART_QUANTITY = 5;

describe('TC10 - Tăng số lượng trong giỏ hàng', function () {
  let driver;

  beforeEach(async function () {
    driver = await createDriver();
  });

  afterEach(async function () {
    if (!driver) {
      return;
    }

    await takeScreenshot(driver, `${this.currentTest.title}-${this.currentTest.state || 'unknown'}`);
    await driver.quit();
    driver = null;
  });

  it('TC10 - Cộng thêm 1 sản phẩm đã có trong giỏ hàng', async function () {
    // Precondition: người dùng đã đăng nhập và giỏ hàng đã có ít nhất 1 sản phẩm với số lượng nhỏ hơn 5.
    await loginDirect();

    // Action: vào trang chủ CellphoneS, chọn Giỏ hàng trên header, rồi bấm + một lần cho sản phẩm đang có trong giỏ.
    await goToCartFromHomeDirect();
    await loginFromCartIfRequired();
    await closeModalIfPresent();

    const cartBefore = await getCartState();

    expect(cartBefore.loginRequired, 'Fail: vào giỏ hàng nhưng CellphoneS vẫn yêu cầu đăng nhập').to.equal(false);
    expect(cartBefore.hasProduct, 'Fail: giỏ hàng chưa có sản phẩm nên không thể cộng thêm số lượng').to.equal(true);
    expect(cartBefore.quantity, 'Fail: không đọc được số lượng hiện tại trong giỏ').to.be.a('number').and.greaterThan(0);
    expect(
      cartBefore.quantity,
      `Fail: số lượng hiện tại đã là ${MAX_CART_QUANTITY}, CellphoneS không cho mua quá ${MAX_CART_QUANTITY} sản phẩm`
    ).to.be.lessThan(MAX_CART_QUANTITY);

    await increaseQuantityByOneDirect();
    await driver.wait(async () => {
      const state = await getCartState();
      return state.quantity === cartBefore.quantity + 1;
    }, DEFAULT_TIMEOUT);
    const cartAfter = await getCartState();

    // Expected: số lượng tăng đúng 1 và không vượt quá giới hạn 5 sản phẩm.
    expect(cartAfter.quantity, 'Fail: bấm + nhưng số lượng không tăng thêm đúng 1').to.equal(cartBefore.quantity + 1);
    expect(cartAfter.quantity, `Fail: số lượng sau khi tăng vượt quá giới hạn ${MAX_CART_QUANTITY} sản phẩm`).to.be.at.most(MAX_CART_QUANTITY);
    expect(cartAfter.text, 'Fail: sau khi tăng số lượng, giỏ hàng bị mất sản phẩm').to.match(/\d{1,3}(?:\.\d{3})+\s*(?:đ|₫)/i);
  });

  async function waitUntilReady() {
    await driver.wait(async () => {
      const readyState = await driver.executeScript('return document.readyState;');
      return readyState === 'complete' || readyState === 'interactive';
    }, DEFAULT_TIMEOUT);
  }

  async function getBodyText() {
    const body = await driver.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
    return body.getText();
  }

  async function findVisibleElement(cssSelector, timeout = DEFAULT_TIMEOUT) {
    await driver.wait(async () => {
      const elements = await driver.findElements(By.css(cssSelector));

      for (const element of elements) {
        if (await element.isDisplayed().catch(() => false)) {
          return true;
        }
      }

      return false;
    }, timeout);

    const elements = await driver.findElements(By.css(cssSelector));

    for (const element of elements) {
      if (await element.isDisplayed().catch(() => false)) {
        return element;
      }
    }

    throw new Error(`Không tìm thấy element visible: ${cssSelector}`);
  }

  async function clickVisibleText(textPatterns, timeout = DEFAULT_TIMEOUT) {
    await driver.wait(async () => {
      const clicked = await driver.executeScript((patterns) => {
        const regexes = patterns.map((pattern) => new RegExp(pattern, 'i'));
        const elements = Array.from(document.querySelectorAll('button, a, [role="button"], label, div, span, li'));
        const visible = (element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const candidates = elements.map((element) => {
          const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
          const directText = Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          const textToMatch = directText || text;

          if (!textToMatch || !visible(element) || !regexes.some((regex) => regex.test(textToMatch))) {
            return null;
          }

          const rect = element.getBoundingClientRect();

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
    }, timeout);
  }

  async function loginDirect() {
    const account = getPersonalAccount();

    if (!account.identifier || !account.password) {
      throw new Error('Thiếu tài khoản hợp lệ trong src/data/account.local.json');
    }

    await driver.get(`${SMEMBER_URL}/login`);
    await waitUntilReady();

    const identifierInput = await findVisibleElement(LOGIN_IDENTIFIER_INPUT);
    const passwordInput = await findVisibleElement(LOGIN_PASSWORD_INPUT);

    await identifierInput.clear();
    await identifierInput.sendKeys(account.identifier);
    await passwordInput.clear();
    await passwordInput.sendKeys(account.password);
    await clickVisibleText(['^đăng\\s+nhập$', '^dang\\s+nhap$', 'login']);

    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      const text = await getBodyText();

      return !currentUrl.includes('/login') && /đăng nhập thành công|dang nhap thanh cong/i.test(text);
    }, DEFAULT_TIMEOUT);
  }

  async function loginFromCartIfRequired() {
    const account = getPersonalAccount();
    const loginRequired = await driver.executeScript(() => {
      const text = document.body.innerText || '';
      return /vui lòng đăng nhập|vui long dang nhap|đăng nhập ngay|dang nhap ngay/i.test(text);
    });

    if (!loginRequired) {
      return;
    }

    const handlesBefore = await driver.getAllWindowHandles();
    await clickVisibleText(['đăng\\s+nhập\\s+ngay', '^đăng\\s+nhập$', '^dang\\s+nhap$'], 8000);
    await driver.sleep(1500);

    const handlesAfter = await driver.getAllWindowHandles();

    if (handlesAfter.length > handlesBefore.length) {
      await driver.switchTo().window(handlesAfter[handlesAfter.length - 1]);
    }

    await waitUntilReady();
    await fillLoginFormIfPresent(account);

    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      const text = await getBodyText();
      return !currentUrl.includes('/login') || /đăng nhập thành công|dang nhap thanh cong|tài khoản|tai khoan|smember/i.test(text);
    }, DEFAULT_TIMEOUT).catch(() => {});

    if ((await driver.getAllWindowHandles()).length > 1) {
      await driver.close();
      await driver.switchTo().window(handlesBefore[0]);
    }

    await goToCartFromHomeDirect();
  }

  async function goToCartFromHomeDirect() {
    await driver.get(BASE_URL);
    await waitUntilReady();
    await hideCookieConsentIfPresent(driver);
    await clickCartButtonDirect();
    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      const text = await getBodyText();
      return /\/cart/i.test(currentUrl)
        || /giỏ hàng của bạn|gio hang cua ban/i.test(text)
        || /vui lòng đăng nhập|vui long dang nhap|đăng nhập ngay|dang nhap ngay|đăng nhập tài khoản smember/i.test(text);
    }, DEFAULT_TIMEOUT);
    await waitUntilReady();
    await hideCookieConsentIfPresent(driver);
  }

  async function clickCartButtonDirect() {
    await driver.wait(async () => {
      const clicked = await driver.executeScript(() => {
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const searchInput = Array.from(document.querySelectorAll('input'))
          .find((input) => {
            const placeholder = input.getAttribute('placeholder') || '';
            return visible(input) && /bạn.*muốn.*mua|ban.*muon.*mua|cần.*tìm|can.*tim/i.test(placeholder);
          });
        const searchRect = searchInput?.getBoundingClientRect();
        const candidates = Array.from(document.querySelectorAll('a[href], button, [role="button"], div, span'))
          .map((element) => {
            const text = (element.innerText || element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
            const href = element.href || element.closest('a[href]')?.href || '';
            const className = element.getAttribute('class') || '';
            const label = `${text} ${href} ${className}`;
            const rect = element.getBoundingClientRect();
            const isRightOfSearch = !searchRect || rect.left >= searchRect.right - 20;
            const isHeaderArea = rect.top < 120;
            const isReasonableSize = rect.width > 20 && rect.width < 220 && rect.height > 20 && rect.height < 100;

            if (!visible(element) || !isRightOfSearch || !isHeaderArea || !isReasonableSize || !/giỏ\s*hàng|gio\s*hang|\/cart/i.test(label)) {
              return null;
            }

            return {
              element: element.closest('a[href], button, [role="button"]') || element,
              area: rect.width * rect.height,
              top: rect.top,
              right: rect.right
            };
          })
          .filter(Boolean)
          .sort((left, right) => left.top - right.top || right.right - left.right || left.area - right.area);
        const target = candidates[0]?.element;

        if (!target) {
          return false;
        }

        target.scrollIntoView({ block: 'center', inline: 'center' });
        target.click();
        return true;
      });

      return clicked;
    }, DEFAULT_TIMEOUT);
  }

  async function fillLoginFormIfPresent(account) {
    const identifierInput = await findOptionalVisibleElement(LOGIN_IDENTIFIER_INPUT, 8000);
    const passwordInput = await findOptionalVisibleElement(LOGIN_PASSWORD_INPUT, 8000);

    if (!identifierInput || !passwordInput) {
      return;
    }

    await identifierInput.clear();
    await identifierInput.sendKeys(account.identifier);
    await passwordInput.clear();
    await passwordInput.sendKeys(account.password);
    await clickVisibleText(['^đăng\\s+nhập$', '^dang\\s+nhap$', 'login'], 8000);
    await waitUntilReady();
  }

  async function findOptionalVisibleElement(cssSelector, timeout = 3000) {
    try {
      return await findVisibleElement(cssSelector, timeout);
    } catch {
      return null;
    }
  }

  async function closeModalIfPresent() {
    await driver.executeScript(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const controls = Array.from(document.querySelectorAll('button, [role="button"], span, i, svg'))
        .filter((element) => {
          const text = (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim();
          const className = element.getAttribute('class') || '';
          return visible(element) && (/^(x|×)$/i.test(text) || /close|modal.*close/i.test(className));
        });
      const target = controls[0]?.closest('button, [role="button"]') || controls[0];

      if (target) {
        target.click();
      }
    });
    await driver.sleep(500);
  }

  async function getCartState() {
    return driver.executeScript(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const readQuantity = (value) => {
        const text = `${value}`.replace(/\s+/g, ' ').trim();
        const controlMatch = text.match(/(?:-|−)\s*(\d{1,2})\s*(?:\+|＋)/);

        if (controlMatch) {
          return Number(controlMatch[1]);
        }

        const labelMatch = text.match(/(?:số lượng|so luong|quantity|SL)\D{0,20}(\d{1,2})/i);

        if (labelMatch) {
          return Number(labelMatch[1]);
        }

        const match = text.match(/\b([1-9]\d?)\b/);
        return match ? Number(match[1]) : null;
      };
      const text = document.body.innerText || '';
      const loginRequired = /vui lòng đăng nhập|vui long dang nhap|đăng nhập ngay|dang nhap ngay/i.test(text);
      const hasProduct = /(\d{1,3}(?:\.\d{3})+|\d{4,})\s*(?:đ|₫)/i.test(text)
        && !/giỏ hàng trống|gio hang trong|chưa có sản phẩm|chua co san pham/i.test(text);
      const readQuantityByPosition = () => {
        const textNodes = Array.from(document.querySelectorAll('button, [role="button"], span, div, p, strong, b'));
        const plusButtons = textNodes
          .filter((element) => visible(element) && /^(\+|＋)$/.test((element.innerText || element.textContent || '').trim()))
          .map((element) => {
            const plusRect = element.getBoundingClientRect();
            const numberElement = textNodes
              .map((candidate) => {
                const candidateText = (candidate.innerText || candidate.textContent || '').trim();

                if (!visible(candidate) || !/^[1-5]$/.test(candidateText)) {
                  return null;
                }

                const rect = candidate.getBoundingClientRect();
                const sameRow = Math.abs((rect.top + rect.height / 2) - (plusRect.top + plusRect.height / 2)) < 20;
                const leftOfPlus = rect.right <= plusRect.left + 6 && rect.right >= plusRect.left - 90;

                if (!sameRow || !leftOfPlus) {
                  return null;
                }

                return {
                  value: Number(candidateText),
                  distance: Math.abs(plusRect.left - rect.right)
                };
              })
              .filter(Boolean)
              .sort((left, right) => left.distance - right.distance)[0];

            if (!numberElement) {
              return null;
            }

            return {
              value: numberElement.value,
              top: plusRect.top
            };
          })
          .filter(Boolean)
          .sort((left, right) => left.top - right.top);

        return plusButtons[0]?.value || null;
      };
      const positionedQuantity = readQuantityByPosition();

      if (positionedQuantity !== null) {
        return { hasProduct, loginRequired, quantity: positionedQuantity, text };
      }
      const inputs = Array.from(document.querySelectorAll('input[type="number"], input[class*="quantity"], input[name*="quantity"]'))
        .filter(visible)
        .map((input) => Number(input.value))
        .filter((value) => Number.isFinite(value) && value > 0);

      if (inputs.length > 0) {
        return { hasProduct, loginRequired, quantity: inputs[0], text };
      }

      const plusControls = Array.from(document.querySelectorAll('button, [role="button"], span, div'))
        .filter((element) => {
          const controlText = (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim();
          const className = element.getAttribute('class') || '';
          return visible(element) && (/^(\+|＋)$/.test(controlText) || /plus|increase|increment|quantity-plus/i.test(className));
        });
      const quantityControls = [];

      for (const plusControl of plusControls) {
        let container = plusControl.parentElement;

        for (let depth = 0; container && depth < 5; depth += 1, container = container.parentElement) {
          const containerText = (container.innerText || container.textContent || '').replace(/\s+/g, ' ').trim();

          if (containerText.length <= 80 && /(\+|＋)/.test(containerText) && /(-|−)/.test(containerText)) {
            const value = readQuantity(containerText);

            if (value !== null) {
              quantityControls.push({
                value,
                top: container.getBoundingClientRect().top
              });
              break;
            }
          }
        }
      }

      if (quantityControls.length > 0) {
        quantityControls.sort((left, right) => left.top - right.top);
        return { hasProduct, loginRequired, quantity: quantityControls[0].value, text };
      }

      const quantity = readQuantity(text);

      return { hasProduct, loginRequired, quantity, text };
    });
  }

  async function increaseQuantityByOneDirect() {
    const plusButton = await driver.executeScript(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const candidates = Array.from(document.querySelectorAll('button, [role="button"], span, div, svg, i'))
        .map((element) => {
          if (!visible(element)) {
            return null;
          }

          const text = (element.innerText || element.textContent || element.getAttribute('aria-label') || '').trim();
          const className = element.getAttribute('class') || '';
          const label = `${text} ${className}`;

          if (!(/^(\+|＋)$/.test(text) || /plus|increase|increment|tăng|them|add|quantity-plus/i.test(label))) {
            return null;
          }

          const rect = element.getBoundingClientRect();

          if (/^(\+|＋)$/.test(text)) {
            return {
              element,
              top: rect.top,
              right: rect.right,
              text
            };
          }

          let container = element.parentElement;

          for (let depth = 0; container && depth < 5; depth += 1, container = container.parentElement) {
            const containerText = (container.innerText || container.textContent || '').replace(/\s+/g, ' ').trim();

            if (/(?:-|−)\s*\d{1,2}\s*(?:\+|＋)/.test(containerText)) {
              return {
                element,
                top: rect.top,
                right: rect.right,
                text: containerText
              };
            }
          }

          return null;
        })
        .filter(Boolean)
        .sort((left, right) => left.top - right.top || right.right - left.right);
      const targetElement = candidates[0]?.element;
      const target = targetElement?.closest('button, [role="button"]') || targetElement;

      if (!target) {
        return null;
      }

      target.scrollIntoView({ block: 'center', inline: 'center' });
      return target;
    });

    if (!plusButton) {
      throw new Error('Không tìm thấy nút + để cộng thêm 1 sản phẩm trong giỏ');
    }

    await driver.actions({ async: true }).move({ origin: plusButton }).click().perform();
    await driver.sleep(1000);
    await closeModalIfPresent();
  }
});
