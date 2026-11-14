import fs from 'fs';
import path from 'path';
import { test as base } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { ConfirmationPage } from '../pages/confirmation.page';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';

export type ShopData = {
  products: {
    visible: string[];
    first: string;
    second: string;
    missing: string;
  };
  invalidEmail: string;
  payment: {
    cvv: string;
    nameOnCard: string;
    country: string;
  };
};

export type Shop = {
  login: LoginPage;
  dashboard: DashboardPage;
  cart: CartPage;
  checkout: CheckoutPage;
  confirmation: ConfirmationPage;
  data: ShopData;
  credentials: { email: string; password: string };
};

const readShopData = (): ShopData => {
  const filePath = path.resolve(__dirname, '../test-data.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ShopData;
};

const readCredentials = (): Shop['credentials'] => {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  if (!email || !password) {
    throw new Error('Set EMAIL and PASSWORD in .env before running the shop test.');
  }
  return { email, password };
};

export const test = base.extend<{ shop: Shop }>({
  shop: async ({ page }, use) => {
    await use({
      login: new LoginPage(page),
      dashboard: new DashboardPage(page),
      cart: new CartPage(page),
      checkout: new CheckoutPage(page),
      confirmation: new ConfirmationPage(page),
      data: readShopData(),
      credentials: readCredentials(),
    });
  },
});

export { expect } from '@playwright/test';
