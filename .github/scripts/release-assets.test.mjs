import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { releaseAssetName, prepareAssets } from './release-assets.mjs';

test('selects only correctly named binaries from requested runs', () => {
  const ids = { android: '123', ios: '456' };
  assert.equal(releaseAssetName('android/e-patient-midtrans-debug-123/app-midtrans-debug.apk', 'v1-dev', ids), 'e-patient-v1-dev-midtrans-debug.apk');
  assert.equal(releaseAssetName('ios/e-patient-stripe-signed-ipa-456/Runner.ipa', 'v1-dev', ids), 'e-patient-v1-dev-stripe.ipa');
  for (const path of ['android/e-patient-midtrans-debug-999/app-midtrans-debug.apk', 'ios/e-patient-stripe-simulator-app-456/Runner.app.zip', '../secret.ipa', 'android/e-patient-app-links-midtrans-debug-123/assetlinks-debug.json']) {
    assert.equal(releaseAssetName(path, 'v1-dev', ids), null);
  }
  assert.throws(() => releaseAssetName('anything', '../bad', ids), /Invalid/);
});
test('stages checksummed binaries and fails for requested missing IPA', () => {
  const root = mkdtempSync(join(tmpdir(), 'epatient-release-test-'));
  try {
    const directory = join(root, 'release-downloads/android/e-patient-midtrans-release-123');
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'app-midtrans-release.apk'), 'fixture');
    const env = { RELEASE_TAG: 'v1-test', ANDROID_RUN_ID: '123', SOURCE_SHA: 'abc' };
    assert.throws(() => prepareAssets({ ...env, IOS_RUN_ID: '456' }, root), /missing/);
    prepareAssets(env, root);
    assert.match(readFileSync(join(root, 'release-assets/SHA256SUMS'), 'utf8'), /^[a-f0-9]{64}  e-patient-v1-test-midtrans-release.apk\n$/);
    assert.throws(() => prepareAssets(env, root), /EEXIST/);
  } finally { rmSync(root, { recursive: true }); }
});
