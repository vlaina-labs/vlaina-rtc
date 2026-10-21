import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFile(path.join(root, file));
const manifest = JSON.parse(await read('source-manifest.json'));
const lock = JSON.parse(await read('sources.lock.json'));
const present = [];
async function walk(folder) {
  for (const entry of await readdir(path.join(root, folder), { withFileTypes: true })) {
    const relative = path.posix.join(folder, entry.name);
    if (entry.isDirectory()) await walk(relative);
    else present.push(relative);
  }
}
await walk('vendor');
assert.deepEqual(present.sort(), Object.keys(manifest.files).sort());
for (const [file, hash] of Object.entries(manifest.files)) {
  assert.equal(createHash('sha256').update(await read(file)).digest('hex'), hash, file);
  assert.doesNotMatch(file, /(?:^|\/)(?:\.git|examples|pages|samples)(?:\/|$)|\.md$/i);
}
for (const component of lock.components) {
  assert.match(component.revision, /^[a-f0-9]{40}$/);
  assert.ok(await stat(path.join(root, component.path, 'CMakeLists.txt')));
  const files = present.filter(file => file.startsWith(component.path + '/') &&
    !lock.components.some(other => other !== component && other.path.startsWith(component.path + '/') && file.startsWith(other.path + '/')));
  assert.equal(files.length, component.files, component.name);
}
const init = (await read('vendor/libdatachannel/src/impl/init.cpp')).toString();
assert.match(init, /int count = MIN_THREADPOOL_SIZE;/);
assert.doesNotMatch(init, /int count = std::max\(concurrency/);
const cmake = (await read('vendor/libdatachannel/CMakeLists.txt')).toString();
assert.match(cmake, /if\(MSVC AND vlaina_datachannel_type STREQUAL "SHARED_LIBRARY"\)/);
const wrapper = (await read('CMakeLists.txt')).toString();
for (const flag of ['NO_MEDIA', 'NO_EXAMPLES', 'NO_TESTS']) assert.ok(wrapper.includes(`set(${flag} ON CACHE BOOL`), flag);
assert.ok(wrapper.includes(`GIT_TAG ${lock.externalDependencies[0].revision}`));
for (const file of ['LICENSE', 'vendor/libdatachannel/LICENSE', 'vendor/libdatachannel/deps/libjuice/LICENSE'])
  assert.match((await read(file)).toString(), /Mozilla Public License Version 2.0/);
assert.match((await read('vendor/libdatachannel/deps/usrsctp/LICENSE.txt')).toString(), /Redistribution and use/);
assert.match((await read('vendor/libdatachannel/deps/plog/LICENSE')).toString(), /MIT License/);
assert.match((await read('licenses/mbedtls-apache-2.0.txt')).toString(), /Apache License/);
assert.ok(await stat(path.join(root, 'vendor/libdatachannel/deps/usrsctp/usrsctp.pc.in')));
console.log(`Verified ${present.length} vendored files, pinned revisions, licenses and both networking patches. No compilation performed.`);
