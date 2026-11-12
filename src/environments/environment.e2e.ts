// Isolated demo project: this configuration must never use production Firebase.
export const environment = {
  production: false,
  firebaseEmulators: true,
  firebase: {
    apiKey: 'demo-inventory-key',
    authDomain: 'demo-inventory-upgrade.firebaseapp.com',
    projectId: 'demo-inventory-upgrade',
  },
};
