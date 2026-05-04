import { until } from 'selenium-webdriver';
import { DEFAULT_TIMEOUT } from '../config/environment.js';

export async function waitForVisible(driver, locator, timeout = DEFAULT_TIMEOUT) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

export async function safeClick(driver, element) {
  await driver.executeScript(
    'arguments[0].scrollIntoView({ block: "center", inline: "center" });',
    element
  );
  await driver.executeScript('arguments[0].click();', element);
}

export async function getBodyText(driver) {
  const body = await waitForVisible(driver, { css: 'body' });
  return body.getText();
}
