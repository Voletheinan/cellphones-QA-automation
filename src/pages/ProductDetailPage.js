import { By, until } from 'selenium-webdriver';
import { DEFAULT_TIMEOUT } from '../config.js';
import { safeClick, waitForVisible } from '../utils/waits.js';

export class ProductDetailPage {
  constructor(driver) {
    this.driver = driver;
    this.title = By.css('.box-product-name h1');
    this.salePrice = By.css('.sale-price');
    this.storageVariants = By.css('.list-linked a:not(.active)');
    this.specContainer = By.css('#thong-so-ky-thuat');
    this.specRows = By.css('table.technical-content tr');
    this.colorVariantItems = By.css('ul.list-variants > li');
  }

  async waitUntilLoaded() {
    await waitForVisible(this.driver, this.title);
  }

  async getTitle() {
    const title = await waitForVisible(this.driver, this.title);
    return title.getText();
  }

  async getSalePrice() {
    const price = await waitForVisible(this.driver, this.salePrice);
    return (await price.getText()).trim();
  }

  async chooseFirstInactiveStorageVariant() {
    const variants = await this.driver.findElements(this.storageVariants);

    if (variants.length === 0) {
      return false;
    }

    await safeClick(this.driver, variants[0]);
    await this.driver.wait(async () => {
      const readyState = await this.driver.executeScript('return document.readyState;');
      return readyState === 'complete';
    }, DEFAULT_TIMEOUT);
    await this.driver.sleep(1500);
    return true;
  }

  async getSpecificationRowCount() {
    await waitForVisible(this.driver, this.specContainer);
    const rows = await this.driver.findElements(this.specRows);
    return rows.length;
  }

  async verifyColorVariantsHaveMatchingImages() {
    const variantContainer = await waitForVisible(this.driver, By.css('ul.list-variants'));
    await this.driver.executeScript('arguments[0].scrollIntoView({ block: "center" });', variantContainer);

    const totalVariants = (await this.driver.findElements(this.colorVariantItems)).length;
    let selectedVariants = 0;

    for (let index = 0; index < totalVariants; index += 1) {
      const variants = await this.driver.findElements(this.colorVariantItems);
      const variant = variants[index];
      const colorName = (await variant.findElement(By.css('strong.item-variant-name')).getText()).trim();

      await safeClick(this.driver, variant);
      await this.driver.sleep(1500);

      const selectedText = await this.driver.executeScript(() => document.body.innerText || '');
      const galleryImages = await this.driver.findElements(By.css('.box-gallery img'));
      const hasVisibleGalleryImage = await Promise.any(
        galleryImages.map((image) => image.isDisplayed().catch(() => false))
      ).catch(() => false);
      const selectionIsReflected = selectedText.toLowerCase().includes(colorName.toLowerCase());

      if (!selectionIsReflected || !hasVisibleGalleryImage) {
        return false;
      }

      selectedVariants += 1;
    }

    return selectedVariants > 0 && selectedVariants === totalVariants;
  }

  async waitForUrlChangedFrom(previousUrl) {
    await this.driver.wait(until.urlIs(previousUrl), 1000).catch(() => {});
    await this.driver.wait(async () => {
      const currentUrl = await this.driver.getCurrentUrl();
      return currentUrl !== previousUrl;
    }, DEFAULT_TIMEOUT);
  }
}
