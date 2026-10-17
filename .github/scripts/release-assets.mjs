import { readdirSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function releaseAssetName(relative, tag, { android, ios }) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(tag || '')) throw new Error('Invalid release tag');
  const apk = relative.match(/^android\/e-patient-(midtrans|stripe)-(debug|release)-([1-9][0-9]*)\/app-\1-\2\.apk$/);
  if (apk && apk[3] === android) return `e-patient-${tag}-${apk[1]}-${apk[2]}.apk`;
  const ipa = relative.match(/^ios\/e-patient-(midtrans|stripe)-signed-ipa-([1-9][0-9]*)\/[^/]+\.ipa$/);
  if (ipa && ipa[2] === ios) return `e-patient-${tag}-${ipa[1]}.ipa`;
  return null;
}

export function prepareAssets(env = process.env, root = process.cwd()) {
  const input = join(root, 'release-downloads');
  const output = join(root, 'release-assets');
  const selected = new Map();
  const walk = (directory, prefix = '') => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = `${prefix}${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error('Symlink in downloaded artifact');
      if (entry.isDirectory()) walk(join(directory, entry.name), `${relative}/`);
      else if (entry.isFile()) {
        const name = releaseAssetName(relative, env.RELEASE_TAG, { android: env.ANDROID_RUN_ID, ios: env.IOS_RUN_ID });
        if (!name) continue;
        if (selected.has(name)) throw new Error('Duplicate release asset name');
        selected.set(name, join(input, relative));
      }
    }
  };
  if (!existsSync(input)) throw new Error('No downloaded artifacts; check run IDs and expiry');
  walk(input);
  const names = [...selected.keys()].sort();
  for (const [id, extension] of [[env.ANDROID_RUN_ID, '.apk'], [env.IOS_RUN_ID, '.ipa']]) {
    if (id && !names.some(name => name.endsWith(extension))) throw new Error(`Requested ${extension} missing or expired`);
  }
  if (!names.length) throw new Error('No APK or signed IPA selected');
  mkdirSync(output); // Refuse to reuse stale output.
  const sums = [];
  for (const name of names) {
    const bytes = readFileSync(selected.get(name));
    if (!bytes.length) throw new Error('Empty binary artifact');
    copyFileSync(selected.get(name), join(output, name));
    sums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${name}`);
  }
  writeFileSync(join(output, 'SHA256SUMS'), `${sums.join('\n')}\n`);
  writeFileSync(join(output, 'RELEASE-NOTES.md'), `Development binaries; not a production/store deployment.\n\nSource commit: ${env.SOURCE_SHA}\nAndroid run: ${env.ANDROID_RUN_ID || 'not selected'}\niOS run: ${env.IOS_RUN_ID || 'not selected'}\n\nAPK debug and release use separate identities. IPA installation follows its provisioning profile; an App Store IPA is not directly installable. OAuth/payment/runtime functionality is not certified by publishing these files.\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepareAssets();
