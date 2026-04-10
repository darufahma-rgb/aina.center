import { useQuery } from "@tanstack/react-query";
import { Clock, UserPen } from "lucide-react";

interface RecordMetaProps {
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  className?: string;
}

function formatDate(d?: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function RecordMeta({ createdBy, updatedBy, createdAt, updatedAt, className = "" }: RecordMetaProps) {
  const { data: userMap = {} } = useQuery<Record<number, string>>({
    queryKey: ["/api/users/map"],
    staleTime: 60_000,
  });

  const creator = createdBy ? (userMap[createdBy] ?? `#${createdBy}`) : null;
  const editor = updatedBy && updatedBy !== createdBy ? (userMap[updatedBy] ?? `#${updatedBy}`) : null;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground ${className}`}>
      {creator && (
        <span className="flex items-center gap-1">
          <UserPen className="h-2.5 w-2.5" />
          Dibuat oleh <span className="font-medium text-foreground/70">{creator}</span>
          {createdAt && <span>· {formatDate(createdAt)}</span>}
        </span>
      )}
      {editor && (
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          Diedit oleh <span className="font-medium text-foreground/70">{editor}</span>
          {updatedAt && <span>· {formatDate(updatedAt)}</span>}
        </span>
      )}
    </div>
  );
}
