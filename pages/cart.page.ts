import { expect, type Page } from '@playwright/test';
import { parseMoney } from '../utils/money';

export class CartPage {
  constructor(private readonly page: Page) {}

  private items() {
    return this.page.locator('div.cart li').filter({ has: this.page.locator('h3') });
  }

  async open(): Promise<void> {
    await this.page.locator("[routerlink*='cart']").click();
    await expect(this.page.getByRole('heading', { name: 'My Cart' })).toBeVisible();
    await expect(this.items().first()).toBeVisible();
  }

  async expectProduct(productName: string): Promise<void> {
    await expect(this.items().getByRole('heading', { name: productName, exact: true })).toBeVisible();
  }

  async expectTotalMatchesLinePrices(): Promise<void> {
    const priceTexts = await this.items().locator('.prodTotal p').allTextContents();
    const lineTotal = priceTexts.map((text) => parseMoney(text)).reduce((sum, amount) => sum + amount, 0);
    const totalText = await this.page
      .locator('li.totalRow')
      .filter({ hasText: /^\s*Total\b/ })
      .locator('.value')
      .innerText();
    expect(parseMoney(totalText)).toBe(lineTotal);
  }

  async expectAllInStock(): Promise<void> {
    const count = await this.items().count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(this.items().nth(index)).toContainText('In Stock');
    }
  }

  async checkout(): Promise<void> {
    await this.page.getByRole('button', { name: 'Checkout' }).click();
  }
}
