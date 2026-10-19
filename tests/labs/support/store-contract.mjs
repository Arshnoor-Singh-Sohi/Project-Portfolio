// tests/labs/support/store-contract.mjs
// The behaviour every Labs store must have. Run against the memory
// store and (when redis-server exists) the Redis store.
import assert from 'node:assert/strict';

const meta = (id, title = 'A lab') => ({ id, title, description: '', tags: [], createdAt: '2026-10-18T00:00:00.000Z', metaUpdatedAt: '2026-10-18T00:00:00.000Z' });
const content = (n = 1) => JSON.stringify({ schemaVersion: 1, cells: Array.from({ length: n }, (_, i) => ({ id: `c${i}`, type: 'code', source: `x = ${i}`, language: 'python', outputs: [] })) });

export function storeContract(t, makeStore) {
  return async () => {
    const store = await makeStore();

    await t.test('create, get, list', async () => {
      await store.createLab('owner', { meta: meta('lab_aaaaaa'), stats: { updatedAt: 'x', cellCount: 1 }, contentJson: content(1), starterJson: content(1) });
      const lab = await store.getLab('owner', 'lab_aaaaaa');
      assert.equal(lab.meta.title, 'A lab');
      assert.equal(lab.stats.revision, 1);
      assert.equal(lab.stats.cellCount, 1);
      const list = await store.listLabs('owner');
      assert.equal(list.length, 1);
      assert.equal(list[0].meta.id, 'lab_aaaaaa');
      const c = await store.getContent('owner', 'lab_aaaaaa');
      assert.equal(c.revision, 1);
      assert.equal(c.content.cells.length, 1);
      assert.equal((await store.getStarter('owner', 'lab_aaaaaa')).cells.length, 1);
    });

    await t.test('users are isolated', async () => {
      assert.equal(await store.getLab('someone', 'lab_aaaaaa'), null);
      assert.deepEqual(await store.listLabs('someone'), []);
      assert.equal(await store.getContent('someone', 'lab_aaaaaa'), null);
    });

    await t.test('saveContent checks the revision', async () => {
      const ok = await store.saveContent('owner', 'lab_aaaaaa', { baseRevision: 1, contentJson: content(2), stats: { updatedAt: 'y', cellCount: 2 } });
      assert.deepEqual(ok, { status: 'ok', revision: 2 });
      const stale = await store.saveContent('owner', 'lab_aaaaaa', { baseRevision: 1, contentJson: content(3), stats: { updatedAt: 'z', cellCount: 3 } });
      assert.deepEqual(stale, { status: 'conflict', revision: 2 });
      const c = await store.getContent('owner', 'lab_aaaaaa');
      assert.equal(c.content.cells.length, 2, 'a stale save must not change content');
      const forced = await store.saveContent('owner', 'lab_aaaaaa', { baseRevision: 0, contentJson: content(3), stats: { updatedAt: 'z', cellCount: 3 }, force: true });
      assert.deepEqual(forced, { status: 'ok', revision: 3 });
      const lab = await store.getLab('owner', 'lab_aaaaaa');
      assert.equal(lab.stats.revision, 3);
      assert.equal(lab.stats.cellCount, 3);
      assert.equal(lab.stats.updatedAt, 'z');
      const missing = await store.saveContent('owner', 'lab_nothere', { baseRevision: 1, contentJson: content(1), stats: { updatedAt: 'q' } });
      assert.equal(missing.status, 'missing');
    });

    await t.test('meta, stats and opened do not overwrite each other', async () => {
      await store.putMeta('owner', 'lab_aaaaaa', { ...meta('lab_aaaaaa', 'Renamed') });
      await store.touchOpened('owner', 'lab_aaaaaa', '2026-10-18T10:00:00.000Z');
      const lab = await store.getLab('owner', 'lab_aaaaaa');
      assert.equal(lab.meta.title, 'Renamed');
      assert.equal(lab.stats.revision, 3);
      assert.equal(lab.openedAt, '2026-10-18T10:00:00.000Z');
      const [entry] = await store.listLabs('owner');
      assert.equal(entry.openedAt, '2026-10-18T10:00:00.000Z');
      assert.equal(entry.stats.cellCount, 3);
    });

    await t.test('versions: add, list newest first, prune, get, delete', async () => {
      for (let i = 0; i < 4; i++) {
        await store.addVersion('owner', 'lab_aaaaaa', { id: `ver_00000${i}`, label: `v${i}`, createdAt: `2026-10-18T00:00:0${i}.000Z` }, content(i + 1), 3);
      }
      const list = await store.listVersions('owner', 'lab_aaaaaa');
      assert.deepEqual(list.map((v) => v.id), ['ver_000003', 'ver_000002', 'ver_000001']);
      const v = await store.getVersion('owner', 'lab_aaaaaa', 'ver_000002');
      assert.equal(v.summary.label, 'v2');
      assert.equal(v.content.cells.length, 3);
      assert.equal(await store.getVersion('owner', 'lab_aaaaaa', 'ver_000000'), null, 'pruned');
      assert.equal(await store.deleteVersion('owner', 'lab_aaaaaa', 'ver_000002'), true);
      assert.equal(await store.deleteVersion('owner', 'lab_aaaaaa', 'ver_000002'), false);
      assert.equal((await store.listVersions('owner', 'lab_aaaaaa')).length, 2);
    });

    await t.test('rate limit counter', async () => {
      assert.equal(await store.getRateLimit('k1'), 0);
      assert.equal(await store.hitRateLimit('k1', 60), 1);
      assert.equal(await store.hitRateLimit('k1', 60), 2);
      assert.equal(await store.getRateLimit('k1'), 2);
      await store.clearRateLimit('k1');
      assert.equal(await store.getRateLimit('k1'), 0);
    });

    await t.test('delete removes everything', async () => {
      assert.equal(await store.deleteLab('owner', 'lab_aaaaaa'), true);
      assert.equal(await store.getLab('owner', 'lab_aaaaaa'), null);
      assert.equal(await store.getContent('owner', 'lab_aaaaaa'), null);
      assert.deepEqual(await store.listVersions('owner', 'lab_aaaaaa'), []);
      assert.deepEqual(await store.listLabs('owner'), []);
      assert.equal(await store.deleteLab('owner', 'lab_aaaaaa'), false);
    });
  };
}
