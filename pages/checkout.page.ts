import { expect, type Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByText('Credit Card Number')).toBeVisible();
    await expect(this.page.getByPlaceholder('Select Country')).toBeVisible();
  }

  async expectPaymentDefaults(email: string): Promise<void> {
    await expect(this.page.locator('.form__cc input.txt').first()).not.toHaveValue('');
    await expect(this.page.locator('select.input.ddl').nth(0)).not.toHaveValue('');
    await expect(this.page.locator('select.input.ddl').nth(1)).not.toHaveValue('');
    const values = await this.page.locator('input.txt').evaluateAll(
      (inputs) => inputs.map((input) => (input as HTMLInputElement).value),
    );
    expect(values).toContain(email);
  }

  async fillPayment(cvv: string, nameOnCard: string): Promise<void> {
    await this.page.locator('.field').filter({ hasText: 'CVV Code' }).locator('input').fill(cvv);
    await this.page.locator('.field').filter({ hasText: 'Name on Card' }).locator('input').fill(nameOnCard);
  }

  async selectCountry(country: string): Promise<void> {
    const input = this.page.getByPlaceholder('Select Country');
    await input.click();
    await input.pressSequentially(country, { delay: 100 });
    const suggestion = this.page.getByRole('button', {
      name: new RegExp(`^\\W*${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    });
    await expect(suggestion).toBeVisible();
    await suggestion.click();
    await expect(input).toHaveValue(country);
  }

  async placeOrder(): Promise<void> {
    await this.page.getByText('Place Order', { exact: true }).click();
  }
}
