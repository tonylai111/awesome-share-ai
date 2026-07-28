import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/toc";

type Props = {
  source: string;
  className?: string;
};

function flattenText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (typeof node === "object" && "props" in node) {
    return flattenText(
      (node as { props?: { children?: React.ReactNode } }).props?.children,
    );
  }
  return "";
}

function createHeadingComponents() {
  const seen = new Map<string, number>();

  function createHeading(level: 2 | 3 | 4) {
    const Tag = `h${level}` as const;
    return function Heading({ children }: { children?: React.ReactNode }) {
      const text = flattenText(children);
      let id = slugify(text);
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) id = `${id}-${count + 1}`;
      return (
        <Tag id={id} className="scroll-mt-28">
          {children}
        </Tag>
      );
    };
  }

  return {
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    table: (props: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="table-wrap">
        <table {...props} />
      </div>
    ),
  };
}

export function MdxContent({ source, className }: Props) {
  const components = createHeadingComponents();
  return (
    <div className={className}>
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: {
            format: "md",
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </div>
  );
}
