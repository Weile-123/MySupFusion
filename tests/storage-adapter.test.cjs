const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('h5/index.html', 'utf8');
const adapter = html.match(/<script>\s*([\s\S]*?window\.FusionStorage[\s\S]*?)<\/script>/)?.[1];
assert.ok(adapter, 'storage adapter exists in the page');

function fakeIndexedDB() {
  const values = new Map();
  return {
    open() {
      const request = { result: null, error: null };
      queueMicrotask(() => {
        request.result = {
          createObjectStore() {},
          close() {},
          transaction(_name, mode) {
            const tx = { error: null };
            tx.objectStore = () => ({
              get(key) {
                const read = { result: null, error: null, transaction: tx };
                queueMicrotask(() => {
                  read.result = values.get(key);
                  read.onsuccess();
                  tx.oncomplete?.();
                });
                return read;
              },
              put(value, key) {
                assert.equal(mode, 'readwrite');
                values.set(key, structuredClone(value));
                queueMicrotask(() => tx.oncomplete());
              }
            });
            return tx;
          }
        };
        request.onupgradeneeded();
        request.onsuccess();
      });
      return request;
    }
  };
}

function storageFor(window) {
  vm.runInNewContext(adapter, { window, Promise });
  return window.FusionStorage;
}

test('local preview saves and restores a run after a page reload', async () => {
  const indexedDB = fakeIndexedDB();
  const first = storageFor({ indexedDB });
  assert.equal(first.available(), true);
  assert.equal(await first.load(), null);
  await first.save({ version: 1, run: { stage: 4, cash: 18 } });
  const reloaded = storageFor({ indexedDB });
  assert.deepEqual(await reloaded.load(), { version: 1, run: { stage: 4, cash: 18 } });
});

test('activity container uses Colorbox storage skill before local preview storage', async () => {
  const calls = [];
  const store = storageFor({
    indexedDB: { open() { throw new Error('fallback should not open'); } },
    ColorboxAI: { storage: {
      async getValue(key) { calls.push(['get', key]); return { mySupFusionGameV1: { version: 1 } }; },
      async setValue(value) { calls.push(['set', value.mySupFusionGameV1.version]); return { ok: true }; }
    } }
  });
  assert.deepEqual(await store.load(), { version: 1 });
  await store.save({ version: 1 });
  assert.deepEqual(calls, [['get', 'mySupFusionGameV1'], ['set', 1]]);
});
