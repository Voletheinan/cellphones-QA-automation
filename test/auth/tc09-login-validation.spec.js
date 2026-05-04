import { expect } from 'chai';
import { takeScreenshot } from '../../src/utils/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC09 - Dang nhap validation', function () {
  const context = useCellphonesTestContext();

  it('TC09 - Dang nhap voi so dien thoai khong hop le phai hien thi validation', async function () {
    // Boundary Value Analysis: so dien thoai ngan hon do dai hop le cua form dang nhap.
    await context.loginPage.open();
    await context.loginPage.submit('12345', 'Aaaaa12345');
    await takeScreenshot(context.driver, 'TC09-login-invalid-phone');

    const currentUrl = await context.driver.getCurrentUrl();
    const validationText = await context.loginPage.getValidationText();

    expect(currentUrl).to.include('/login');
    expect(validationText).to.match(/vui lòng|không hợp lệ|không đúng|không tồn tại|thất bại|bắt buộc/i);
  });
});
