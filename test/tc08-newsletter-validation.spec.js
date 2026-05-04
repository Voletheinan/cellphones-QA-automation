import { expect } from 'chai';
import { takeScreenshot } from '../src/utils/screenshot.js';
import { NewsletterSection } from '../src/pages/NewsletterSection.js';
import { useCellphonesTestContext } from './helpers/setup.js';

describe('TC08 - Newsletter validation', function () {
  const context = useCellphonesTestContext();

  it('TC08 - Newsletter validate email va so dien thoai khong hop le', async function () {
    // Boundary + Equivalence Partitioning: email sai dinh dang va so dien thoai thieu 1 chu so.
    const newsletter = new NewsletterSection(context.driver);

    await context.homePage.open();
    await context.homePage.dismissCookieBannerIfPresent();
    await newsletter.submit('abc@', '123456789');
    await takeScreenshot(context.driver, 'TC08-newsletter-invalid-inputs');

    const validationText = await newsletter.getValidationText();

    expect(validationText).to.include('Email không hợp lệ');
    expect(validationText).to.match(/Bạn chưa điền đúng số điện thoại/i);
  });
});
