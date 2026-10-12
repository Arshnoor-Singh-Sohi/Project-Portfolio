// src/components/markdown/headings.jsx
// Assigns the SAME anchor id an h2/h3 gets in the live render to a ToC
// entry precomputed from the raw markdown. `assigner` must be a fresh
// createHeadingIdAssigner() instance created once per render (see
// BlogPost.jsx) so ids line up exactly with the ones extractHeadings()
// built.
import React from 'react';
import { getTextContent } from '../../lib/markdown-utils';

export function makeHeadingRenderer(Tag, assigner) {
  return function Heading({ children }) {
    const id = assigner(getTextContent(children));
    return <Tag id={id}>{children}</Tag>;
  };
}
