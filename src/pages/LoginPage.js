import { By, until } from 'selenium-webdriver';
import { DEFAULT_TIMEOUT, SMEMBER_URL } from '../config/environment.js';
import { getBodyText, safeClick, waitForVisible } from '../support/waits.js';

export class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.phoneInput = By.css('input[placeholder="Nhập số điện thoại của bạn"], input[maxlength="10"]');
    this.passwordInput = By.css('input[placeholder="Nhập mật khẩu của bạn"], input[type="password"]');
    this.submitButton = By.xpath("//form//button[normalize-space(.)='Đăng nhập']");
  }

  async open() {
    await this.driver.get(`${SMEMBER_URL}/login`);
    await this.driver.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
    await this.ensureFormVisible();
  }

  async ensureFormVisible() {
    const phoneInputs = await this.driver.findElements(this.phoneInput);

    for (const input of phoneInputs) {
      if (await input.isDisplayed().catch(() => false)) {
        return true;
      }
    }

    const mobileLoginButtons = await this.driver.findElements(
      By.xpath("//button[normalize-space(.)='Đăng nhập' and @aria-haspopup='dialog']")
    );

    for (const button of mobileLoginButtons) {
      if (await button.isDisplayed().catch(() => false)) {
        await safeClick(this.driver, button);
        break;
      }
    }

    await waitForVisible(this.driver, this.phoneInput);
    return true;
  }

  async submit(phone, password) {
    await this.ensureFormVisible();

    const phoneElement = await waitForVisible(this.driver, this.phoneInput);
    const passwordElement = await waitForVisible(this.driver, this.passwordInput);
    const submitElement = await waitForVisible(this.driver, this.submitButton);

    await phoneElement.clear();
    await phoneElement.sendKeys(phone);
    await passwordElement.clear();
    await passwordElement.sendKeys(password);
    await safeClick(this.driver, submitElement);
  }

  async getText() {
    return getBodyText(this.driver);
  }

  async getValidationText() {
    const text = await this.getText();

    return text
      .split('\n')
      .filter((line) => /vui lòng|không hợp lệ|không đúng|không tồn tại|thất bại|bắt buộc/i.test(line))
      .join('\n');
  }

  async isLoginFormVisible() {
    const phoneInputs = await this.driver.findElements(this.phoneInput);
    const passwordInputs = await this.driver.findElements(this.passwordInput);

    let phoneIsVisible = false;
    let passwordIsVisible = false;

    for (const input of phoneInputs) {
      if (await input.isDisplayed().catch(() => false)) {
        phoneIsVisible = true;
        break;
      }
    }

    for (const input of passwordInputs) {
      if (await input.isDisplayed().catch(() => false)) {
        passwordIsVisible = true;
        break;
      }
    }

    return phoneIsVisible && passwordIsVisible;
  }

  async waitUntilLoggedIn() {
    await this.driver.wait(async () => {
      const currentUrl = await this.driver.getCurrentUrl();
      const text = await this.getText();

      return !currentUrl.includes('/login') && !/Đăng nhập SMEMBER/i.test(text);
    }, DEFAULT_TIMEOUT);
  }
}
