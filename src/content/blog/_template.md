---
title: "Post Title Goes Here"
date: 2026-01-01
excerpt: "One or two sentence summary shown on the blog list card and homepage teaser."
tags: [tag-one, tag-two]
published: false
---

Write your post in normal Markdown below the frontmatter block above.
Delete this placeholder text and replace it with your own writing.

Filename convention: name the file `my-post-slug.md` (lowercase, hyphens,
no spaces) — that filename becomes the URL, e.g. `/blog/my-post-slug`.

## A heading

Regular paragraph text goes here. **Bold**, _italic_, and `inline code`
all work normally.

- bullet
- points
- work fine

```js
// fenced code blocks are syntax highlighted automatically
console.log("hello from a code block");
```

> Blockquotes look like this.

This file starts with an underscore (`_template.md`), so the blog
loader always skips it — it will never show up on the live site no
matter what `published` is set to. Copy it to a new file without the
underscore to start a real post.
