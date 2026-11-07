// "Remove ads" one-time purchase using cordova-plugin-purchase (CdvPurchase). Load as a normal script after the game.
// Create an in-app product (Managed product, NOT subscription) in Play Console with the id: remove_ads
// NOTE: not run against Play Billing. Test with a license-tester account.
(function () {
  const C = window.Capacitor; if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  document.addEventListener('deviceready', async () => {
    const { store, Platform, ProductType } = window.CdvPurchase || {}; if (!store) return;
    store.register([{ id: 'remove_ads', type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY }]);
    store.when().approved((t) => t.verify()).verified((r) => r.finish());
    await store.initialize([Platform.GOOGLE_PLAY]);
    window.FREEPATH_IAP_OWNED = async (id) => store.owned(id);
    window.FREEPATH_IAP_BUY = async (id) => {
      const offer = store.get(id) && store.get(id).getOffer(); if (!offer) return false;
      const err = await offer.order(); if (err) return false;
      return new Promise((res) => { const t = setInterval(() => { if (store.owned(id)) { clearInterval(t); res(true); } }, 500); setTimeout(() => { clearInterval(t); res(store.owned(id)); }, 60000); });
    };
    window.dispatchEvent(new Event('fp-bridge'));
  }, false);
})();
