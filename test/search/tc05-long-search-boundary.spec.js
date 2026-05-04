import { expect } from 'chai';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC05 - Boundary search 256 ky tu', function () {
  const context = useCellphonesTestContext();

  it('TC05 - Boundary search 256 ky tu khong duoc tra ve trang bao tri', async function () {
    // Boundary Value Analysis: keyword dai bat thuong nhung khong doc hai.
    const longKeyword = 'a'.repeat(256);

    await context.searchResultsPage.openWithQuery(longKeyword);
    await takeScreenshot(context.driver, 'TC05-long-search-256-characters');

    const isBlockedOrMaintenance = await context.searchResultsPage.hasServerOrBlockPage();
    const foundCount = await context.searchResultsPage.getFoundProductCount();

    expect(isBlockedOrMaintenance).to.equal(false);
    expect(foundCount).to.equal(0);
  });
});
