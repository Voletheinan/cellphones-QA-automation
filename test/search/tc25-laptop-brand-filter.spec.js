import { expect } from 'chai';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC25 - Loc laptop theo thuong hieu', function () {
  const context = useCellphonesTestContext();

  it('TC25 - Loc laptop Apple phai hien thi danh sach san pham', async function () {
    await context.searchResultsPage.openLaptopCategory();
    await context.homePage.dismissCookieBannerIfPresent();
    await context.searchResultsPage.applyBrandFilter('Apple');
    await context.searchResultsPage.loadAllVisibleProducts();
    await takeScreenshot(context.driver, 'TC25-laptop-brand-filter');

    const productCount = await context.searchResultsPage.getProductCardCount();

    expect(productCount).to.be.greaterThan(0);
  });
});
