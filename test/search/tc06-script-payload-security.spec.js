import { expect } from 'chai';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC06 - Security input script', function () {
  const context = useCellphonesTestContext();

  it('TC06 - Security input script khong duoc gay loi 403 va khong duoc execute alert', async function () {
    // Security negative test: chi gui payload vao chuc nang search, khong khai thac hay bypass he thong.
    const payload = '<script>alert("qa")</script>';

    await context.searchResultsPage.openWithQuery(payload);
    await takeScreenshot(context.driver, 'TC06-script-payload-search');

    const isBlockedOrMaintenance = await context.searchResultsPage.hasServerOrBlockPage();
    const pageSource = await context.driver.getPageSource();
    let alertWasShown = false;

    try {
      const alert = await context.driver.switchTo().alert();
      alertWasShown = true;
      await alert.dismiss();
    } catch {
      alertWasShown = false;
    }

    expect(alertWasShown).to.equal(false);
    expect(isBlockedOrMaintenance).to.equal(false);
    expect(pageSource).to.not.include(payload);
  });
});
