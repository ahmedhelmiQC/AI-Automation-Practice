import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  private card(productName: string): Locator {
    return this.page.locator('.card-body').filter({
      has: this.page.getByRole('heading', { name: productName, exact: true }),
    });
  }

  async open(): Promise<void> {
    const home = this.page.getByRole('button', { name: 'HOME' });
    // The checkout form sits on top of the header, so a pointer click never reaches HOME.
    await home.evaluate((button: HTMLButtonElement) => button.click());
    await expect(this.page.locator('.card-body b').first()).toBeVisible();
  }

  async expectProductAbsent(productName: string): Promise<void> {
    await expect(this.card(productName)).toHaveCount(0);
  }

  async expectProducts(names: string[]): Promise<void> {
    for (const name of names) {
      await expect(this.page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
  }

  async cartCount(): Promise<number> {
    const text = (await this.page.locator("[routerlink*='cart'] label").textContent())?.trim() ?? '';
    return text === '' ? 0 : Number(text);
  }

  async addToCart(productName: string): Promise<void> {
    await this.card(productName).getByRole('button', { name: 'Add To Cart' }).click();
    const toast = this.page.locator('#toast-container');
    await expect(toast).toContainText('Product Added To Cart');
    await expect(toast).toBeHidden();
  }
}
