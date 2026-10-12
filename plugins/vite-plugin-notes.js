// plugins/vite-plugin-notes.js
// ============================================================
// Serves every markdown file under src/content/notes as the virtual
// module `virtual:notes`. The files are read with fs here, in Node,
// at build time — NOT with import.meta.glob — so the plugin decides
// what goes into the bundle:
//
//   - `npm run dev`   (command "serve"): every note, private ones too.
//   - `npm run build` (command "build"): notes with `private: true`
//     are dropped before any code is generated, so their text never
//     reaches dist/ (no JS chunk, no source map, nothing).
//
// The module's default export is an array of
//   { path: 'fft-signal-processing/course-plan.md', data, content }
// with frontmatter already parsed. src/lib/notes.js turns that into
// the tree. See NOTES_GUIDE.md for the content rules.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../src/lib/frontmatter.js';

const VIRTUAL_ID = 'virtual:notes';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, base));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

export default function notesPlugin() {
  let notesDir = '';
  let includePrivate = false;

  return {
    name: 'portfolio-notes',

    configResolved(config) {
      notesDir = path.resolve(config.root, 'src/content/notes');
      includePrivate = config.command === 'serve';
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      const files = walk(notesDir)
        .sort()
        .map((rel) => {
          const full = path.join(notesDir, rel);
          if (this.addWatchFile) this.addWatchFile(full);
          const { data, content } = parseFrontmatter(fs.readFileSync(full, 'utf8'));
          return { path: rel, data, content };
        })
        .filter((file) => includePrivate || file.data.private !== true);
      return `export default ${JSON.stringify(files)};`;
    },

    // Dev only: any add/change/delete under src/content/notes rebuilds
    // the virtual module and reloads the page, so a new note shows up
    // without restarting `npm run dev`.
    configureServer(server) {
      server.watcher.add(notesDir);
      const onChange = (file) => {
        // Lower-cased because Windows paths can differ in drive-letter case.
        if (!path.resolve(file).toLowerCase().startsWith(notesDir.toLowerCase())) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
