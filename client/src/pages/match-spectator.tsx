import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Navigation from "@/components/navigation";
import CricketScorer from "@/components/scoring/cricket-scorer";
import FootballScorer from "@/components/scoring/football-scorer";
import TennisScorer from "@/components/scoring/tennis-scorer";
import VolleyballScorer from "@/components/scoring/volleyball-scorer";
import KabaddiScorer from "@/components/scoring/kabaddi-scorer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";
import { queryClient } from "@/lib/queryClient";
import { Calendar, MapPin, Users, Eye, RefreshCw, ArrowLeft, Trophy, Award, Activity, Info, Timer, TrendingUp, Target } from "lucide-react";
import { Link } from "wouter";
import type { Match, MatchParticipant } from "@shared/schema";

export default function MatchSpectator() {
  const [, params] = useRoute("/match/:id/spectate");
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { joinMatch, leaveMatch, on, off, isConnected } = useSocket();

  const { data: match, isLoading: matchLoading, refetch } = useQuery<Match>({
    queryKey: ["/api/matches", params?.id],
    enabled: !!params?.id,
    refetchInterval: isConnected ? false : (autoRefresh ? 5000 : false), // Fallback to polling if socket is not connected
  });

  const { data: participants = [] } = useQuery<MatchParticipant[]>({
    queryKey: ["/api/matches", params?.id, "participants"],
    enabled: !!params?.id,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: rosterPlayers = [] } = useQuery<any[]>({
    queryKey: ["/api/matches", params?.id, "roster"],
    enabled: !!params?.id && match?.sport === 'cricket',
    refetchInterval: isConnected ? false : (autoRefresh ? 5000 : false),
  });

  // Socket.io for real-time match updates
  useEffect(() => {
    if (!params?.id) return;

    joinMatch(params.id);

    on("scoreUpdated", (updatedMatch: Match) => {
      console.log("[SOCKET] Received full match update:", updatedMatch);
      queryClient.setQueryData(["/api/matches", params.id], updatedMatch);
      setLastRefresh(new Date());
    });

    return () => {
      leaveMatch(params.id);
      off("scoreUpdated");
    };
  }, [params?.id]);

  // Update last refresh time when data changes
  useEffect(() => {
    if (match) {
      setLastRefresh(new Date());
    }
  }, [match]);

  if (matchLoading) {
    return (
      <div className="min-h-screen bg-background">
        {isAuthenticated && <Navigation />}
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading match...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        {isAuthenticated && <Navigation />}
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">Match not found</p>
            <p className="text-sm text-muted-foreground mt-2">Please check the match ID and try again</p>
          </div>
        </div>
      </div>
    );
  }

  const handleManualRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Match data has been updated",
    });
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast({
      title: autoRefresh ? "Auto-refresh disabled" : "Auto-refresh enabled",
      description: autoRefresh
        ? "You'll need to refresh manually"
        : "Match will update every 5 seconds",
    });
  };

  // Dummy score update handler (not used in spectator mode)
  const handleScoreUpdate = () => {
    // This is a read-only view, so we don't update scores
  };

  const renderScorer = () => {
    const isLive = match.status === 'live';
    const commonProps = {
      match,
      onScoreUpdate: handleScoreUpdate,
      isLive: false, // Always false for spectator mode - disables all scoring controls
    };

    switch (match.sport) {
      case 'cricket':
        return <CricketScorer {...commonProps} rosterPlayers={rosterPlayers} />;
      case 'football':
        return <FootballScorer {...commonProps} rosterPlayers={rosterPlayers} />;
      case 'tennis':
        return <TennisScorer {...commonProps} />;
      case 'volleyball':
        return <VolleyballScorer {...commonProps} />;
      case 'kabaddi':
        return <KabaddiScorer {...commonProps} />;
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">
                Spectator view for {match.sport} is not yet available
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && <Navigation />}
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-6">
          {isAuthenticated && (
            <Link href="/matches">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-matches">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Matches
              </Button>
            </Link>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-3xl font-bold" data-testid="text-match-title">{match.title}</h1>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(match.scheduledAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {match.venueId}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {participants.length} participants
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={match.status === 'live' ? 'default' : match.status === 'completed' ? 'secondary' : 'outline'}
                className={match.status === 'live' ? 'bg-red-500 animate-pulse' : ''}
                data-testid={`badge-status-${match.status}`}
              >
                {match.status === 'live' && '🔴 '}
                {match.status?.toUpperCase() || 'UPCOMING'}
              </Badge>
              <Badge variant="outline" data-testid="text-sport">{match.sport}</Badge>
              <Badge variant="outline" data-testid="text-match-type">{match.matchType}</Badge>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Last updated: </span>
                  <span className="font-medium" data-testid="text-last-refresh">
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
                {(match.status === 'live' || isConnected) && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                    <RefreshCw className={`h-3 w-3 mr-1 ${autoRefresh || isConnected ? 'animate-spin' : ''}`} />
                    {isConnected ? 'Live Socket Connected' : (autoRefresh ? 'Auto-updating' : 'Paused')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  data-testid="button-refresh"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                {match.status === 'live' && (
                  <Button
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                    onClick={toggleAutoRefresh}
                    data-testid="button-toggle-auto-refresh"
                  >
                    {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spectator Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Spectator Mode</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You're viewing this match in read-only mode. {isConnected ? 'Scores update in real-time via WebSocket.' : (match.status === 'live' && 'Scores update automatically every 5 seconds.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" data-testid="text-team1-name">{match.team1Name || 'Team 1'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {participants.filter(p => p.team === 'team1').length} players
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg" data-testid="text-team2-name">{match.team2Name || 'Team 2'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {participants.filter(p => p.team === 'team2').length} players
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Match Status Messages */}
        {match.status === 'upcoming' && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                This match hasn't started yet. It is scheduled for {new Date(match.scheduledAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}

        {(match.status === 'live' || match.status === 'completed') && (
          <div className="space-y-6 mb-8">
            {match.status === 'completed' && (
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950 dark:to-emerald-950">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto animate-bounce" />
                    <div>
                      <h2 className="text-3xl font-black text-green-900 dark:text-green-100 uppercase tracking-tight">
                        {match.matchData?.matchResult || 'Match Completed'}
                      </h2>
                      <p className="text-green-700 dark:text-green-400 font-medium mt-1">
                        Final Score: {match.team1Score?.runs}/{match.team1Score?.wickets} vs {match.team2Score?.runs}/{match.team2Score?.wickets}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Results Tabs */}
            <Tabs defaultValue={match.status === 'live' ? "live-score" : "overview"} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mx-auto mb-8 bg-muted/50 p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
                {match.status === 'live' && (
                  <TabsTrigger value="live-score" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Live Score</TabsTrigger>
                )}
                <TabsTrigger value="scorecard" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Scorecard</TabsTrigger>
                <TabsTrigger value="achievements" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Achievements</TabsTrigger>
                <TabsTrigger value="squads" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Squads</TabsTrigger>
              </TabsList>

              {match.status === 'live' && (
                <TabsContent value="live-score" className="space-y-6">
                  {renderScorer()}
                </TabsContent>
              )}

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Match Info Card */}
                  <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-muted/30 pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                        <Info className="h-4 w-4" /> Match Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Toss</span>
                          <span className="font-semibold text-right">{match.matchData?.tossWinner ? `${match.matchData.tossWinner} won & chose to ${match.matchData.tossDecision}` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Venue</span>
                          <span className="font-semibold text-right">{match.venueId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Format</span>
                          <span className="font-semibold text-right">{match.matchType}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Final Score Summary */}
                  <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-muted/30 pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                        <Activity className="h-4 w-4" /> Final Scores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-8 text-center relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border hidden md:block"></div>
                        <div className="space-y-2">
                          <p className="text-lg font-bold text-primary">{match.team1Name || 'Team 1'}</p>
                          <div className="text-3xl font-black">{match.team1Score?.runs}/{match.team1Score?.wickets}</div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">({match.team1Score?.overs} overs)</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-bold text-primary">{match.team2Name || 'Team 2'}</p>
                          <div className="text-3xl font-black">{match.team2Score?.runs}/{match.team2Score?.wickets}</div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">({match.team2Score?.overs} overs)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="scorecard" className="space-y-8">
                {match.matchData?.inningsData ? (
                  match.matchData.inningsData.sort((a: any, b: any) => a.inningNumber - b.inningNumber).map((inning: any, idx: number) => (
                    <Card key={idx} className="shadow-md overflow-hidden">
                      <CardHeader className="bg-muted/30 border-b py-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            {inning.battingTeam} - Innings {inning.inningNumber}
                          </CardTitle>
                          <Badge variant="secondary" className="px-4 py-1 text-base font-black bg-primary/10 text-primary border-primary/20">
                            {inning.score.runs}/{inning.score.wickets} <span className="text-sm font-normal ml-1 opacity-70">({inning.score.overs} ov)</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {/* Batting Table */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="pl-6 w-[40%] font-bold text-xs uppercase tracking-widest">Batter</TableHead>
                                <TableHead className="text-right font-bold text-xs uppercase tracking-widest">R</TableHead>
                                <TableHead className="text-right font-bold text-xs uppercase tracking-widest">B</TableHead>
                                <TableHead className="text-right font-bold text-xs uppercase tracking-widest">4s</TableHead>
                                <TableHead className="text-right font-bold text-xs uppercase tracking-widest">6s</TableHead>
                                <TableHead className="text-right pr-6 font-bold text-xs uppercase tracking-widest">SR</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {inning.batsmen.map((b: any, i: number) => (
                                <TableRow key={i} className={b.isDismissed ? "bg-muted/10 opacity-80" : "hover:bg-muted/5 transition-colors"}>
                                  <TableCell className="pl-6 font-bold text-slate-900 dark:text-slate-100">
                                    {b.name}
                                    {b.isDismissed && <span className="ml-2 text-[10px] text-muted-foreground font-medium border rounded px-1.5 py-0.5 uppercase tracking-tighter decoration-slate-400">{b.dismissalType || 'out'}</span>}
                                  </TableCell>
                                  <TableCell className="text-right font-black text-slate-900 dark:text-slate-100">{b.runs}</TableCell>
                                  <TableCell className="text-right text-muted-foreground font-medium">{b.balls}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">{b.fours}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">{b.sixes}</TableCell>
                                  <TableCell className="text-right pr-6 font-bold text-blue-600 dark:text-blue-400">{b.strikeRate.toFixed(1)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Bowling Table */}
                        <div className="overflow-x-auto border-t">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="pl-6 w-[40%] font-bold text-xs uppercase tracking-widest">Bowler</TableHead>
                                <TableHead className="text-right font-bold text-xs uppercase tracking-widest">O</TableHead>
                                <TableHead className="text-right font-bold text-xs uppercase tracking-widest">M</TableHead>
                                <TableHead className="text-right font-bold text-xs uppercase tracking-widest">R</TableHead>
                                <TableHead className="text-right font-bold text-xs uppercase tracking-widest">W</TableHead>
                                <TableHead className="text-right pr-6 font-bold text-xs uppercase tracking-widest">Eco</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {inning.bowlers.map((bw: any, i: number) => (
                                <TableRow key={i} className="hover:bg-muted/5 transition-colors">
                                  <TableCell className="pl-6 font-bold text-slate-900 dark:text-slate-100">{bw.name}</TableCell>
                                  <TableCell className="text-right font-black">{bw.oversBowled}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">{bw.maidenOvers}</TableCell>
                                  <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">{bw.runsConceded}</TableCell>
                                  <TableCell className="text-right font-black text-red-600 dark:text-red-400">{bw.wickets}</TableCell>
                                  <TableCell className="text-right pr-6 text-muted-foreground font-medium">{bw.economyRate.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="p-12 text-center border-dashed">
                    <CardContent>
                      <Info className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">Detailed scorecard data is not available for this match.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="squads" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Team 1 Squad */}
                  <Card className="shadow-md overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b py-4">
                      <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-wide">
                        <Users className="h-5 w-5 text-primary" /> {match.team1Name || 'Team 1'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 px-4">
                      <div className="grid grid-cols-1 gap-2">
                        {(match.sport === 'cricket' && rosterPlayers.length > 0 ?
                          rosterPlayers.filter(p => p.team === 'team1') :
                          participants.filter(p => p.team === 'team1')
                        ).map((p: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-muted-foreground/10">
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {p.playerName || p.name || p.userId}
                              {p.role && (p.role === 'captain' || p.role === 'wicket-keeper' || p.role === 'captain-wicket-keeper') && (
                                <span className="ml-2 text-[10px] font-black text-primary border border-primary/30 rounded px-1.5 py-0.5 uppercase tracking-tighter bg-primary/5">
                                  {p.role === 'captain' && 'C'}
                                  {p.role === 'wicket-keeper' && 'WK'}
                                  {p.role === 'captain-wicket-keeper' && 'C & WK'}
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{p.role === 'player' ? '' : p.role}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team 2 Squad */}
                  <Card className="shadow-md overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b py-4">
                      <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-wide">
                        <Users className="h-5 w-5 text-primary" /> {match.team2Name || 'Team 2'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 px-4">
                      <div className="grid grid-cols-1 gap-2">
                        {(match.sport === 'cricket' && rosterPlayers.length > 0 ?
                          rosterPlayers.filter(p => p.team === 'team2') :
                          participants.filter(p => p.team === 'team2')
                        ).map((p: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-muted-foreground/10">
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {p.playerName || p.name || p.userId}
                              {p.role && (p.role === 'captain' || p.role === 'wicket-keeper' || p.role === 'captain-wicket-keeper') && (
                                <span className="ml-2 text-[10px] font-black text-primary border border-primary/30 rounded px-1.5 py-0.5 uppercase tracking-tighter bg-primary/5">
                                  {p.role === 'captain' && 'C'}
                                  {p.role === 'wicket-keeper' && 'WK'}
                                  {p.role === 'captain-wicket-keeper' && 'C & WK'}
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{p.role === 'player' ? '' : p.role}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                <div className="max-w-4xl mx-auto space-y-8">
                  <Card className="shadow-md overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b py-4">
                      <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-wide">
                        <Trophy className="h-5 w-5 text-yellow-500" /> Match Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { label: "Man of the Match", name: match.matchData?.selectedManOfMatch, icon: Trophy, color: "text-yellow-600 bg-yellow-100" },
                          { label: "Best Batsman", name: match.matchData?.selectedBestBatsman, icon: Award, color: "text-blue-600 bg-blue-100" },
                          { label: "Best Bowler", name: match.matchData?.selectedBestBowler, icon: Award, color: "text-red-600 bg-red-100" },
                          { label: "Best Fielder", name: match.matchData?.selectedBestFielder, icon: Award, color: "text-green-600 bg-green-100" },
                        ].map((award, idx) => (
                          <Card key={idx} className="overflow-hidden border-2 border-muted/50 hover:border-primary/30 transition-colors">
                            <div className={`p-4 flex items-center justify-center ${award.color.split(' ')[1]}`}>
                              <award.icon className={`h-8 w-8 ${award.color.split(' ')[0]}`} />
                            </div>
                            <CardContent className="p-4 text-center">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{award.label}</p>
                              <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                                {award.name || "TBA"}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Stats Highlights Fallback */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 shadow-sm">
                          <CardContent className="p-6 text-center">
                            <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Top Score</p>
                            <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{Math.max(match.team1Score?.runs || 0, match.team2Score?.runs || 0)} Runs</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-100 shadow-sm">
                          <CardContent className="p-6 text-center">
                            <Target className="h-6 w-6 text-red-500 mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Max Wickets</p>
                            <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{Math.max(match.team1Score?.wickets || 0, match.team2Score?.wickets || 0)} Wickets</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 shadow-sm">
                          <CardContent className="p-6 text-center">
                            <Timer className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Overs</p>
                            <p className="font-bold text-lg text-slate-900 dark:text-slate-100">Full match played</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="squads" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Team 1 Squad */}
                  <Card className="shadow-md overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b py-4">
                      <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-wide">
                        <Users className="h-5 w-5 text-primary" /> {match.team1Name || 'Team 1'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 px-4">
                      <div className="grid grid-cols-1 gap-2">
                        {(match.sport === 'cricket' && rosterPlayers.length > 0 ?
                          rosterPlayers.filter(p => p.team === 'team1') :
                          participants.filter(p => p.team === 'team1')
                        ).map((p: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-muted-foreground/10">
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {p.playerName || p.name || p.userId}
                              {p.role && (p.role === 'captain' || p.role === 'wicket-keeper' || p.role === 'captain-wicket-keeper') && (
                                <span className="ml-2 text-[10px] font-black text-primary border border-primary/30 rounded px-1.5 py-0.5 uppercase tracking-tighter bg-primary/5">
                                  {p.role === 'captain' && 'C'}
                                  {p.role === 'wicket-keeper' && 'WK'}
                                  {p.role === 'captain-wicket-keeper' && 'C & WK'}
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{p.role === 'player' ? '' : p.role}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team 2 Squad */}
                  <Card className="shadow-md overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b py-4">
                      <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-wide">
                        <Users className="h-5 w-5 text-primary" /> {match.team2Name || 'Team 2'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 px-4">
                      <div className="grid grid-cols-1 gap-2">
                        {(match.sport === 'cricket' && rosterPlayers.length > 0 ?
                          rosterPlayers.filter(p => p.team === 'team2') :
                          participants.filter(p => p.team === 'team2')
                        ).map((p: any, i: number) => (
                          <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-muted-foreground/10">
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {p.playerName || p.name || p.userId}
                              {p.role && (p.role === 'captain' || p.role === 'wicket-keeper' || p.role === 'captain-wicket-keeper') && (
                                <span className="ml-2 text-[10px] font-black text-primary border border-primary/30 rounded px-1.5 py-0.5 uppercase tracking-tighter bg-primary/5">
                                  {p.role === 'captain' && 'C'}
                                  {p.role === 'wicket-keeper' && 'WK'}
                                  {p.role === 'captain-wicket-keeper' && 'C & WK'}
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{p.role === 'player' ? '' : p.role}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Scorer component is now inside the tabs for live matches */}
        {match.status === 'live' && !match.matchData?.inningsData && (
          <div className="mb-6">
            {renderScorer()}
          </div>
        )}

        {/* Match Description */}
        {match.description && (
          <Card>
            <CardHeader>
              <CardTitle>About this Match</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{match.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
