import { By } from 'selenium-webdriver';

export async function hideCookieConsentIfPresent(driver) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const cookieButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Chấp nhận') or contains(., 'Đồng ý') or contains(., 'Accept') or contains(., 'OK')]")
    );

    for (const button of cookieButtons) {
      if (await button.isDisplayed().catch(() => false)) {
        await driver.executeScript('arguments[0].click();', button);
        await driver.sleep(300);
        break;
      }
    }

    await driver.executeScript(() => {
      const cookiePattern = /cookie|cookies|chấp nhận|đồng ý|accept|quyền riêng tư|privacy|tải app|tai app|liên hệ|lien he|hotline|chat|zalo/i;
      const elements = Array.from(document.querySelectorAll('body *'));

      elements.forEach((el) => {
        const text = el.innerText || '';
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const isOverlay = style.position === 'fixed'
          || style.position === 'sticky'
          || Number(style.zIndex) > 10;
        const isVisible = rect.width > 0
          && rect.height > 0
          && style.display !== 'none'
          && style.visibility !== 'hidden';

        if (isVisible && isOverlay && cookiePattern.test(text)) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      });

      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const isBottomFloating = style.position === 'fixed'
          && rect.bottom > window.innerHeight - 220
          && rect.height < 220
          && rect.width < window.innerWidth;

        if (isBottomFloating) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      });
    });

    await driver.sleep(300);
  }
}
