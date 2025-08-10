interface ListItemSkeletonProps {
  showAvatar?: boolean;
  showSubtext?: boolean;
  showActions?: boolean;
}

export default function ListItemSkeleton({
  showAvatar = false,
  showSubtext = true,
  showActions = false,
}: ListItemSkeletonProps) {
  return (
    <div className="flex items-center space-x-3 p-4 animate-pulse">
      {showAvatar && <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>}

      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        {showSubtext && <div className="h-3 bg-gray-200 rounded w-1/2"></div>}
      </div>

      {showActions && (
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
      )}
    </div>
  );
}
