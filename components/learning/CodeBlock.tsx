'use client';

import { useState, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { useTheme } from 'next-themes';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

function normalizeLanguage(lang: string): string {
  const map: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    md: 'markdown',
  };
  const lower = lang.toLowerCase();
  return map[lower] || lower;
}

export function CodeBlock({ code, language = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const normalizedLang = normalizeLanguage(language);

  return (
    <div className="relative group mb-4">
      <div className="flex items-center justify-between px-4 py-1.5 bg-muted/60 rounded-t-lg border-b border-border/50">
        {normalizedLang ? (
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {normalizedLang}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
            </>
          )}
        </button>
      </div>
      <Highlight
        theme={resolvedTheme === 'dark' ? themes.oneDark : themes.oneLight}
        code={code}
        language={normalizedLang || 'text'}
      >
        {({ style, tokens, getLineProps, getTokenProps }) => {
          const { background: _bg, backgroundColor: _bgc, ...safeStyle } = style;
          void _bg; void _bgc;
          return (
            <pre
              className="rounded-t-none rounded-b-lg p-4 overflow-x-auto text-sm"
              style={{ ...safeStyle, backgroundColor: 'var(--color-muted)' }}
            >
              <code className="font-mono">
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </code>
            </pre>
          );
        }}
      </Highlight>
    </div>
  );
}
