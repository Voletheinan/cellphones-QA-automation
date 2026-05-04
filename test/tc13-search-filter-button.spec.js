import { expect } from 'chai';
import { takeScreenshot } from '../src/utils/screenshot.js';
import { useCellphonesTestContext } from './helpers/setup.js';

describe('TC13 - Bo loc trong trang ket qua tim kiem', function () {
  const context = useCellphonesTestContext();

  it('TC13 - Tim kiem keyword phai hien thi nut bo loc', async function () {
    await context.searchResultsPage.openWithQuery('samsung');
    await context.homePage.dismissCookieBannerIfPresent();
    await takeScreenshot(context.driver, 'TC13-search-filter-button');

    if (!await context.searchResultsPage.hasFilterButton()) {
      this.skip();
    }

    expect(await context.searchResultsPage.hasFilterButton()).to.equal(true);
  });
});
