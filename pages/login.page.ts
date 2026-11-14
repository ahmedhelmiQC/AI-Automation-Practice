import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/client');
    await expect(this.page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.locator('#userEmail').fill(email);
    await this.page.locator('#userPassword').fill(password);
    await this.page.locator('#login').click();
  }

  async expectRejected(): Promise<void> {
    await expect(this.page.locator('#toast-container')).toContainText(/incorrect email or password/i);
    await expect(this.page).toHaveURL(/auth\/login/);
  }
}
