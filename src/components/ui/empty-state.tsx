import { FolderSearch, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  icon = <FolderSearch className="h-10 w-10 text-gray-300" />,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      
      {actionLabel && actionHref && (
        <div className="mt-6">
          <Link
            to={actionHref}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
