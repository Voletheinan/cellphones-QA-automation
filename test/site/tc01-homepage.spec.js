import { expect } from 'chai';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC01 - Trang chu CellphoneS', function () {
  const context = useCellphonesTestContext();

  it('TC01 - Trang chu load dung HTTPS va hien thi o tim kiem', async function () {
    // Equivalence Partitioning: luong hop le co ban cua nguoi dung truy cap trang chu.
    await context.homePage.open();
    await context.homePage.dismissCookieBannerIfPresent();
    await takeScreenshot(context.driver, 'TC01-homepage-loaded');

    const currentUrl = await context.driver.getCurrentUrl();
    const title = await context.driver.getTitle();
    const searchInput = await context.homePage.getSearchInput();

    expect(currentUrl).to.match(/^https:\/\/cellphones\.com\.vn\/?/);
    expect(title).to.include('CellphoneS');
    expect(await searchInput.isDisplayed()).to.equal(true);
  });
});
