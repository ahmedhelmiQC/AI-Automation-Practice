import { expect, test, type Shop } from '../fixtures/test';

const signIn = async (shop: Shop): Promise<void> => {
  await shop.login.open();
  await shop.login.login(shop.credentials.email, shop.credentials.password);
};

const addBothProducts = async (shop: Shop): Promise<void> => {
  await shop.dashboard.addToCart(shop.data.products.first);
  await shop.dashboard.addToCart(shop.data.products.second);
};

const reachCheckout = async (shop: Shop, productName: string): Promise<void> => {
  await shop.dashboard.addToCart(productName);
  await shop.cart.open();
  await shop.cart.checkout();
  await shop.checkout.expectLoaded();
};

test.describe('shop scenarios', { tag: ['@smoke', '@valid'] }, () => {
  test.beforeEach(async ({ shop }) => {
    await signIn(shop);
  });

  test('sign in opens the dashboard', { tag: ['@login', '@dashboard'] }, async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('dashboard shows the catalog products', { tag: '@dashboard' }, async ({ shop }) => {
    await shop.dashboard.expectProducts(shop.data.products.visible);
  });

  test('adding the first product increases the cart by 1', { tag: '@dashboard' }, async ({ shop }) => {
    const countBefore = await shop.dashboard.cartCount();
    await shop.dashboard.addToCart(shop.data.products.first);
    await expect.poll(() => shop.dashboard.cartCount()).toBe(countBefore + 1);
  });

  test('the cart lists the first product', { tag: '@cart' }, async ({ shop }) => {
    await shop.dashboard.addToCart(shop.data.products.first);
    await shop.cart.open();
    await shop.cart.expectProduct(shop.data.products.first);
  });

  test('checkout opens from the cart', { tag: '@checkout' }, async ({ shop }) => {
    await reachCheckout(shop, shop.data.products.first);
  });

  test('adding a second product updates the cart count', { tag: '@dashboard' }, async ({ shop }) => {
    await shop.dashboard.addToCart(shop.data.products.first);
    const countAfterFirst = await shop.dashboard.cartCount();
    await shop.cart.open();
    await shop.cart.checkout();
    await shop.checkout.expectLoaded();

    await shop.dashboard.open();
    await shop.dashboard.addToCart(shop.data.products.second);
    await expect.poll(() => shop.dashboard.cartCount()).toBe(countAfterFirst + 1);
  });

  test('cart total equals the sum of the product prices', { tag: '@cart' }, async ({ shop }) => {
    await addBothProducts(shop);
    await shop.cart.open();
    await shop.cart.expectTotalMatchesLinePrices();
  });

  test('every cart product is in stock', { tag: '@cart' }, async ({ shop }) => {
    await addBothProducts(shop);
    await shop.cart.open();
    await shop.cart.expectProduct(shop.data.products.first);
    await shop.cart.expectProduct(shop.data.products.second);
    await shop.cart.expectAllInStock();
  });

  test('checkout accepts France', { tag: '@checkout' }, async ({ shop }) => {
    await reachCheckout(shop, shop.data.products.first);
    await shop.checkout.expectPaymentDefaults(shop.credentials.email);
    await shop.checkout.fillPayment(shop.data.payment.cvv, shop.data.payment.nameOnCard);
    await shop.checkout.selectCountry(shop.data.payment.country);
  });

  test('place order shows the confirmation', { tag: '@confirmation' }, async ({ shop }) => {
    await reachCheckout(shop, shop.data.products.first);
    await shop.checkout.fillPayment(shop.data.payment.cvv, shop.data.payment.nameOnCard);
    await shop.checkout.selectCountry(shop.data.payment.country);
    await shop.checkout.placeOrder();
    await shop.confirmation.expectOrderPlaced();
  });
});

test.describe('shop end to end', { tag: ['@regression', '@valid'] }, () => {
  test.beforeEach(async ({ shop }) => {
    await signIn(shop);
  });

  test(
    'place an order for two products',
    { tag: ['@dashboard', '@cart', '@checkout', '@confirmation'] },
    async ({ shop }) => {
      await shop.dashboard.expectProducts(shop.data.products.visible);

      await shop.dashboard.addToCart(shop.data.products.first);
      const countAfterFirst = await shop.dashboard.cartCount();

      await shop.cart.open();
      await shop.cart.expectProduct(shop.data.products.first);

      await shop.cart.checkout();
      await shop.checkout.expectLoaded();

      await shop.dashboard.open();
      await shop.dashboard.addToCart(shop.data.products.second);
      await expect.poll(() => shop.dashboard.cartCount()).toBe(countAfterFirst + 1);

      await shop.cart.open();
      await shop.cart.expectProduct(shop.data.products.second);
      await shop.cart.expectTotalMatchesLinePrices();
      await shop.cart.expectAllInStock();

      await shop.cart.checkout();
      await shop.checkout.expectLoaded();
      await shop.checkout.expectPaymentDefaults(shop.credentials.email);
      await shop.checkout.fillPayment(shop.data.payment.cvv, shop.data.payment.nameOnCard);
      await shop.checkout.selectCountry(shop.data.payment.country);
      await shop.checkout.placeOrder();

      await shop.confirmation.expectOrderPlaced();
    },
  );
});

test.describe('invalid scenarios', { tag: '@invalid' }, () => {
  test('login with an invalid email', { tag: '@login' }, async ({ shop }) => {
    await shop.login.open();
    await shop.login.login(shop.data.invalidEmail, shop.credentials.password);
    await shop.login.expectRejected();
  });

  test('adding an exited product leaves the cart unchanged', { tag: '@dashboard' }, async ({ shop }) => {
    await signIn(shop);
    const countBefore = await shop.dashboard.cartCount();
    await shop.dashboard.expectProductAbsent(shop.data.products.missing);
    expect(await shop.dashboard.cartCount()).toBe(countBefore);
  });
});
