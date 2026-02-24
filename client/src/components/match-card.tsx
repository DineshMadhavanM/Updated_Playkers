import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Share, Eye, Trophy, Award, Target, Footprints, Activity } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MatchScorecardDialog from "@/components/match-scorecard-dialog";
import { Link } from "wouter";
import type { Match, PlayerPerformance } from "@shared/schema";

interface MatchCardProps {
  match: Match;
  showActions?: boolean;
  teamStats?: {
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    matchesDrawn: number;
    winRate: number;
    tournamentPoints: number;
  };
  performance?: PlayerPerformance;
}

const sportEmojis: Record<string, string> = {
  cricket: "🏏",
  football: "⚽",
  volleyball: "🏐",
  tennis: "🎾",
  kabaddi: "🤼",
};

export default function MatchCard({ match, showActions = true, teamStats, performance }: MatchCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinMatchMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/matches/${match.id}/join`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have joined the match!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
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
        description: "Failed to join match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const canJoinMatch = match.isPublic && match.status === 'upcoming' &&
    (match.currentPlayers || 0) < (match.maxPlayers || 0);

  // Helper to check if this performance includes a specific award
  const hasAward = (awardType: string) => {
    return performance?.awards?.includes(awardType);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-primary/10 overflow-hidden relative" data-testid={`card-match-${match.id}`}>
      {/* Visual indicator for winning/completed matches */}
      {match.status === 'completed' && (
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
          <div className="absolute top-[-5px] right-[-30px] w-[100px] h-[30px] rotate-45 bg-primary/10 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-primary opacity-50" />
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <MatchScorecardDialog match={match} teamStats={teamStats}>
          <div className="p-6 cursor-pointer" data-testid={`clickable-match-${match.id}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-2xl shadow-inner">
                  {sportEmojis[match.sport] || "🏃"}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight" data-testid={`text-match-title-${match.id}`}>
                    {match.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] font-medium py-0 h-4 uppercase tracking-wider bg-muted/30">
                      {match.matchType}
                    </Badge>
                    <span className="text-muted-foreground text-xs font-medium">
                      {match.isPublic ? "Public Match" : "Private Match"}
                    </span>
                  </div>
                </div>
              </div>
              <Badge
                className={`py-1 px-3 ${match.status === 'live' ? "bg-red-500 hover:bg-red-600 animate-pulse" :
                  match.status === 'completed' ? "bg-green-600 hover:bg-green-700" : ""
                  }`}
                variant={match.status === 'upcoming' ? "default" : "secondary"}
                data-testid={`badge-match-status-${match.id}`}
              >
                {match.status === 'upcoming' ? (match.isPublic ? "Open" : "Invite Only") : match.status}
              </Badge>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 mb-4 border border-border/50">
              {match.team1Name && match.team2Name ? (
                <div className="flex justify-between items-center px-2">
                  <div className="text-center flex-1">
                    <p className="font-bold text-sm md:text-base truncate" data-testid={`text-team1-${match.id}`}>
                      {match.team1Name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tighter">Team 1</p>
                  </div>
                  <div className="mx-4 flex flex-col items-center">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1">vs</div>
                    <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-bold text-sm md:text-base truncate" data-testid={`text-team2-${match.id}`}>
                      {match.team2Name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tighter">Team 2</p>
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4 text-primary/70" />
                    <span className="font-semibold text-sm">
                      {match.currentPlayers || 0} / {match.maxPlayers} players
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((match.currentPlayers || 0) / (match.maxPlayers || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Individual Performance Section */}
            {performance && (
              <div className="mb-4 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">My Performance</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Batting Stat */}
                  <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="h-3 w-3 text-primary/70" />
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Batting</span>
                    </div>
                    <p className="text-sm font-bold">
                      {performance.battingStats ? (
                        <>{performance.battingStats.runs}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">({performance.battingStats.balls})</span></>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </p>
                  </div>

                  {/* Bowling Stat */}
                  <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Footprints className="h-3 w-3 text-primary/70" />
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Bowling</span>
                    </div>
                    <p className="text-sm font-bold">
                      {performance.bowlingStats ? (
                        <>{performance.bowlingStats.wickets}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">/{performance.bowlingStats.runs}</span></>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </p>
                  </div>

                  {/* Awards/Summary */}
                  <div className="bg-amber-500/5 rounded-lg p-2 border border-amber-500/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Award className="h-3 w-3 text-amber-500/70" />
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Awards</span>
                    </div>
                    <div className="flex gap-1">
                      {performance.awards && performance.awards.length > 0 ? (
                        performance.awards.map((award, idx) => (
                          <Trophy key={idx} className="h-3.5 w-3.5 text-amber-500" />
                        ))
                      ) : (
                        <span className="text-muted-foreground/50 text-[10px]">None</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specific Award Badges */}
                {performance.awards && performance.awards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {performance.awards.map((award, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[9px] px-1.5 py-0 capitalize">
                        <Trophy className="h-2.5 w-2.5 mr-1" />
                        {award.replace(/-/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2.5">
              <div className="flex items-center text-xs font-medium text-muted-foreground group">
                <Calendar className="h-3.5 w-3.5 mr-2 text-primary/60 group-hover:text-primary transition-colors" />
                <span data-testid={`text-match-date-${match.id}`}>
                  {formatDate(match.scheduledAt)}
                </span>
              </div>
              <div className="flex items-center text-xs font-medium text-muted-foreground group">
                <MapPin className="h-3.5 w-3.5 mr-2 text-primary/60 group-hover:text-primary transition-colors" />
                <span className="truncate" data-testid={`text-match-venue-${match.id}`}>
                  Venue ID: {match.venueId}
                </span>
              </div>
            </div>
          </div>
        </MatchScorecardDialog>

        {showActions && (
          <div className="flex gap-2 p-6 pt-0 border-t border-border/5 bg-muted/10">
            {match.status === 'live' || match.status === 'completed' ? (
              <Link href={`/match/${match.id}/spectate`} className="flex-1">
                <Button
                  className="w-full shadow-sm"
                  variant={match.status === 'live' ? "default" : "outline"}
                  data-testid={`button-watch-match-${match.id}`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {match.status === 'live' ? "Watch Live" : "View Results"}
                </Button>
              </Link>
            ) : canJoinMatch ? (
              <Button
                className="flex-1 shadow-md hover:shadow-lg transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  joinMatchMutation.mutate();
                }}
                disabled={joinMatchMutation.isPending}
                data-testid={`button-join-match-${match.id}`}
              >
                {joinMatchMutation.isPending ? "Joining..." : "Join Match"}
              </Button>
            ) : (
              <Button
                className="flex-1 opacity-70"
                variant="outline"
                disabled
                data-testid={`button-match-full-${match.id}`}
              >
                {match.isPublic ? "Match Full" : "Private Match"}
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 hover:bg-primary/5 active:scale-95 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                // Share logic here
              }}
              data-testid={`button-share-match-${match.id}`}
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
