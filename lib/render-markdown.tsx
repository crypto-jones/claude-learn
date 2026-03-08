import React from 'react';

/**
 * Render inline markdown: **bold**, *italic*, `code`
 */
function renderInline(text: string, lineKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={`b-${lineKey}-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={`i-${lineKey}-${match.index}`}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(
        <code
          key={`c-${lineKey}-${match.index}`}
          className="px-1.5 py-0.5 rounded bg-foreground/10 text-[0.85em] font-mono"
        >
          {match[6]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

/**
 * Render chat markdown: bullet lists, numbered lists, bold, italic, code.
 * Used across all AI response outputs (assessment, companion, feedback, etc.)
 */
export function renderChatMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bullet list: lines starting with - or * followed by space
    const bulletMatch = line.match(/^(\s*)[-*•]\s+(.*)/);
    if (bulletMatch) {
      const items: React.ReactNode[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)[-*•]\s+(.*)/);
        if (!m) break;
        items.push(
          <li key={`bli-${i}`}>{renderInline(m[2], i)}</li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 my-1 space-y-0.5">
          {items}
        </ul>
      );
      continue;
    }

    // Numbered list: lines starting with digit(s) followed by . or ) and space
    const numMatch = line.match(/^(\s*)\d+[.)]\s+(.*)/);
    if (numMatch) {
      const items: React.ReactNode[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)\d+[.)]\s+(.*)/);
        if (!m) break;
        items.push(
          <li key={`nli-${i}`}>{renderInline(m[2], i)}</li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 my-1 space-y-0.5">
          {items}
        </ol>
      );
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      if (elements.length > 0) {
        elements.push(<br key={`br-${i}`} />);
      }
      i++;
      continue;
    }

    // Regular text line
    if (elements.length > 0) {
      const prev = elements[elements.length - 1];
      // Add line break between text lines, but not after lists or breaks
      if (React.isValidElement(prev) && prev.type !== 'ul' && prev.type !== 'ol' && prev.type !== 'br') {
        elements.push(<br key={`br-${i}`} />);
      }
    }
    elements.push(
      <span key={`ln-${i}`}>{renderInline(line, i)}</span>
    );
    i++;
  }

  return elements;
}
