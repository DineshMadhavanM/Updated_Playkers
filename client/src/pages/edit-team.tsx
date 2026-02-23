import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Users, Save, Loader2, Shield, ShieldCheck, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertTeamSchema } from "@shared/schema";
import type { InsertTeam, Team, Player } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Crown className="h-4 w-4 text-yellow-500" />,
  "co-admin": <ShieldCheck className="h-4 w-4 text-blue-500" />,
  player: <Users className="h-4 w-4 text-gray-400" />,
};

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "co-admin": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  player: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function EditTeam() {
  const params = useParams();
  const teamId = params.id!;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch team data
  const { data: team, isLoading, error } = useQuery({
    queryKey: ['/api/teams', teamId],
    queryFn: async (): Promise<Team> => {
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) throw new Error('Failed to fetch team');
      return response.json();
    },
  });

  // Fetch team players
  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['/api/players', { teamId }],
    queryFn: async (): Promise<Player[]> => {
      const response = await fetch(`/api/players?teamId=${teamId}`);
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    },
    enabled: !!teamId,
  });

  const form = useForm<InsertTeam>({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: {
      name: "",
      sport: "cricket",
      shortName: "",
      description: "",
      city: "",
    },
  });

  // Reset form when team data loads
  if (team && !form.getValues().name) {
    form.reset({
      name: team.name,
      sport: team.sport || "cricket",
      shortName: team.shortName || "",
      description: team.description || "",
      city: team.city || "",
    });
  }

  const updateTeamMutation = useMutation({
    mutationFn: async (teamData: InsertTeam): Promise<Team> => {
      const response = await apiRequest('PUT', `/api/teams/${teamId}`, teamData);
      return response.json();
    },
    onSuccess: (updatedTeam) => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId] });
      toast({
        title: "Team updated successfully!",
        description: `${updatedTeam.name} has been updated.`,
      });
      navigate(`/teams/${teamId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating team",
        description: error.message || "Failed to update team. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to update a player's team role
  const updatePlayerRoleMutation = useMutation({
    mutationFn: async ({ playerId, teamRole }: { playerId: string; teamRole: string }) => {
      const response = await apiRequest('PATCH', `/api/players/${playerId}/team-role`, { teamRole });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players', { teamId }] });
      toast({ title: "Role updated", description: "Player role has been updated." });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating role",
        description: error.message || "Failed to update player role.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTeam) => {
    updateTeamMutation.mutate(data);
  };

  if (isLoading) {
    return <EditTeamSkeleton />;
  }

  if (error || !team) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Team not found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The team you're trying to edit doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/teams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/teams/${teamId}`)}
          className="flex items-center gap-2"
          data-testid="button-back-to-team"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-8 w-8" />
            Edit Team
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Update {team.name}'s information
          </p>
        </div>
      </div>

      {/* Edit Team Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter team name"
                          data-testid="input-team-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sport Selection */}
                <FormField
                  control={form.control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-team-sport">
                            <SelectValue placeholder="Select a sport" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cricket">Cricket</SelectItem>
                          <SelectItem value="football">Football</SelectItem>
                          <SelectItem value="handball">Handball</SelectItem>
                          <SelectItem value="tennis">Tennis</SelectItem>
                          <SelectItem value="kabaddi">Kabaddi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Short Name */}
                <FormField
                  control={form.control}
                  name="shortName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Name (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., NYC"
                          maxLength={4}
                          data-testid="input-team-short-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., New York, Mumbai, London"
                        data-testid="input-team-city"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your team..."
                        rows={4}
                        data-testid="textarea-team-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Team Info Display */}
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Current Team Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800 dark:text-blue-200">
                    <div>
                      <span className="font-semibold">{team.totalMatches || 0}</span>
                      <br />Total Matches
                    </div>
                    <div>
                      <span className="font-semibold">{team.matchesWon || 0}</span>
                      <br />Wins
                    </div>
                    <div>
                      <span className="font-semibold">{team.matchesLost || 0}</span>
                      <br />Losses
                    </div>
                    <div>
                      <span className="font-semibold">{team.tournamentPoints || 0}</span>
                      <br />Points
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={updateTeamMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-submit-team"
                >
                  {updateTeamMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Team...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Team
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/teams/${teamId}`)}
                  disabled={updateTeamMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Team Members - Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Team Members &amp; Roles
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Assign <span className="font-semibold text-yellow-600">Admin</span> or{" "}
            <span className="font-semibold text-blue-600">Co-Admin</span> roles.
            Only Admin and Co-Admin can edit the team and start a match.
          </p>
        </CardHeader>
        <CardContent>
          {playersLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-36" />
                </div>
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No players in this team yet.</p>
              <p className="text-sm mt-1">Add players from the team detail page first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => {
                const currentRole = (player.teamRole as string) || "player";
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar circle */}
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {player.name}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE_STYLES[currentRole]}`}>
                            {ROLE_ICONS[currentRole]}
                            {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {player.role || "No position"} {player.jerseyNumber ? `• #${player.jerseyNumber}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Role selector */}
                    <Select
                      value={currentRole}
                      onValueChange={(newRole) =>
                        updatePlayerRoleMutation.mutate({ playerId: player.id, teamRole: newRole })
                      }
                      disabled={updatePlayerRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="co-admin">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                            Co-Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="player">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            Player
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton component
function EditTeamSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-8 w-24" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-9 w-36" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}