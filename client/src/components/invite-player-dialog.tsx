import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Copy, Mail, Link as LinkIcon, UserPlus, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InvitePlayerDialogProps {
  invitationType?: "match" | "team";
  matchId?: string;
  teamId?: string;
  matchTitle?: string;
  teamName?: string;
  trigger?: React.ReactNode;
}

export default function InvitePlayerDialog({
  invitationType,
  matchId,
  teamId,
  matchTitle,
  teamName,
  trigger,
}: InvitePlayerDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [invitationView, setInvitationView] = useState<'sent' | 'received'>('sent');

  // Base fields for all invitations
  const baseSchema = z.object({
    email: z.string().email("Valid email is required"),
    message: z.string().optional(),
  });

  // Dynamic schema using discriminated union for strict separation
  const matchFields = z.object({
    invitationType: z.literal("match"),
    matchType: z.enum(["Friendly", "League"]).optional(),
    matchId: z.string().optional(),
    teamId: z.any().optional(),
  });

  const teamFields = z.object({
    invitationType: z.literal("team"),
    teamId: z.string().optional(),
    matchType: z.any().optional(),
    matchId: z.any().optional(),
  });

  const inviteFormSchema = z.intersection(
    baseSchema,
    z.discriminatedUnion("invitationType", [matchFields, teamFields])
  ).refine((data) => {
    if (data.invitationType === "match") {
      return !!(matchId || data.matchId || data.matchType);
    }
    if (data.invitationType === "team") {
      return !!(teamId || data.teamId);
    }
    return true;
  }, {
    message: "Required information missing for the selected invitation type"
  });

  type InviteFormData = z.infer<typeof inviteFormSchema>;

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      message: "",
      invitationType: (invitationType || "match") as any,
      matchType: undefined,
      matchId: matchId || undefined,
      teamId: teamId || undefined,
    } as any,
  });

  // Watch the invitationType field to conditionally fetch matches or teams
  const selectedInvitationType = form.watch("invitationType");

  // Fetch available matches for selection
  const { data: matches = [] } = useQuery<any[]>({
    queryKey: ["/api/matches"],
    enabled: isOpen && !matchId && selectedInvitationType === "match",
  });

  // Fetch available teams for selection
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
    enabled: isOpen && !teamId && selectedInvitationType === "team",
  });

  // Build query URL for invitations
  const getInvitationsUrl = (view: 'sent' | 'received') => {
    const params = new URLSearchParams();

    // Add type parameter for sent/received view
    if (view === 'received') {
      params.append("type", "received");
    }

    if (matchId) params.append("matchId", matchId);
    if (teamId) params.append("teamId", teamId);

    const queryString = params.toString();
    return queryString ? `/api/invitations?${queryString}` : "/api/invitations";
  };

  // Fetch existing invitations (always fetch when dialog is open to show user's invitations)
  const { data: invitations = [], isLoading: isLoadingInvitations } = useQuery<any[]>({
    queryKey: [getInvitationsUrl(invitationView)],
    enabled: isOpen,
  });

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const payload: any = {
        email: data.email,
        message: data.message,
        invitationType: data.invitationType,
      };

      if (data.invitationType === "match") {
        // EXPLICITLY handle match invitation
        const finalMatchId = matchId || data.matchId;
        if (finalMatchId) {
          payload.matchId = finalMatchId;
          const match = matches.find((m: any) => m.id === finalMatchId);
          payload.matchTitle = matchTitle || match?.title;
        } else if (data.matchType) {
          payload.matchType = data.matchType;
          payload.matchTitle = `${data.matchType} Match`;
        }
        // Ensure no team data leaks into match invitation
        delete payload.teamId;
        delete payload.teamName;
      } else if (data.invitationType === "team") {
        // EXPLICITLY handle team invitation
        const finalTeamId = teamId || data.teamId;
        if (finalTeamId) {
          payload.teamId = finalTeamId;
          const team = teams.find((t: any) => t.id === finalTeamId);
          payload.teamName = teamName || team?.name;
        }
        // Ensure no match data leaks into team invitation
        delete payload.matchId;
        delete payload.matchType;
        delete payload.matchTitle;
      }

      const response = await apiRequest("POST", "/api/invitations", payload);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all invitation queries to ensure fresh data
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].startsWith('/api/invitations')
      });
      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${form.getValues("email")}`,
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Revoke invitation mutation
  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await apiRequest("DELETE", `/api/invitations/${invitationId}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all invitation queries to ensure fresh data
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].startsWith('/api/invitations')
      });
      toast({
        title: "Invitation revoked",
        description: "The invitation has been revoked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke invitation",
        variant: "destructive",
      });
    },
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (params: { token: string; invitationType: string; targetName: string }) => {
      const response = await apiRequest("POST", `/api/invitations/${params.token}/accept`, {});
      return { ...await response.json(), invitationType: params.invitationType, targetName: params.targetName };
    },
    onSuccess: (data) => {
      // Invalidate all invitation queries to ensure fresh data
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].startsWith('/api/invitations')
      });
      const targetType = data.invitationType === "match" ? "match" : "team";
      toast({
        title: "Invitation accepted!",
        description: `You have successfully joined ${data.targetName || `the ${targetType}`}`,
      });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: InviteFormData) => {
    createInvitationMutation.mutate(data);
  };

  const copyToClipboard = async (text: string, invitationId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(invitationId);
      toast({
        title: "Link copied!",
        description: "Invitation link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "accepted":
        return "default";
      case "expired":
        return "secondary";
      case "revoked":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-invite-player">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Player
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-invite-player">
        <DialogHeader>
          <DialogTitle>
            {invitationType === "match" && matchTitle
              ? `Invite Players to ${matchTitle}`
              : invitationType === "team" && teamName
                ? `Invite Players to ${teamName}`
                : "Invite Player"}
          </DialogTitle>
          <DialogDescription>
            {matchId || teamId
              ? "Send email invitations or share a link for players to join"
              : "Send an email invitation to a player"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" data-testid="tab-email-invite">Email Invitation</TabsTrigger>
            <TabsTrigger value="manage" data-testid="tab-manage-invites">Manage Invites</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* INVITATION TYPE SELECTOR (Only if not fixed by props) */}
                {(!invitationType && !matchId && !teamId) ? (
                  <FormField
                    control={form.control}
                    name="invitationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invitation Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-invitation-type">
                              <SelectValue placeholder="Select invitation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="match" data-testid="option-match">Match Invitation</SelectItem>
                            <SelectItem value="team" data-testid="option-team">Team Invitation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {/* MATCH SPECIFIC FIELDS */}
                {((invitationType === "match" || selectedInvitationType === "match") && !matchId) && (
                  <FormField
                    control={form.control}
                    name="matchType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Match Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-match-type">
                              <SelectValue placeholder="Select match type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Friendly" data-testid="option-friendly">Friendly</SelectItem>
                            <SelectItem value="League" data-testid="option-league">League</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* TEAM SPECIFIC FIELDS */}
                {((invitationType === "team" || selectedInvitationType === "team") && !teamId) && (
                  <FormField
                    control={form.control}
                    name="teamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Team</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-team">
                              <SelectValue placeholder="Select a team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teams.map((team: any) => (
                              <SelectItem key={team.id} value={team.id} data-testid={`option-team-${team.id}`}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="player@example.com"
                          data-testid="input-invite-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Add a personal message to the invitation..."
                          rows={3}
                          data-testid="input-invite-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createInvitationMutation.isPending}
                  className="w-full"
                  data-testid="button-send-invite"
                >
                  {createInvitationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={invitationView === 'sent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInvitationView('sent')}
                data-testid="button-view-sent"
              >
                Sent Invitations
              </Button>
              <Button
                variant={invitationView === 'received' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInvitationView('received')}
                data-testid="button-view-received"
              >
                Received Invitations
              </Button>
            </div>

            {isLoadingInvitations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : invitations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    {invitationView === 'sent'
                      ? "No invitations yet. Send your first invitation using the email tab."
                      : "No invitations received yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <Card key={invitation.id} data-testid={`invitation-${invitation.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {invitation.email}
                          </CardTitle>
                          <div className="space-y-1 mt-1">
                            <p className="text-sm text-muted-foreground">
                              Sent {new Date(invitation.createdAt).toLocaleDateString()}
                            </p>
                            {invitation.invitationType && (
                              <p className="text-sm text-muted-foreground">
                                Type: <span className="font-medium capitalize">{invitation.invitationType}</span>
                                {invitation.invitationType === "match" && (invitation.matchType || invitation.matchTitle) && (
                                  <span> - {invitation.matchType || invitation.matchTitle}</span>
                                )}
                                {invitation.invitationType === "team" && invitation.teamName && (
                                  <span> - {invitation.teamName}</span>
                                )}
                              </p>
                            )}
                            {invitation.inviterName && (
                              <div className="text-sm text-muted-foreground">
                                <p>Invited by: {invitation.inviterName}</p>
                                {invitation.inviterId && (
                                  <p className="text-xs" data-testid={`text-sender-id-${invitation.id}`}>
                                    Sender ID: <span className="font-mono font-medium">{invitation.inviterId}</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant={getStatusColor(invitation.status)}>
                          {invitation.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {invitation.status === "pending" && (
                        <div className="space-y-2">
                          {invitationView === 'sent' ? (
                            <>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={invitation.invitationLink}
                                  readOnly
                                  className="text-sm"
                                  data-testid={`input-link-${invitation.id}`}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    copyToClipboard(invitation.invitationLink, invitation.id)
                                  }
                                  data-testid={`button-copy-${invitation.id}`}
                                >
                                  {copiedLink === invitation.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                                disabled={revokeInvitationMutation.isPending}
                                data-testid={`button-revoke-${invitation.id}`}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Revoke
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                if (!invitation.token) {
                                  toast({
                                    title: "Error",
                                    description: "Invalid invitation token",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                acceptInvitationMutation.mutate({
                                  token: invitation.token,
                                  invitationType: invitation.invitationType,
                                  targetName: invitation.invitationType === "match" ? invitation.matchTitle || "the match" : invitation.teamName || "the team"
                                });
                              }}
                              disabled={acceptInvitationMutation.isPending}
                              data-testid={`button-accept-${invitation.id}`}
                            >
                              {acceptInvitationMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Accept Invitation
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                      {invitation.status === "accepted" && invitation.acceptedAt && (
                        <div className="space-y-2 bg-muted/50 p-3 rounded-md">
                          <p className="text-sm font-medium text-foreground">
                            ✓ Accepted on {new Date(invitation.acceptedAt).toLocaleDateString()}
                          </p>
                          <div className="space-y-1 text-sm">
                            {invitation.acceptedByUserId && (
                              <p className="text-muted-foreground" data-testid={`text-receiver-user-id-${invitation.id}`}>
                                Receiver User ID: <span className="font-mono font-medium text-foreground">{invitation.acceptedByUserId}</span>
                              </p>
                            )}
                            {invitation.acceptedByPlayerId && (
                              <p className="text-muted-foreground" data-testid={`text-receiver-player-id-${invitation.id}`}>
                                Receiver Player ID: <span className="font-mono font-medium text-foreground">{invitation.acceptedByPlayerId}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {invitation.status === "expired" && (
                        <p className="text-sm text-muted-foreground">
                          Expired on {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
