import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export default function UnreadBadge() {
  const { user } = useAuth();

  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = unreadData?.unreadCount || 0;

  if (!user || unreadCount === 0) {
    return null;
  }

  return (
    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
