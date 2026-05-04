import { expect } from 'chai';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC02 - Tim kiem keyword hop le', function () {
  const context = useCellphonesTestContext();

  it('TC02 - Tim kiem keyword hop le tra ve danh sach san pham', async function () {
    // Equivalence Partitioning: keyword hop le, pho bien tren website thuong mai dien tu.
    await context.homePage.open();
    await context.homePage.dismissCookieBannerIfPresent();
    await context.homePage.search('iphone 15');
    await takeScreenshot(context.driver, 'TC02-search-valid-keyword');

    const title = await context.searchResultsPage.getTitle();
    const text = await context.searchResultsPage.getText();
    const foundCount = await context.searchResultsPage.getFoundProductCount();

    expect(title.toLowerCase()).to.include('iphone 15');
    expect(text.toLowerCase()).to.include('iphone 15');
    expect(foundCount).to.be.a('number').and.greaterThan(0);
  });
});
