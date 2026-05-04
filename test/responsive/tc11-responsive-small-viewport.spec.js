import { expect } from 'chai';
import { takeScreenshot } from '../../src/utils/screenshot.js';
import { hideCookieConsentIfPresent } from '../../src/utils/overlays.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

const SMALL_VIEWPORT = {
  width: Number(process.env.RESPONSIVE_WIDTH || 200),
  height: Number(process.env.RESPONSIVE_HEIGHT || 800)
};

async function setSmallViewport(driver) {
  if (typeof driver.sendDevToolsCommand === 'function') {
    await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', {
      width: SMALL_VIEWPORT.width,
      height: SMALL_VIEWPORT.height,
      deviceScaleFactor: 1,
      mobile: false
    });
    return;
  }

  await driver.manage().window().setRect(SMALL_VIEWPORT);
}

async function getResponsiveLayoutInfo(driver) {
  return driver.executeScript(() => {
    const overflowTolerance = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const bodyScrollWidth = document.body.scrollWidth;
    const documentScrollWidth = document.documentElement.scrollWidth;
    const elements = Array.from(document.querySelectorAll('body *'));

    function isVisible(el, rect) {
      const style = window.getComputedStyle(el);

      return rect.width > 1
        && rect.height > 1
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0;
    }

    function hasAnimatedAncestor(el) {
      let current = el;

      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);

        if (style.animationName !== 'none' || style.transitionDuration !== '0s') {
          return true;
        }

        current = current.parentElement;
      }

      return false;
    }

    function isClippedByAncestor(el, rect) {
      let current = el.parentElement;

      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const hasHorizontalClipping = /hidden|auto|scroll|clip/i.test(style.overflowX);

        if (hasHorizontalClipping) {
          const parentRect = current.getBoundingClientRect();

          if (rect.left < parentRect.left || rect.right > parentRect.right) {
            return true;
          }
        }

        current = current.parentElement;
      }

      return false;
    }

    const overflowingElements = elements
      .map((el) => {
        const rect = el.getBoundingClientRect();

        return {
          tag: el.tagName,
          className: typeof el.className === 'string' ? el.className : '',
          id: el.id || '',
          text: el.innerText ? el.innerText.trim().replace(/\s+/g, ' ').slice(0, 80) : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          isAnimated: hasAnimatedAncestor(el),
          isClipped: isClippedByAncestor(el, rect)
        };
      })
      .filter((item) => {
        return item.width > 1
          && item.height > 1
          && !item.isAnimated
          && !item.isClipped
          && item.bottom > 0
          && item.top < viewportHeight
          && (item.left < -overflowTolerance || item.right > viewportWidth + overflowTolerance);
      })
      .map(({ isAnimated, isClipped, ...item }) => item)
      .slice(0, 20);

    const headerControls = Array.from(
      document.querySelectorAll('header a, header button, header input, nav a, nav button, nav input')
    )
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return isVisible(el, rect) && rect.bottom > 0 && rect.top < viewportHeight;
      });

    const overlappingPairs = [];

    for (let i = 0; i < headerControls.length; i += 1) {
      for (let j = i + 1; j < headerControls.length; j += 1) {
        const first = headerControls[i];
        const second = headerControls[j];

        if (first.contains(second) || second.contains(first)) {
          continue;
        }

        const a = first.getBoundingClientRect();
        const b = second.getBoundingClientRect();
        const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

        if (overlapWidth > 2 && overlapHeight > 2) {
          overlappingPairs.push({
            elementA: {
              tag: first.tagName,
              className: typeof first.className === 'string' ? first.className : '',
              text: first.innerText ? first.innerText.trim().replace(/\s+/g, ' ').slice(0, 50) : ''
            },
            elementB: {
              tag: second.tagName,
              className: typeof second.className === 'string' ? second.className : '',
              text: second.innerText ? second.innerText.trim().replace(/\s+/g, ' ').slice(0, 50) : ''
            },
            overlapWidth: Math.round(overlapWidth),
            overlapHeight: Math.round(overlapHeight)
          });
        }
      }
    }

    return {
      viewportWidth,
      viewportHeight,
      bodyScrollWidth,
      documentScrollWidth,
      overflowingElements,
      overlappingPairs: overlappingPairs.slice(0, 20)
    };
  });
}

describe('TC11 - Responsive layout viewport nho', function () {
  const context = useCellphonesTestContext();

  it('TC11 - Responsive layout khong duoc tran ngang hoac chong lan o viewport nho', async function () {
    // Responsive Layout Bug: viewport cuc nho dung de phat hien horizontal overflow va UI overlap.
    await setSmallViewport(context.driver);
    await context.homePage.open();
    await hideCookieConsentIfPresent(context.driver);
    await context.driver.sleep(3000);
    await hideCookieConsentIfPresent(context.driver);
    await takeScreenshot(
      context.driver,
      `TC11-responsive-small-viewport-${SMALL_VIEWPORT.width}x${SMALL_VIEWPORT.height}`
    );

    const layoutInfo = await getResponsiveLayoutInfo(context.driver);

    expect(layoutInfo.viewportWidth).to.equal(SMALL_VIEWPORT.width);
    expect(layoutInfo.bodyScrollWidth, JSON.stringify(layoutInfo, null, 2))
      .to.be.at.most(layoutInfo.viewportWidth);
    expect(layoutInfo.documentScrollWidth, JSON.stringify(layoutInfo, null, 2))
      .to.be.at.most(layoutInfo.viewportWidth);
    expect(layoutInfo.overflowingElements, JSON.stringify(layoutInfo.overflowingElements, null, 2))
      .to.be.empty;
    expect(layoutInfo.overlappingPairs, JSON.stringify(layoutInfo.overlappingPairs, null, 2))
      .to.be.empty;
  });
});
