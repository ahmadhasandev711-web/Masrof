import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** Renders a post's Markdown source to HTML for display. Posts are authored by us only (no user-submitted content), so raw HTML output is an acceptable trust boundary here. */
export function renderPostContent(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
