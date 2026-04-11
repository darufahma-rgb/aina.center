import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
  prose?: "default" | "purple" | "green" | "white";
}

const proseColors = {
  default: {
    p: "text-foreground",
    strong: "font-semibold text-foreground",
    li: "text-foreground",
    h3: "font-semibold text-foreground",
    code: "bg-muted text-foreground px-1 py-0.5 rounded",
    hr: "border-border",
  },
  purple: {
    p: "text-purple-900",
    strong: "font-semibold text-purple-950",
    li: "text-purple-900",
    h3: "font-semibold text-purple-950",
    code: "bg-purple-200/50 text-purple-900 px-1 py-0.5 rounded",
    hr: "border-purple-300",
  },
  green: {
    p: "text-green-900",
    strong: "font-semibold text-green-950",
    li: "text-green-900",
    h3: "font-semibold text-green-950",
    code: "bg-green-200/50 text-green-900 px-1 py-0.5 rounded",
    hr: "border-green-300",
  },
  white: {
    p: "text-white",
    strong: "font-semibold text-white",
    li: "text-white",
    h3: "font-semibold text-white",
    code: "bg-white/20 text-white px-1 py-0.5 rounded",
    hr: "border-white/30",
  },
};

export default function MarkdownContent({ content, className, prose = "default" }: MarkdownContentProps) {
  const c = proseColors[prose];

  return (
    <div className={cn("leading-relaxed space-y-1.5", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className={cn("mb-1.5 last:mb-0", c.p)}>{children}</p>,
          strong: ({ children }) => <strong className={c.strong}>{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-none space-y-1 my-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1.5">{children}</ol>,
          li: ({ children }) => (
            <li className={cn("flex items-start gap-1.5", c.li)}>
              <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-60" />
              <span className="flex-1">{children}</span>
            </li>
          ),
          h1: ({ children }) => <h1 className={cn("text-base font-bold mb-1", c.h3)}>{children}</h1>,
          h2: ({ children }) => <h2 className={cn("text-sm font-bold mb-1", c.h3)}>{children}</h2>,
          h3: ({ children }) => <h3 className={cn("text-[13px] font-semibold mb-0.5", c.h3)}>{children}</h3>,
          code: ({ children, className: codeClass }) => {
            const isBlock = codeClass?.includes("language-");
            if (isBlock) {
              return (
                <pre className={cn("rounded-lg p-2.5 text-[11px] overflow-x-auto my-1.5", c.code)}>
                  <code>{children}</code>
                </pre>
              );
            }
            return <code className={cn("text-[11px] font-mono", c.code)}>{children}</code>;
          },
          hr: () => <hr className={cn("my-2 border-t", c.hr)} />,
          blockquote: ({ children }) => (
            <blockquote className={cn("border-l-2 border-current/30 pl-3 opacity-80 my-1.5", c.p)}>
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
