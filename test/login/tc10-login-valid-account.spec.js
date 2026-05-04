import { expect } from 'chai';
import { takeScreenshot } from '../../src/utils/screenshot.js';
import { getPersonalAccount } from '../../src/utils/testData.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC10 - Dang nhap tai khoan hop le', function () {
  const context = useCellphonesTestContext();

  it('TC10 - Dang nhap bang tai khoan hop le chuyen khoi man hinh login', async function () {
    // Functional test: dung tai khoan local/env de demo login that, khong commit credentials len source.
    const account = getPersonalAccount();

    if (!account.phone || !account.password) {
      this.skip();
    }

    await context.loginPage.open();
    await context.loginPage.submit(account.phone, account.password);
    await context.loginPage.waitUntilLoggedIn();
    await takeScreenshot(context.driver, 'TC10-login-valid-account');

    const currentUrl = await context.driver.getCurrentUrl();
    const text = await context.loginPage.getText();

    expect(currentUrl).to.not.include('/login');
    expect(text).to.not.match(/Đăng nhập SMEMBER/i);
  });
});
