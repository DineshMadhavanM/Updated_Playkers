import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, MapPin, Users, Clock, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import CricketTeamRoster, { Player } from "@/components/cricket-team-roster";
import type { Team } from "@shared/schema";

const matchSchema = z.object({
  title: z.string().min(1, "Match title is required"),
  sport: z.string().min(1, "Sport is required"),
  matchType: z.string().min(1, "Match type is required"),
  customOvers: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  scheduledAt: z.string().min(1, "Date and time is required"),
  duration: z.number().min(30, "Duration must be at least 30 minutes"),
  maxPlayers: z.number().min(2, "Must have at least 2 players"),
  isPublic: z.boolean(),
  team1Name: z.string().min(1, "Team 1 name is required"),
  team2Name: z.string().min(1, "Team 2 name is required"),
  description: z.string().optional(),
});

const sportOptions = [
  {
    value: "cricket",
    label: "Cricket",
    types: ["Custom Match", "10 Overs", "20 Overs", "30 Overs", "50 Overs", "Test"]
  },
  { value: "football", label: "Football", types: ["90 min", "60 min", "7-a-side", "5-a-side"] },
  { value: "volleyball", label: "Volleyball", types: ["Best of 3", "Best of 5", "Time-based"] },
  { value: "tennis", label: "Tennis", types: ["Singles", "Doubles", "Mixed Doubles"] },
  { value: "kabaddi", label: "Kabaddi", types: ["Pro Kabaddi", "Circle Style", "Beach Kabaddi"] },
];

const regions = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Trichy",
  "Salem",
  "Tirunelveli",
  "Erode",
  "Vellore"
];

export default function CreateMatch() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedSport, setSelectedSport] = useState("");
  const [team1Roster, setTeam1Roster] = useState<Player[]>([]);
  const [team2Roster, setTeam2Roster] = useState<Player[]>([]);
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledSport = urlParams.get('sport');
  const prefilledTeam1Id = urlParams.get('team1');
  const prefilledTeam2Id = urlParams.get('team2');

  const team1Id = prefilledTeam1Id || "";
  const team2Id = prefilledTeam2Id || "";

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const form = useForm<z.infer<typeof matchSchema>>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      title: "",
      sport: "",
      matchType: "",
      region: "",
      scheduledAt: "",
      duration: 120,
      maxPlayers: 22,
      isPublic: true,
      team1Name: "",
      team2Name: "",
      description: "",
      customOvers: "",
    },
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["/api/venues"],
    enabled: isAuthenticated,
  });

  // Fetch pre-filled teams if provided in URL
  const { data: prefilledTeam1 } = useQuery({
    queryKey: ['/api/teams', prefilledTeam1Id],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${prefilledTeam1Id}`);
      if (!response.ok) throw new Error('Failed to fetch team 1');
      return response.json();
    },
    enabled: isAuthenticated && !!prefilledTeam1Id && prefilledTeam1Id !== "undefined",
  });

  const { data: prefilledTeam2 } = useQuery({
    queryKey: ['/api/teams', prefilledTeam2Id],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${prefilledTeam2Id}`);
      if (!response.ok) throw new Error('Failed to fetch team 2');
      return response.json();
    },
    enabled: isAuthenticated && !!prefilledTeam2Id && prefilledTeam2Id !== "undefined",
  });

  // Fetch players for Team 1 — key includes 'team1' to avoid RQ cache collision with team2
  const { data: team1Players = [], isLoading: team1PlayersLoading } = useQuery({
    queryKey: ['/api/players', 'team1', team1Id],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch(`/api/players?teamId=${team1Id}`);
      if (!response.ok) throw new Error('Failed to fetch team 1 players');
      return response.json();
    },
    enabled: isAuthenticated && !!team1Id && team1Id !== 'undefined',
  });

  // Fetch players for Team 2 — key includes 'team2' to avoid RQ cache collision with team1
  const { data: team2Players = [], isLoading: team2PlayersLoading } = useQuery({
    queryKey: ['/api/players', 'team2', team2Id],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch(`/api/players?teamId=${team2Id}`);
      if (!response.ok) throw new Error('Failed to fetch team 2 players');
      return response.json();
    },
    enabled: isAuthenticated && !!team2Id && team2Id !== 'undefined',
  });

  // Helper function to map database Player to CricketTeamRoster Player
  const mapDatabasePlayerToRosterPlayer = (dbPlayer: any): Player => ({
    id: dbPlayer.id,
    name: dbPlayer.name,
    email: dbPlayer.email || '',
    role: 'player', // Default role, can be changed in roster
    position: dbPlayer.position || 0, // Preserve position from database or caller
    battingStyle: dbPlayer.battingStyle || undefined,
    bowlingStyle: dbPlayer.bowlingStyle || undefined,
    isRegisteredUser: dbPlayer.userId ? true : false,
    userId: dbPlayer.userId || undefined,
  });

  useEffect(() => {
    if (prefilledTeam1) {
      form.setValue('team1Name', prefilledTeam1.name);
    }
  }, [prefilledTeam1, form]);

  useEffect(() => {
    if (prefilledTeam2) {
      form.setValue('team2Name', prefilledTeam2.name);
    }
  }, [prefilledTeam2, form]);

  // Initialize team rosters with available players when players are fetched
  useEffect(() => {
    if (team1Id && team1Players.length > 0) {
      const mappedPlayers = team1Players.map((player, index) =>
        mapDatabasePlayerToRosterPlayer({ ...player, position: index + 1 })
      );
      setTeam1Roster(mappedPlayers.slice(0, 15)); // Limit to 15 players
    }
  }, [team1Id, team1Players]);

  useEffect(() => {
    if (team2Id && team2Players.length > 0) {
      const mappedPlayers = team2Players.map((player, index) =>
        mapDatabasePlayerToRosterPlayer({ ...player, position: index + 1 })
      );
      setTeam2Roster(mappedPlayers.slice(0, 15)); // Limit to 15 players
    }
  }, [team2Id, team2Players]);

  const createMatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const matchData = {
        ...data,
        scheduledAt: new Date(data.scheduledAt), // Send Date object, not ISO string
        venueId: "temp-venue", // Temporary - will be handled by backend
      };

      const matchResponse = await apiRequest("POST", "/api/matches", matchData);
      return matchResponse.json();
    },
    onSuccess: (match) => {
      toast({
        title: "Success",
        description: "Match created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      setLocation(`/match/${match.id}/score`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create match. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const selectedSportData = sportOptions.find(sport => sport.value === selectedSport);

  const onSubmit = (data: z.infer<typeof matchSchema>) => {
    // Validate cricket team rosters
    if (selectedSport === "cricket") {
      if (team1Roster.length < 3 || team2Roster.length < 3) {
        toast({
          title: "Incomplete team rosters",
          description: "Each cricket team must have at least 3 players to create the match.",
          variant: "destructive",
        });
        return;
      }

      if (team1Roster.length > 15 || team2Roster.length > 15) {
        toast({
          title: "Too many players",
          description: "Each cricket team can have a maximum of 15 players.",
          variant: "destructive",
        });
        return;
      }

      // Check for required roles (captain or captain-wicket-keeper)
      const team1Captain = team1Roster.find(p => p.role === "captain" || p.role === "captain-wicket-keeper");
      const team2Captain = team2Roster.find(p => p.role === "captain" || p.role === "captain-wicket-keeper");
      const team1WicketKeeper = team1Roster.find(p =>
        p.role === "wicket-keeper" ||
        p.role === "captain-wicket-keeper" ||
        p.role === "vice-captain-wicket-keeper"
      );
      const team2WicketKeeper = team2Roster.find(p =>
        p.role === "wicket-keeper" ||
        p.role === "captain-wicket-keeper" ||
        p.role === "vice-captain-wicket-keeper"
      );

      if (!team1Captain || !team2Captain) {
        toast({
          title: "Missing captains",
          description: "Both teams must have a designated captain.",
          variant: "destructive",
        });
        return;
      }

      if (!team1WicketKeeper || !team2WicketKeeper) {
        toast({
          title: "Missing wicket keepers",
          description: "Both teams must have a designated wicket keeper.",
          variant: "destructive",
        });
        return;
      }
    }

    const { customOvers, ...restData } = data;
    const finalMatchType = data.matchType === "Custom Match" && customOvers
      ? `${customOvers} Overs`
      : data.matchType;

    const dataToSubmit = {
      ...restData,
      matchType: finalMatchType
    };

    // Include roster data in the submission for cricket matches
    const matchData = selectedSport === "cricket"
      ? {
        ...dataToSubmit,
        matchData: {
          team1Id: prefilledTeam1Id || undefined,
          team2Id: prefilledTeam2Id || undefined,
          team1Roster: team1Roster.map(player => ({
            playerId: player.id,
            name: player.name,
            role: player.role,
            battingStyle: player.battingStyle,
            bowlingStyle: player.bowlingStyle,
            position: player.position,
            isRegisteredUser: player.isRegisteredUser,
            userId: player.userId,
          })),
          team2Roster: team2Roster.map(player => ({
            playerId: player.id,
            name: player.name,
            role: player.role,
            battingStyle: player.battingStyle,
            bowlingStyle: player.bowlingStyle,
            position: player.position,
            isRegisteredUser: player.isRegisteredUser,
            userId: player.userId,
          })),
          sport: "cricket"
        }
      }
      : dataToSubmit;

    createMatchMutation.mutate(matchData);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="create-match-page">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Match</h1>
          <p className="text-muted-foreground">
            Set up a new match and invite players to join your game.
          </p>
        </div>


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Match Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">


                {/* Basic Match Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Match Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Weekend Cricket Match"
                            data-testid="input-match-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedSport(value);
                            form.setValue("matchType", "");
                          }}
                          value={field.value || selectedSport}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-sport">
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sportOptions.map((sport) => (
                              <SelectItem key={sport.value} value={sport.value}>
                                {sport.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="matchType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Match Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value !== "Custom Match") {
                              form.setValue("customOvers", "");
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-match-type">
                              <SelectValue placeholder="Select match type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedSportData?.types.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("matchType") === "Custom Match" && (
                    <FormField
                      control={form.control}
                      name="customOvers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Overs</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="Enter number of overs"
                              data-testid="input-custom-overs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}


                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-region">
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {regions.map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Team Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="team1Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 1 Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Team Warriors"
                            data-testid="input-team1-name"
                            onChange={(e) => {
                              field.onChange(e);
                              const t2 = form.getValues("team2Name");
                              if (e.target.value && t2) {
                                form.setValue("title", `${e.target.value} vs ${t2}`);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="team2Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 2 Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Team Champions"
                            data-testid="input-team2-name"
                            onChange={(e) => {
                              field.onChange(e);
                              const t1 = form.getValues("team1Name");
                              if (t1 && e.target.value) {
                                form.setValue("title", `${t1} vs ${e.target.value}`);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Schedule and Duration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="datetime-local"
                            data-testid="input-scheduled-at"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxPlayers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Players</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-players"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Show rosters for Cricket */}
                {selectedSport === "cricket" && (
                  <div className="space-y-6 pt-6 border-t">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <CricketTeamRoster
                        teamName={form.watch("team1Name") || "Team 1"}
                        teamNumber={1}
                        players={team1Roster}
                        onPlayersChange={setTeam1Roster}
                      />

                      <CricketTeamRoster
                        teamName={form.watch("team2Name") || "Team 2"}
                        teamNumber={2}
                        players={team2Roster}
                        onPlayersChange={setTeam2Roster}
                      />
                    </div>

                    {/* Roster Validation Messages */}
                    {(team1Roster.length < 3 || team2Roster.length < 3) && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Each team needs at least 3 players to start the cricket match.
                          Team 1 has {team1Roster.length} players, Team 2 has {team2Roster.length} players.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Match Visibility */}
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Match</FormLabel>
                        <FormDescription>
                          Allow anyone to join this match. Turn off to make it invite-only.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-public"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Additional details about the match, skill level requirements, equipment needed, etc."
                          className="min-h-[100px]"
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={createMatchMutation.isPending}
                    className="flex-1"
                    data-testid="button-create-match"
                  >
                    {createMatchMutation.isPending ? "Creating..." : "Create Match"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/matches')}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
