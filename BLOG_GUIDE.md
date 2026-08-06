# Your new /blog — how it works

## What changed in the repo

- `src/content/blog/` — every markdown file in here becomes a blog post. This is the only folder you'll touch to publish.
- `src/lib/posts.js` — loads and parses those markdown files at build time (no server, no database).
- `src/pages/BlogList.jsx` and `src/pages/BlogPost.jsx` — the `/blog` and `/blog/:slug` pages, styled to match your existing "Data Storm" comic theme.
- `src/App.jsx` — now uses `react-router-dom` so `/`, `/blog`, and `/blog/:slug` are real routes.
- The "Latest Articles" section on your homepage now pulls your 3 newest real posts instead of the old hardcoded Medium links, and "ALL ARTICLES" points to `/blog` on your own site.
- `vercel.json` — tells Vercel to serve `index.html` for every route, so direct links like `arshnoorsinghsohi.com/blog/how-this-blog-works` and page refreshes work correctly (without this, Vercel would 404 on anything but `/`).
- `package.json` / `package-lock.json` — added `react-router-dom`, `react-markdown`, `remark-gfm`, `rehype-highlight`.

I included two sample posts (`how-this-blog-works.md`, `markdown-formatting-demo.md`) so you can see it working end to end — delete either once you've looked at them. `_template.md` is a starting-point template; its leading underscore means it's always skipped, so it'll never accidentally show up live.

## Publishing a new post

1. Create a new file in `src/content/blog/`, e.g. `my-first-real-post.md`. The filename becomes the URL (`/blog/my-first-real-post`).
2. Start it with a frontmatter block:

   ```yaml
   ---
   title: "My First Real Post"
   date: 2026-08-05
   excerpt: "One or two sentences shown on the blog list card."
   tags: [ai, engineering]
   published: true
   ---
   ```

3. Write the rest in normal markdown below that — headings, code blocks, lists, links, images, tables all work.
4. `git add`, `git commit`, `git push`. Vercel rebuilds automatically and the post is live within a minute or two.
5. Not ready to publish yet? Set `published: false` and it stays out of the build entirely until you flip it back.

## Writing in Obsidian

Open `src/content/blog` (inside your `Project-Portfolio` folder) directly as an Obsidian vault — no plugin or sync setup needed, since Obsidian just edits files on disk and those files are the exact ones git tracks. Obsidian's built-in Properties panel reads/writes the same YAML frontmatter this blog expects, so titles, dates, and tags show up there natively.

Workflow: write in Obsidian → save → commit + push from VS Code, GitHub Desktop, or a terminal in that folder → live on Vercel.

## Before your first real push

Run `npm install` once in the project folder to pull in the new packages, then `npm run dev` to preview locally at `localhost:5173`, including `/blog`.

## New: code blocks with copy buttons

Any fenced code block in a post — ` ```js `, ` ```python `, ` ```bash `, whatever — now renders with a small header showing the language and a COPY button, styled to match the theme. No frontmatter needed, it's automatic. Multiple languages in one post all work independently (see the demo post).

## New: mermaid diagrams

A fenced block tagged ` ```mermaid ` renders as an actual diagram — flowcharts, sequence diagrams, Gantt charts, etc. — the same way Notion or Obsidian shows them in preview mode, instead of raw text. The header still shows a badge ("MERMAID DIAGRAM") and a copy button like every other code block — copying grabs the mermaid source, not the picture, so you can paste it back into Obsidian to edit. Colors are matched to the site's ink/cream/gold palette automatically. If the syntax is invalid, it shows an error plus the raw code instead of crashing the page.

  ```mermaid
  flowchart LR
      A[Write post] --> B[git push]
      B --> C[Live on the blog]
  ```

Obsidian has a built-in mermaid renderer too, so what you see while writing is close to what ends up live.

## New: math equations

Write LaTeX-style math right in a post and it renders as proper typeset equations (via KaTeX), not raw text with dollar signs. Two forms:

- **Inline**, in the middle of a sentence — wrap in single `$`: `` $E = mc^2$ `` → $E = mc^2$
- **Block**, on its own centered line — wrap in double `$$`:

  ```
  $$
  \int_0^\infty e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}
  $$
  ```

Multi-line equations (matrices, aligned systems, etc.) work too — see the "Math equations" section of the demo post for a bigger example. Obsidian renders the same `$...$` / `$$...$$` syntax natively in preview mode, so what you see while writing matches what goes live.

## New: images — cover images + inline images

Two ways to add images, for two different purposes:

- **Cover image** (shows at the top of the post and as the thumbnail on `/blog` and the homepage): add `coverImage: images/my-cover.png` to a post's frontmatter, with the image file placed in `src/content/blog/images/`. This is the natural Obsidian flow — drop the image next to your notes, reference it by filename.
- **Inline images inside the post body**: just use normal markdown `![alt text](images/my-image.png)` anywhere in the post, same folder convention. These get picked up automatically by the build.

For Obsidian specifically: by default Obsidian inserts pasted/dragged images as `![[image.png]]` (wikilink style), which this blog won't render. Turn that off once in **Settings → Files & Links**: toggle **"Use \[\[Wikilinks\]\]"** off, and optionally set **"Default location for new attachments"** to `src/content/blog/images`. After that, dragging an image in gives you standard `![](images/foo.png)` markdown that just works.

## New: link previews (Open Graph)

This was the trickiest one to get right, so worth understanding: your site is a single-page app, meaning there's normally only one generic `<head>` for every URL. Most chat apps and some social crawlers (iMessage, Slack, Discord, and a fair number of others) don't run JavaScript before generating a preview card — they just read whatever `<head>` tags come back for that exact URL. Without extra work, sharing `arshnoorsinghsohi.com/blog/some-post` would show the same generic preview as the homepage.

I added `scripts/generate-og-pages.mjs`, which runs automatically after every build (via the `postbuild` npm script — Vercel picks this up with zero extra config) and writes a small static HTML file per post at `dist/blog/<slug>/index.html`, each with that post's real title, excerpt, and image baked into proper `og:*` / `twitter:*` meta tags. A real visitor loads the exact same app bundle and the SPA takes over instantly — this only changes what a link-preview bot sees.

One nuance: the OG *preview image* specifically has to be a predictable path at build time, so it only picks up `coverImage` values that are either a full `https://` URL or an absolute `/...` path (something in `public/`). A relative `images/foo.png` cover (the Obsidian-friendly kind, above) still renders fine *inside* the post, but for the share-preview image itself, drop a copy in `public/blog-covers/` and reference it as `coverImage: /blog-covers/my-post.png` instead. Posts without any usable image fall back to your profile photo.

You can sanity-check any link before sharing it with Twitter/X's [Card Validator](https://cards-dev.twitter.com/validator) or Facebook's [Sharing Debugger](https://developers.facebook.com/tools/debug/) once it's live.

## New: table of contents + reading progress bar

Any post with 2+ `##`/`###` headings automatically gets a "TABLE OF CONTENTS" box right after the header, linking to each section. A thin progress bar also tracks scroll position along the top of the screen while reading. Nothing to configure — just write headings normally.

## New: prev/next + related posts

Every post now shows "OLDER ISSUE" / "NEWER ISSUE" links (based on publish date) plus a "RELATED ISSUES" section pulling other posts that share at least one tag — so tagging your posts consistently is what makes this useful. If nothing shares a tag yet, it quietly fills in with your most recent posts instead of showing nothing.

## New: share buttons

Share on X, share on LinkedIn, and copy-link buttons on every post, using the same canonical URL the link-preview system generates — so a shared link now both looks right *and* is one click to share.

## New: "Issue #" numbering

Posts are automatically numbered like the homepage's own "DATA STORM #001" branding — your oldest post is Issue #001, and each new post increments from there. No frontmatter field needed; it's computed from publish date order. Shows on the post page, the `/blog` cards, and the homepage teaser cards.

## New: RSS feed + sitemap

`scripts/generate-feeds.mjs` runs in the same `postbuild` step as the OG script and writes `dist/rss.xml` and `dist/sitemap.xml` from your posts — live at `arshnoorsinghsohi.com/rss.xml` and `.../sitemap.xml` once deployed. There's a "SUBSCRIBE VIA RSS" link at the top of `/blog`, and `public/robots.txt` now points crawlers at the sitemap.

## New: search + tag filtering on /blog

A search box and clickable tag pills above the post grid — everything's client-side since your post count is small, so it's instant, no backend involved.

## New: floating Home/Blog quick-nav

A small badge pinned to the bottom-right corner on every page (Home/Blog), since your homepage's scroll-story design has no persistent nav bar. It dims whichever page you're already on.

## New: email subscriptions (new post -> subscriber inbox)

Readers can now enter their email on `/blog` or at the bottom of any post to get notified whenever you publish something new. Unlike everything else in this blog, this genuinely needs a backend — a static site can't send email or remember subscribers on its own — so it's built on three pieces, all free at your scale:

- **Two new files under `api/`** (`subscribe.js`, `confirm.js`, `unsubscribe.js`) — these are Vercel Serverless Functions. Any file in `api/` automatically becomes a live endpoint on your Vercel deployment (e.g. `arshnoorsinghsohi.com/api/subscribe`) with zero extra config; the `api/_lib/` folder holds shared helpers and is not itself routable.
- **Upstash Redis** (provisioned free through Vercel's own Marketplace) — stores the subscriber list and their confirm/unsubscribe tokens.
- **Resend** (separate free account) — actually sends the emails, both the "confirm your email" one and the "new post is up" one.
- **`scripts/notify-subscribers.mjs`** — added as the last step of `postbuild`. Every time Vercel finishes a build, it checks whether any post is newer than the last one it notified about, and if so, emails every confirmed subscriber. If a build has nothing new to say, it just logs that and does nothing.

This is a real double opt-in flow: someone enters their email -> gets a confirmation email -> clicks it -> *then* they're actually subscribed and show up in the notify list. Nobody gets added silently. Every notification email also carries a personal unsubscribe link.

**Important:** none of this runs anywhere until you finish a one-time setup — it's the one feature in this whole blog that needs accounts I can't create for you. Until you do, the signup form will show a "not set up yet" error if someone tries it, and every build's `notify-subscribers` step will just log a skip message — it won't break your build or your site either way.

### One-time setup (about 15–20 minutes)

1. **Create a free Resend account** at resend.com.
2. **Verify your domain** (Resend → Domains → Add Domain → `arshnoorsinghsohi.com`). Resend gives you 2–3 DNS records (usually a couple of `TXT`/`CNAME` entries for SPF/DKIM) — add those at wherever your domain's DNS is managed (your registrar, or Vercel's Domains tab if it's managed there). This can take a few minutes to a few hours to verify depending on DNS propagation.
3. **Create a Resend API key** (Resend → API Keys) and copy it.
4. **Provision Upstash Redis from Vercel** — in your Vercel project, go to the **Storage** tab → **Marketplace Database Integrations** → choose **Upstash** → **Redis** → follow the prompts to create a (free-tier) database and connect it to this project. Vercel automatically adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as environment variables for you — no manual copy-pasting needed for this part.
5. **Add the Resend key to Vercel** — Project → Settings → Environment Variables → add `RESEND_API_KEY` with the key from step 3. Apply it to all environments (Production, Preview, Development) so it's available at build time too, since `notify-subscribers.mjs` runs during the build, not just at request time.
6. *(Optional)* Add `NOTIFY_FROM_EMAIL` if you want emails to come from something other than `newsletter@arshnoorsinghsohi.com` — just make sure it's on the domain you verified in step 2.
7. **Redeploy** (push any small commit, or trigger a redeploy from Vercel) so the new environment variables actually take effect.

After that, the signup form on `/blog` and on every post works end to end, and every future post automatically triggers a notification email once the build finishes.

### A few things worth knowing

- **Local dev won't send real emails.** `npm run dev` / `npm run preview` don't run Vercel Serverless Functions — only an actual Vercel deployment does. Locally, submitting the form will hit a 404 on `/api/subscribe`, which is expected. (Vercel's own CLI, `vercel dev`, can emulate this locally if you ever want to test the flow before pushing — not required, just an option.)
- **The very first build after setup won't email anyone about your existing posts.** It records a "starting point" instead, so people who subscribe don't get a surprise dump of every old post — only posts published after that point trigger a notification.
- **No admin dashboard.** The subscriber list lives in Upstash — if you ever want to see or export it, you'd check it from the Upstash console (or ask me to build a small `api/` endpoint to list them, protected by a password, if that'd be useful later).
- **Spam protection is basic but real:** a hidden field bots tend to auto-fill (invisible to real visitors) silently blocks obvious bot signups, and double opt-in means nobody gets subscribed without clicking a real link in their own inbox.

## One unrelated thing I noticed (not touched)

`src/pages/AwwardsPortfolio.jsx` has a stray nested comment around line 1595 that Vite flags during build (a `}` inside a broken `/* ... */` block). It didn't fail your build and isn't part of the active page (`ComicPortfolio` is what's live), but worth a quick look next time you're in that file.
