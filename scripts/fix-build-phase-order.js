#!/usr/bin/env node
/**
 * Ensures the [SharedTapStore] patch build phase runs AFTER [Expo] Configure project
 * in the SmokeTap target. [Expo] Configure project regenerates ExpoModulesProvider.swift
 * on every build, so any patch that runs before it is wiped out.
 *
 * The withSharedTapStore plugin can't enforce this order: it runs during config-plugin
 * application, before pod install adds the [Expo] Configure project phase.
 */

const fs = require('fs');
const path = require('path');

const PBXPROJ = path.join(__dirname, '..', 'ios', 'SmokeTap.xcodeproj', 'project.pbxproj');
const PATCH_PHASE_MARKER = '[SharedTapStore] Patch SharedTapStoreModule into ExpoModulesProvider';
const CONFIGURE_PHASE_MARKER = '[Expo] Configure project';

let src = fs.readFileSync(PBXPROJ, 'utf8');

// Locate the SmokeTap PBXNativeTarget block (distinct from the same-named PBXGroup).
const nativeTargetRegex = /([0-9A-F]{24}) \/\* SmokeTap \*\/ = \{\s+isa = PBXNativeTarget;/;
const match = nativeTargetRegex.exec(src);
if (!match) {
  console.error('[fix-build-phase-order] SmokeTap PBXNativeTarget block not found');
  process.exit(1);
}
const targetStart = match.index;
const blockEnd = src.indexOf('};', targetStart);
const block = src.slice(targetStart, blockEnd);

// Extract the buildPhases = ( ... ); section from this target block.
const bpStart = block.indexOf('buildPhases = (');
const bpEnd = block.indexOf(');', bpStart);
if (bpStart === -1 || bpEnd === -1) {
  console.error('[fix-build-phase-order] buildPhases array not found in SmokeTap target');
  process.exit(1);
}
const bpInner = block.slice(bpStart + 'buildPhases = ('.length, bpEnd);
const lines = bpInner.split('\n');

// Find the patch phase line and the Configure project phase line.
const patchIdx = lines.findIndex((l) => l.includes(PATCH_PHASE_MARKER));
const configureIdx = lines.findIndex((l) => l.includes(CONFIGURE_PHASE_MARKER));

if (patchIdx === -1) {
  console.log('[fix-build-phase-order] patch phase not present yet — skipping');
  process.exit(0);
}
if (configureIdx === -1) {
  console.log('[fix-build-phase-order] [Expo] Configure project phase not present — skipping');
  process.exit(0);
}
if (patchIdx > configureIdx) {
  console.log('[fix-build-phase-order] order already correct');
  process.exit(0);
}

// Move the patch line to immediately after the configure line.
const [patchLine] = lines.splice(patchIdx, 1);
// configureIdx shifted left by 1 because patch was before it
const insertAt = configureIdx; // already accounts for the splice
lines.splice(insertAt, 0, patchLine);

const newBpInner = lines.join('\n');
const newBlock = block.slice(0, bpStart + 'buildPhases = ('.length) + newBpInner + block.slice(bpEnd);
const out = src.slice(0, targetStart) + newBlock + src.slice(blockEnd);

fs.writeFileSync(PBXPROJ, out, 'utf8');
console.log('[fix-build-phase-order] moved patch phase after [Expo] Configure project');
