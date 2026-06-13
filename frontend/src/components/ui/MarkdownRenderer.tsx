"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
}

// Simple inline parser for **bold** and `code`
function parseInlineStyles(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  // Regex to match either **bold** or `code`
  const regex = /(\*\*.*?\*\*|`.*?`)/;

  while (currentText) {
    const match = regex.exec(currentText);
    if (!match) {
      parts.push(currentText);
      break;
    }

    const matchText = match[0];
    const matchIndex = match.index;

    // Add prefix text
    if (matchIndex > 0) {
      parts.push(currentText.substring(0, matchIndex));
    }

    // Add styled match
    if (matchText.startsWith("**") && matchText.endsWith("**")) {
      const boldVal = matchText.substring(2, matchText.length - 2);
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-semibold text-gray-900 dark:text-white font-display">
          {boldVal}
        </strong>
      );
    } else if (matchText.startsWith("`") && matchText.endsWith("`")) {
      const codeVal = matchText.substring(1, matchText.length - 1);
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-violet-500 dark:text-violet-400 border border-border"
        >
          {codeVal}
        </code>
      );
    }

    currentText = currentText.substring(matchIndex + matchText.length);
  }

  return parts.length > 0 ? parts : [text];
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // 1. Skip empty lines, but add a spacing
    if (!line) {
      elements.push(<div key={`space-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // 2. Headings
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold font-display text-gray-900 dark:text-white mt-6 mb-3 border-b border-border pb-1">
          {parseInlineStyles(line.substring(2))}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-xl font-bold font-display text-gray-900 dark:text-white mt-5 mb-2.5">
          {parseInlineStyles(line.substring(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold font-display text-violet-600 dark:text-violet-400 mt-4 mb-2">
          {parseInlineStyles(line.substring(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={i} className="text-base font-semibold font-display text-gray-800 dark:text-zinc-200 mt-3 mb-1.5">
          {parseInlineStyles(line.substring(5))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith("##### ")) {
      elements.push(
        <h5 key={i} className="text-sm font-semibold font-display text-gray-700 dark:text-zinc-300 mt-2 mb-1">
          {parseInlineStyles(line.substring(6))}
        </h5>
      );
      i++;
      continue;
    }

    // 3. Lists (unordered)
    if (line.startsWith("* ") || line.startsWith("- ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("* ") || lines[i].trim().startsWith("- "))) {
        listItems.push(lines[i].trim().substring(2));
        i++;
      }
      elements.push(
        <ul key={`list-${i}`} className="list-disc list-outside pl-5 mb-4 space-y-1.5 text-gray-700 dark:text-zinc-300">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed">
              {parseInlineStyles(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 4. Tables
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headers = tableLines[0]
          .split("|")
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        const alignmentLine = tableLines[1];
        const alignments = alignmentLine
          .split("|")
          .map((c) => {
            const trimmed = c.trim();
            if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
            if (trimmed.endsWith(":")) return "right";
            return "left";
          })
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        const dataRows = tableLines.slice(2).map((row) =>
          row
            .split("|")
            .map((c) => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        elements.push(
          <div key={`table-wrapper-${i}`} className="w-full my-5 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/60 text-gray-500 dark:text-zinc-400 uppercase text-xs font-mono border-b border-border">
                <tr>
                  {headers.map((h, idx) => {
                    const align = alignments[idx] || "left";
                    return (
                      <th
                        key={idx}
                        className="px-4 py-3 font-semibold"
                        style={{ textAlign: align as any }}
                      >
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-gray-700 dark:text-zinc-300">
                {dataRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-violet-50/20 dark:hover:bg-zinc-800/20 transition-colors">
                    {row.map((cell, cellIdx) => {
                      const align = alignments[cellIdx] || "left";
                      // Bold rows that have double stars in headers/values or start with bold values
                      const isBold = cell.startsWith("**") && cell.endsWith("**");
                      const cellContent = isBold ? cell.substring(2, cell.length - 2) : cell;
                      return (
                        <td
                          key={cellIdx}
                          className={`px-4 py-3 font-sz-sm ${isBold ? "font-semibold text-gray-900 dark:text-white" : ""}`}
                          style={{ textAlign: align as any }}
                        >
                          {parseInlineStyles(cellContent)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 5. Paragraphs fallback
    elements.push(
      <p key={i} className="text-gray-700 dark:text-zinc-300 text-sm leading-relaxed mb-4">
        {parseInlineStyles(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1 font-sans">{elements}</div>;
};
