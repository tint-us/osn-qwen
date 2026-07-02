import { KatexRenderer } from "@/components/shared/KatexRenderer";

interface QuestionDisplayProps {
  content: string;
}

interface Segment {
  type: "text" | "inline" | "display";
  value: string;
}

function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    const matched = match[0];
    if (matched.startsWith("$$")) {
      segments.push({
        type: "display",
        value: matched.slice(2, -2),
      });
    } else {
      segments.push({
        type: "inline",
        value: matched.slice(1, -1),
      });
    }

    lastIndex = match.index + matched.length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments;
}

export function QuestionDisplay({ content }: QuestionDisplayProps) {
  const segments = parseContent(content);

  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.type === "display") {
          return (
            <div key={i} className="my-2">
              <KatexRenderer content={seg.value} display />
            </div>
          );
        }
        if (seg.type === "inline") {
          return <KatexRenderer key={i} content={seg.value} />;
        }
        return <span key={i}>{seg.value}</span>;
      })}
    </span>
  );
}
