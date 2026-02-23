import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, X, MapPin, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

export default function NotificationsDropdown() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "read" | "accepted" | "declined" }) => {
      const response = await apiRequest("PATCH", `/api/notifications/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification",
        variant: "destructive",
      });
    },
  });

  // Automatically mark booking_accepted notifications as read when dropdown is open
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      notifications.forEach(n => {
        if (n.type === "booking_accepted" && n.status === "unread") {
          updateStatusMutation.mutate({ id: n.id, status: "read" });
        }
      });
    }
  }, [isOpen, notifications, updateStatusMutation]);

  const acceptNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/notifications/${id}/accept`);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Request accepted",
        description: "The sender has been notified with your contact details",
      });

      // Handle match request redirection
      if (data.matchRequestData) {
        const { team1Id, team2Id, matchType, sport: dataSport } = data.matchRequestData;
        const sport = dataSport || "cricket";
        const params = new URLSearchParams();
        params.set('sport', sport);
        if (team1Id) params.set('team1', team1Id);
        if (team2Id) params.set('team2', team2Id);
        navigate(`/create-match?${params.toString()}`);
        setIsOpen(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept notification",
        variant: "destructive",
      });
    },
  });

  const acceptBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/notifications/${id}/accept-booking`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking accepted",
        description: "The user has been notified of your acceptance",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept booking",
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/notifications/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Notification deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const handleAccept = (id: string) => {
    acceptNotificationMutation.mutate(id);
  };

  const handleDecline = (id: string) => {
    updateStatusMutation.mutate({ id, status: "declined" });
  };

  const handleMarkAsRead = (id: string) => {
    if (notifications.find(n => n.id === id)?.status === "unread") {
      updateStatusMutation.mutate({ id, status: "read" });
    }
  };

  const unreadCount = unreadCountData?.count || 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-notification-count"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Match Requests</h3>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "No new requests"}
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" data-testid="text-no-notifications">
            No match requests yet
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-0 rounded-none ${notification.status === "unread" ? "bg-accent/20" : ""}`}
                onClick={() => handleMarkAsRead(notification.id)}
                data-testid={`notification-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{notification.senderName}</p>
                          {notification.type === "booking_request" && (
                            <Badge variant="outline" className="text-[10px] h-4 bg-primary/10 text-primary border-primary/20">
                              Booking
                            </Badge>
                          )}
                          {notification.type === "booking_accepted" && (
                            <Badge variant="outline" className="text-[10px] h-4 bg-green-500/10 text-green-600 border-green-500/20">
                              Accepted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.senderEmail}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.senderPhone}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex gap-2 text-sm">
                      {notification.matchType && (
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span>{notification.matchType}</span>
                        </div>
                      )}
                      {notification.senderPlace && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{notification.senderPlace}</span>
                        </div>
                      )}
                      {notification.preferredTiming && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{notification.preferredTiming}</span>
                        </div>
                      )}
                      {!notification.senderPlace && !notification.preferredTiming && notification.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{notification.location}</span>
                        </div>
                      )}
                    </div>

                    {notification.message && (
                      <p className="text-sm text-muted-foreground italic">
                        "{notification.message}"
                      </p>
                    )}

                    {notification.status === "unread" || notification.status === "read" ? (
                      notification.type !== "booking_accepted" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notification.type === "booking_request") {
                                acceptBookingMutation.mutate(notification.id);
                              } else {
                                handleAccept(notification.id);
                              }
                            }}
                            className="flex-1"
                            data-testid={`button-accept-${notification.id}`}
                            disabled={acceptBookingMutation.isPending || acceptNotificationMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecline(notification.id);
                            }}
                            className="flex-1"
                            data-testid={`button-decline-${notification.id}`}
                            disabled={updateStatusMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )
                    ) : (
                      <div className="pt-2">
                        <Badge
                          variant={notification.status === "accepted" ? "default" : "secondary"}
                        >
                          {notification.status === "accepted" ? "Accepted" : "Declined"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
