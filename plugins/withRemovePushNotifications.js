const { withEntitlementsPlist } = require('@expo/config-plugins');

// expo-widgets alpha adds aps-environment even when push notifications are disabled.
// Free Apple Developer accounts don't support push notifications capability.
// This plugin removes it after prebuild.
module.exports = function withRemovePushNotifications(config) {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });
};
