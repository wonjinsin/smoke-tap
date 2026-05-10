#!/usr/bin/env node
/**
 * Called by the Xcode "Patch SharedTapStoreModule" build phase
 * to register SharedTapStoreModule in ExpoModulesProvider.swift
 * (which expo-modules-autolinking regenerates on every build).
 */

const fs   = require('fs');
const path = require('path');

// SRCROOT is set by Xcode (points to ios/)
const srcRoot = process.env.SRCROOT || path.join(__dirname, '..', 'ios');
const provider = path.join(srcRoot, 'Pods', 'Target Support Files', 'Pods-SmokeTap', 'ExpoModulesProvider.swift');

if (!fs.existsSync(provider)) {
  process.exit(0); // not found — skip silently
}

let src = fs.readFileSync(provider, 'utf8');
if (src.includes('SharedTapStoreModule')) {
  process.exit(0); // already patched
}

src = src.replace(
  '(module: WidgetsModule.self, name: nil)',
  '(module: WidgetsModule.self, name: nil),\n      (module: SharedTapStoreModule.self, name: nil)'
);

fs.writeFileSync(provider, src, 'utf8');
console.log('[SharedTapStore] patched ExpoModulesProvider.swift');
