"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

interface KatexRendererProps {
  content: string;
  display?: boolean;
}

export function KatexRenderer({ content, display = false }: KatexRendererProps) {
  let html: string;
  try {
    html = katex.renderToString(content, {
      displayMode: display,
      throwOnError: false,
      strict: false,
    });
  } catch {
    html = content;
  }

  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
