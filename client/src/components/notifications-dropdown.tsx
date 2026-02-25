import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Bell, Check, X, MapPin, Trophy, Clock, Trash2,
  CheckCheck, Package, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  type: "match_request" | "booking_request" | "booking_accepted";
  bookingId: string | null;
  matchType: string | null;
  location: string | null;
  senderPlace: string | null;
  preferredTiming: string | null;
  message: string | null;
  status: "unread" | "read" | "accepted" | "declined";
  createdAt: string;
}

const TYPE_META = {
  match_request: {
    label: "Match Request",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <Trophy className="h-3.5 w-3.5" />,
  },
  booking_request: {
    label: "Booking Request",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <Package className="h-3.5 w-3.5" />,
  },
  booking_accepted: {
    label: "Accepted",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
};

export default function NotificationsDropdown() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
  });

  // ── mutations ────────────────────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "read" | "accepted" | "declined" }) => {
      const response = await apiRequest("PATCH", `/api/notifications/${id}/status`, { status });
      return response.json();
    },
    onSuccess: invalidate,
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update notification", variant: "destructive" });
    },
  });

  const acceptNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/notifications/${id}/accept`);
      return response.json();
    },
    onSuccess: (data: any) => {
      invalidate();
      toast({ title: "Request accepted ✅", description: "The sender has been notified." });
      if (data.matchRequestData) {
        const { team1Id, team2Id, matchType, sport: dataSport } = data.matchRequestData;
        const sport = dataSport || "cricket";
        const params = new URLSearchParams();
        params.set("sport", sport);
        if (team1Id) params.set("team1", team1Id);
        if (team2Id) params.set("team2", team2Id);
        navigate(`/create-match?${params.toString()}`);
        setIsOpen(false);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to accept request", variant: "destructive" });
    },
  });

  const acceptBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/notifications/${id}/accept-booking`);
      return response.json();
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking accepted ✅", description: "The user has been notified." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to accept booking", variant: "destructive" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/notifications/${id}`);
      return response.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Notification removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete notification", variant: "destructive" });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/notifications/mark-all-read");
      return response.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "All marked as read" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to mark all as read", variant: "destructive" });
    },
  });

  // Auto-mark booking_accepted as read when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      notifications.forEach((n) => {
        if (n.type === "booking_accepted" && n.status === "unread") {
          updateStatusMutation.mutate({ id: n.id, status: "read" });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, notifications.length]);

  const handleMarkAsRead = (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif?.status === "unread") {
      updateStatusMutation.mutate({ id, status: "read" });
    }
  };

  const unreadCount = unreadCountData?.count ?? 0;
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
          aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className={`h-5 w-5 transition-colors ${hasUnread ? "text-primary" : ""}`} />
          {hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
              data-testid="badge-notification-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {hasUnread ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[480px]">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground"
              data-testid="text-no-notifications"
            >
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs opacity-70">Match and booking requests will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const meta = TYPE_META[notification.type] ?? TYPE_META.match_request;
                const isPending =
                  updateStatusMutation.isPending ||
                  acceptNotificationMutation.isPending ||
                  acceptBookingMutation.isPending ||
                  deleteNotificationMutation.isPending;

                return (
                  <Card
                    key={notification.id}
                    className={`border-0 rounded-none cursor-pointer transition-colors ${notification.status === "unread"
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted/50"
                      }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <CardContent className="p-3.5">
                      {/* Top row: name + type badge + time + delete */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {notification.status === "unread" && (
                            <span className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                          )}
                          <p className="font-semibold text-sm truncate">{notification.senderName}</p>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-[10px] h-4 px-1.5 flex items-center gap-1 ${meta.color}`}
                          >
                            {meta.icon}
                            {meta.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-50 hover:opacity-100 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(notification.id);
                            }}
                            disabled={isPending}
                            aria-label="Delete notification"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Contact info */}
                      <p className="text-xs text-muted-foreground mb-1.5">
                        {notification.senderEmail} · {notification.senderPhone}
                      </p>

                      {/* Details row */}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-1.5">
                        {notification.matchType && (
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" /> {notification.matchType}
                          </span>
                        )}
                        {(notification.senderPlace || notification.location) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {notification.senderPlace || notification.location}
                          </span>
                        )}
                        {notification.preferredTiming && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {notification.preferredTiming}
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      {notification.message && (
                        <p className="text-xs text-muted-foreground italic mb-1.5 line-clamp-2">
                          "{notification.message}"
                        </p>
                      )}

                      {/* Action buttons or status badge */}
                      {notification.type !== "booking_accepted" &&
                        (notification.status === "unread" || notification.status === "read") ? (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notification.type === "booking_request") {
                                acceptBookingMutation.mutate(notification.id);
                              } else {
                                acceptNotificationMutation.mutate(notification.id);
                              }
                            }}
                            disabled={isPending}
                            data-testid={`button-accept-${notification.id}`}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({ id: notification.id, status: "declined" });
                            }}
                            disabled={isPending}
                            data-testid={`button-decline-${notification.id}`}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Decline
                          </Button>
                        </div>
                      ) : notification.status === "accepted" || notification.status === "declined" ? (
                        <div className="mt-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 px-2 flex items-center gap-1 w-fit ${notification.status === "accepted"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {notification.status === "accepted" ? (
                              <><CheckCircle2 className="h-2.5 w-2.5" /> Accepted</>
                            ) : (
                              <><AlertCircle className="h-2.5 w-2.5" /> Declined</>
                            )}
                          </Badge>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
