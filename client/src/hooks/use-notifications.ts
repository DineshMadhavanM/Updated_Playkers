import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

/**
 * useNotifications
 *
 * Polls the unread notification count every 15 seconds. When the count
 * increases compared to the previous poll, it fires a toast alert so the
 * user is notified even when the dropdown is closed.
 *
 * Usage: call this hook once at the top of your root layout / nav so it
 * runs continuously while the user is logged in.
 */
export function useNotifications() {
    const { isAuthenticated } = useAuth();
    const { toast } = useToast();
    const prevCountRef = useRef<number | null>(null);

    const { data } = useQuery<{ count: number }>({
        queryKey: ["/api/notifications/unread-count"],
        enabled: isAuthenticated,
        refetchInterval: 15000, // poll every 15 seconds
        refetchIntervalInBackground: false,
    });

    const count = data?.count ?? 0;

    useEffect(() => {
        if (!isAuthenticated) return;

        // First load – set baseline without toasting
        if (prevCountRef.current === null) {
            prevCountRef.current = count;
            return;
        }

        // New notifications arrived since last poll
        if (count > prevCountRef.current) {
            const delta = count - prevCountRef.current;
            toast({
                title: "🔔 New notification",
                description:
                    delta === 1
                        ? "You have 1 new notification. Open the bell menu to view it."
                        : `You have ${delta} new notifications. Open the bell menu to view them.`,
                duration: 5000,
            });
        }

        prevCountRef.current = count;
    }, [count, isAuthenticated, toast]);

    return { unreadCount: count };
}
