import { expect, type Page } from '@playwright/test';

export class ConfirmationPage {
  constructor(private readonly page: Page) {}

  async expectOrderPlaced(): Promise<void> {
    await expect(this.page.locator('.hero-primary')).toContainText(/thankyou for the order/i);
    const orderIds = this.page.locator('.em-spacer-1 label.ng-star-inserted');
    await expect(orderIds.first()).toBeVisible();
    const count = await orderIds.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(orderIds.nth(index)).toContainText(/\|\s*[a-f0-9]{10,}\s*\|/i);
    }
  }
}
