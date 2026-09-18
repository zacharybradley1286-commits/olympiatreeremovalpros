function htmlToMarkdown(html) {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : "";

  // Remove non-content blocks: head, script, style, svg, nav, footer, header, noscript, comments
  let content = html;
  content = content.replace(/<!DOCTYPE[^>]*>/gi, "");
  content = content.replace(/<head[\s\S]*?<\/head>/gi, "");
  content = content.replace(/<script[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<style[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  content = content.replace(/<!--[\s\S]*?-->/g, "");
  content = content.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  content = content.replace(/<header[\s\S]*?<\/header>/gi, "");
  content = content.replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Headings
  content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n");
  content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n");
  content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n");
  content = content.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n\n#### $1\n\n");

  // Paragraphs and linebreaks
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
  content = content.replace(/<br\s*[\/]?>/gi, "\n");

  // Lists
  content = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n* $1");
  content = content.replace(/<\/?(ul|ol)[^>]*>/gi, "\n");

  // Links
  content = content.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Formatting
  content = content.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
  content = content.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*");

  // Strip remaining HTML tags
  content = content.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  content = content.replace(/&amp;/g, "&")
                   .replace(/&lt;/g, "<")
                   .replace(/&gt;/g, ">")
                   .replace(/&quot;/g, '"')
                   .replace(/&#39;/g, "'")
                   .replace(/&nbsp;/g, " ");

  // Normalize whitespace and newlines
  content = content.split("\n")
                   .map(l => l.replace(/[ \t]+/g, " ").trim())
                   .join("\n")
                   .replace(/\n{3,}/g, "\n\n")
                   .trim();

  let md = "";
  if (title || description) {
    md += "---\n";
    if (title) md += `title: "${title.replace(/"/g, '\\"')}"\n`;
    if (description) md += `description: "${description.replace(/"/g, '\\"')}"\n`;
    md += "---\n\n";
  }
  md += content;
  return md;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Canonical redirect: www to apex
  if (url.hostname === "www.olympiatreeremovalpros.com") {
    url.hostname = "olympiatreeremovalpros.com";
    return Response.redirect(url.toString(), 301);
  }

  const response = await context.next();
  const accept = request.headers.get("Accept") || "";
  const contentType = response.headers.get("Content-Type") || "";

  // Content negotiation: return markdown if requested and content is HTML
  if (accept.includes("text/markdown") && contentType.includes("text/html")) {
    const html = await response.text();
    const markdown = htmlToMarkdown(html);
    const tokens = Math.ceil(markdown.length / 4);

    const headers = new Headers(response.headers);
    headers.set("Content-Type", "text/markdown; charset=utf-8");
    headers.set("Content-Signal", "ai-train=no, search=yes, ai-input=no");
    headers.set("x-markdown-tokens", String(tokens));
    headers.set("Vary", "Accept");
    headers.delete("Content-Length");

    return new Response(markdown, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  // Regular browser requests: add security & signal headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Content-Signal", "ai-train=no, search=yes, ai-input=no");
  newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  newHeaders.set("X-Content-Type-Options", "nosniff");
  newHeaders.set("Vary", "Accept");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
