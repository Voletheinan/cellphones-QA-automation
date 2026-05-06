import { By } from 'selenium-webdriver';
import { DEFAULT_TIMEOUT } from '../config/environment.js';

export async function waitUntilReady(driver) {
  await driver.wait(async () => {
    const readyState = await driver.executeScript('return document.readyState;');
    return readyState === 'complete' || readyState === 'interactive';
  }, DEFAULT_TIMEOUT);
}

export async function findVisibleElement(driver, cssSelector) {
  await driver.wait(async () => {
    const elements = await driver.findElements(By.css(cssSelector));

    for (const element of elements) {
      if (await element.isDisplayed().catch(() => false)) {
        return true;
      }
    }

    return false;
  }, DEFAULT_TIMEOUT);

  const elements = await driver.findElements(By.css(cssSelector));

  for (const element of elements) {
    if (await element.isDisplayed().catch(() => false)) {
      return element;
    }
  }

  throw new Error(`Không tìm thấy element visible: ${cssSelector}`);
}

export async function clickVisibleText(driver, textPatterns) {
  await driver.wait(async () => driver.executeScript((patterns) => {
    const regexes = patterns.map((pattern) => new RegExp(pattern, 'i'));
    const target = Array.from(document.querySelectorAll('button, a, [role="button"], label, div, span, li')).find((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();

      return text
        && rect.width > 0
        && rect.height > 0
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && regexes.some((regex) => regex.test(text));
    });

    if (!target) {
      return false;
    }

    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  }, textPatterns), DEFAULT_TIMEOUT);
}

export async function clickBestMatch(driver, options) {
  await driver.wait(async () => driver.executeScript((config) => {
    const normalizeText = (value) => {
      let text = `${value}`.replace(/\s+/g, ' ').trim().toLowerCase();

      if (config.normalizeVietnamese) {
        text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }

      return text;
    };
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const textRegex = config.text ? new RegExp(config.text, 'i') : null;
    const hrefRegex = config.href ? new RegExp(config.href, 'i') : null;
    const candidates = Array.from(document.querySelectorAll(config.selector))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalizeText(element.innerText || element.textContent || '');
        const href = element.href || element.closest('a[href]')?.href || '';
        const inBrandArea = rect.top > 260 && rect.top < 620 && rect.left < window.innerWidth * 0.85;
        const textMatches = textRegex ? textRegex.test(text) : false;
        const hrefMatches = hrefRegex ? hrefRegex.test(href) : false;

        if (!visible(element) || (!textMatches && !hrefMatches)) {
          return null;
        }

        if (config.requiredClass && !element.classList.contains(config.requiredClass)) {
          return null;
        }

        if (config.area === 'brand' && !inBrandArea) {
          return null;
        }

        return {
          element: element.closest('a[href], button, [role="button"], label') || element,
          area: rect.width * rect.height,
          top: rect.top
        };
      })
      .filter(Boolean)
      .sort((left, right) => {
        if (config.sortBy === 'smallest') {
          return left.area - right.area || left.top - right.top;
        }

        return left.top - right.top || left.area - right.area;
      });
    const target = candidates[0]?.element;

    if (!target) {
      return false;
    }

    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  }, options), DEFAULT_TIMEOUT);
}
