import { By } from 'selenium-webdriver';
import { getBodyText, safeClick, waitForVisible } from '../support/waits.js';

export class NewsletterSection {
  constructor(driver) {
    this.driver = driver;
    this.emailInput = By.css('input[placeholder="Nhập email của bạn"]');
    this.phoneInput = By.css('input[placeholder="Nhập số điện thoại của bạn"]');
    this.submitButton = By.xpath("//button[contains(., 'ĐĂNG KÝ NGAY')]");
  }

  async scrollToFooter() {
    await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
  }

  async submit(email, phone) {
    await this.scrollToFooter();

    const emailElement = await waitForVisible(this.driver, this.emailInput);
    const phoneElement = await waitForVisible(this.driver, this.phoneInput);
    const submitElement = await waitForVisible(this.driver, this.submitButton);

    await emailElement.clear();
    await emailElement.sendKeys(email);
    await phoneElement.clear();
    await phoneElement.sendKeys(phone);
    await safeClick(this.driver, submitElement);
  }

  async getValidationText() {
    return getBodyText(this.driver);
  }
}
