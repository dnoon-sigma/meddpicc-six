import type { ReactNode } from "react";

/** Inline formatting: **bold**, *italic*, [text](https://link). Rendered as React elements, never raw HTML. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={i++} className="font-semibold text-white">{t.slice(2, -2)}</strong>);
    else if (t.startsWith("*")) out.push(<em key={i++}>{t.slice(1, -1)}</em>);
    else {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!;
      out.push(<a key={i++} href={href} target="_blank" rel="noopener noreferrer" className="text-cyan underline underline-offset-2">{label}</a>);
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Small markdown subset: headings (#, ##, ###), bullet lists, paragraphs (blank-line separated), line breaks. */
export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className="space-y-4 leading-relaxed text-slate-200">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const heading = /^(#{1,3})\s+(.*)$/.exec(lines[0]);
        if (heading && lines.length === 1) {
          const size = heading[1].length === 1 ? "text-2xl" : heading[1].length === 2 ? "text-xl" : "text-lg";
          return <h3 key={i} className={`mt-6 font-display ${size} text-cyan`}>{inline(heading[2])}</h3>;
        }
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*•]\s+/, ""))}</li>)}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
