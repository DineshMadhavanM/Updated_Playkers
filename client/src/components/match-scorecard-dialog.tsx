import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Target, TrendingUp, Calendar, MapPin, Users, Activity, Timer } from "lucide-react";
import type { Match, Player, Team } from "@shared/schema";

const sportEmojis: Record<string, string> = {
  cricket: "🏏",
  football: "⚽",
  volleyball: "🏐",
  tennis: "🎾",
  kabaddi: "🤼",
};

interface MatchScorecardDialogProps {
  match: Match;
  children: React.ReactNode;
  teamStats?: {
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    matchesDrawn: number;
    winRate: number;
    tournamentPoints: number;
  };
}

export default function MatchScorecardDialog({ match, children, teamStats }: MatchScorecardDialogProps) {
  const [open, setOpen] = useState(false);

  // Fetch players to resolve player IDs to names
  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: open,
  });

  // Fetch teams for additional team information
  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: open,
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

  const getMatchResult = () => {
    if (match.status !== 'completed') return null;

    const resultSummary = (match.matchData as any)?.resultSummary;
    const awards = (match.matchData as any)?.awards;

    if (resultSummary?.winnerId) {
      const winnerName = resultSummary.winnerId === (match.matchData as any)?.team1Id ? match.team1Name : match.team2Name;
      if (resultSummary.resultType === 'won-by-runs') {
        return `${winnerName} won by ${resultSummary.marginRuns} runs`;
      } else if (resultSummary.resultType === 'won-by-wickets') {
        return `${winnerName} won by ${resultSummary.marginWickets} wickets`;
      }
    }

    if (resultSummary?.resultType === 'tied') return 'Match tied';
    if (resultSummary?.resultType === 'no-result') return 'No result';
    if (resultSummary?.resultType === 'abandoned') return 'Match abandoned';

    return 'Result not available';
  };

  const getManOfTheMatch = () => {
    const awards = (match.matchData as any)?.awards;
    return awards?.manOfTheMatch || null;
  };

  const getScorecard = () => {
    return (match.matchData as any)?.scorecard || null;
  };

  const getPlayerName = (playerId: string) => {
    if (!playerId) return "Unknown Player";
    const player = allPlayers.find(p => p.id === playerId || p.name === playerId);
    return player?.name || playerId;
  };

  const getTeamName = (teamId: string) => {
    if (!teamId) return "Unknown Team";
    const team = allTeams.find(t => t.id === teamId || t.name === teamId);
    return team?.name || teamId;
  };

  const getCurrentScore = () => {
    const matchData = match.matchData as any;
    return {
      team1Score: typeof match.team1Score === 'object' && match.team1Score?.runs !== undefined ? match.team1Score.runs : (match.team1Score || 0),
      team2Score: typeof match.team2Score === 'object' && match.team2Score?.runs !== undefined ? match.team2Score.runs : (match.team2Score || 0),
      team1Wickets: matchData?.team1Wickets || 0,
      team2Wickets: matchData?.team2Wickets || 0,
      currentOver: matchData?.currentOver || 0,
      currentBall: matchData?.currentBall || 0,
    };
  };

  const getLiveMatchData = () => {
    const matchData = match.matchData as any;
    if (!matchData) return null;

    return {
      currentInning: matchData.currentInning || 1,
      tossWinner: matchData.toss?.winner,
      tossDecision: matchData.toss?.decision,
      currentStriker: matchData.currentPlayers?.striker,
      currentBowler: matchData.currentPlayers?.bowler,
      lastBall: matchData.lastBall,
      recentOvers: matchData.recentOvers || []
    };
  };

  const formatScore = (s: any) => {
    if (s && typeof s === 'object' && 'runs' in s) {
      return `${s.runs}/${s.wickets || 0} (${s.overs || 0} ov)`;
    }
    return String(s ?? '');
  };

  const getTopPerformers = () => {
    const scorecard = getScorecard();
    if (!scorecard) return null;

    let bestBatsman = { playerId: '', runs: 0, teamName: '', ballsFaced: 0, strikeRate: 0 };
    let bestBowler = { playerId: '', wickets: 0, teamName: '', overs: 0, runsGiven: 999, economy: 999 };
    let bestFielder = { playerId: '', catches: 0, teamName: '', runOuts: 0, stumpings: 0 };

    // Check all innings for batting performance
    [scorecard.team1Innings, scorecard.team2Innings].forEach((innings, teamIndex) => {
      const teamName = teamIndex === 0 ? (match.team1Name || 'Team 1') : (match.team2Name || 'Team 2');

      if (innings && Array.isArray(innings)) {
        innings.forEach((inning: any) => {
          // Best batsman - highest runs
          if (inning.batsmen && Array.isArray(inning.batsmen)) {
            inning.batsmen.forEach((batsman: any) => {
              if ((batsman.runsScored || 0) > bestBatsman.runs) {
                bestBatsman = {
                  playerId: batsman.playerId,
                  runs: batsman.runsScored || 0,
                  teamName,
                  ballsFaced: batsman.ballsFaced || 0,
                  strikeRate: batsman.strikeRate || 0
                };
              }
            });
          }

          // Best bowler - most wickets, then best economy
          if (inning.bowlers && Array.isArray(inning.bowlers)) {
            inning.bowlers.forEach((bowler: any) => {
              const wickets = bowler.wickets || 0;
              const economy = bowler.economy || 999;
              const overs = bowler.overs || 0;
              const runsGiven = bowler.runsGiven || 0;

              if (wickets > bestBowler.wickets ||
                (wickets === bestBowler.wickets && economy < bestBowler.economy)) {
                bestBowler = {
                  playerId: bowler.playerId,
                  wickets,
                  teamName,
                  overs,
                  runsGiven,
                  economy
                };
              }
            });
          }

          // Best fielder - from dismissals and fielding stats
          if (inning.batsmen && Array.isArray(inning.batsmen)) {
            inning.batsmen.forEach((batsman: any) => {
              if (batsman.dismissalType && batsman.dismissalType !== 'not-out' && batsman.fielder) {
                const fielderId = batsman.fielder;
                const dismissalType = batsman.dismissalType;

                // Count different types of fielding contributions
                if (dismissalType === 'caught' || dismissalType === 'caught-behind') {
                  if (!bestFielder.playerId || fielderId === bestFielder.playerId) {
                    bestFielder.playerId = fielderId;
                    bestFielder.catches = (bestFielder.catches || 0) + 1;
                    bestFielder.teamName = teamName;
                  }
                } else if (dismissalType === 'run-out') {
                  if (!bestFielder.playerId || fielderId === bestFielder.playerId) {
                    bestFielder.playerId = fielderId;
                    bestFielder.runOuts = (bestFielder.runOuts || 0) + 1;
                    bestFielder.teamName = teamName;
                  }
                } else if (dismissalType === 'stump-out') {
                  if (!bestFielder.playerId || fielderId === bestFielder.playerId) {
                    bestFielder.playerId = fielderId;
                    bestFielder.stumpings = (bestFielder.stumpings || 0) + 1;
                    bestFielder.teamName = teamName;
                  }
                }
              }
            });
          }
        });
      }
    });

    return {
      bestBatsman: bestBatsman.runs > 0 ? bestBatsman : null,
      bestBowler: bestBowler.wickets > 0 ? bestBowler : null,
      bestFielder: (bestFielder.catches + bestFielder.runOuts + bestFielder.stumpings) > 0 ? bestFielder : null
    };
  };

  const renderInningsCard = (innings: any, teamName: string | null) => {
    if (!innings || innings.length === 0) return null;

    return innings.map((inning: any, index: number) => (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>{teamName} - Innings {inning.inningsNumber}</span>
            <Badge variant="outline" className="text-lg font-bold">
              {inning.totalRuns}/{inning.totalWickets} ({inning.totalOvers} overs)
            </Badge>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Run Rate: {inning.runRate?.toFixed(2)} |
            Extras: {Object.values(inning.extras || {}).reduce((a: any, b: any) => a + b, 0)}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="batting" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="batting">Batting</TabsTrigger>
              <TabsTrigger value="bowling">Bowling</TabsTrigger>
            </TabsList>

            <TabsContent value="batting" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Batsman</th>
                      <th className="text-right p-2">Runs</th>
                      <th className="text-right p-2">Balls</th>
                      <th className="text-right p-2">4s</th>
                      <th className="text-right p-2">6s</th>
                      <th className="text-right p-2">SR</th>
                      <th className="text-left p-2">Dismissal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inning.batsmen?.map((batsman: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 font-medium">{getPlayerName(batsman.playerId)}</td>
                        <td className="text-right p-2">{batsman.runsScored}</td>
                        <td className="text-right p-2">{batsman.ballsFaced}</td>
                        <td className="text-right p-2">{batsman.fours}</td>
                        <td className="text-right p-2">{batsman.sixes}</td>
                        <td className="text-right p-2">{batsman.strikeRate?.toFixed(1)}</td>
                        <td className="text-left p-2 text-muted-foreground">
                          {batsman.dismissalType === 'not-out' ? 'Not Out' : batsman.dismissalType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="bowling" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Bowler</th>
                      <th className="text-right p-2">Overs</th>
                      <th className="text-right p-2">Maidens</th>
                      <th className="text-right p-2">Runs</th>
                      <th className="text-right p-2">Wickets</th>
                      <th className="text-right p-2">Economy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inning.bowlers?.map((bowler: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 font-medium">{getPlayerName(bowler.playerId)}</td>
                        <td className="text-right p-2">{bowler.overs}</td>
                        <td className="text-right p-2">{bowler.maidens}</td>
                        <td className="text-right p-2">{bowler.runsGiven}</td>
                        <td className="text-right p-2">{bowler.wickets}</td>
                        <td className="text-right p-2">{bowler.economy?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl" data-testid={`dialog-title-${match.id}`}>
            {sportEmojis[match.sport] || "🏃"} {match.title}
            <Badge variant={match.status === 'completed' ? 'default' : 'secondary'} data-testid={`dialog-status-badge-${match.id}`}>
              {match.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(match.scheduledAt)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Venue: {match.venueId}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {match.matchType} • {match.isPublic ? "Public" : "Private"}
                  </div>
                </div>

                {match.team1Name && match.team2Name && (
                  <div className="text-center">
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <p className="font-bold text-lg">{match.team1Name}</p>
                      </div>
                      <div className="text-center text-muted-foreground font-medium mx-4">VS</div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{match.team2Name}</p>
                      </div>
                    </div>
                    {match.status === 'completed' && (
                      <div className="mt-2 text-center">
                        <Badge variant="outline" className="text-green-600">
                          {getMatchResult()}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {getManOfTheMatch() && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold">Man of the Match</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      {getManOfTheMatch()}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="scorecard" className="w-full">
            <TabsList className="grid w-full grid-cols-4" data-testid={`dialog-tabs-list-${match.id}`}>
              <TabsTrigger value="scorecard" data-testid={`tab-scorecard-${match.id}`}>Scorecard</TabsTrigger>
              <TabsTrigger value="squads" data-testid={`tab-squads-${match.id}`}>Squads</TabsTrigger>
              <TabsTrigger value="awards" data-testid={`tab-awards-${match.id}`}>Awards</TabsTrigger>
              <TabsTrigger value="team-stats" data-testid={`tab-team-stats-${match.id}`}>Team Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="scorecard" className="mt-6">
              {getScorecard() || match.status === 'live' ? (
                <div className="space-y-6">
                  {/* Match Overview Summary */}
                  {match.status === 'completed' && (
                    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <Trophy className="h-10 w-10 text-yellow-500" />
                          <div>
                            <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{getMatchResult()}</h3>
                            <p className="text-muted-foreground mt-1">Match completed on {formatDate(match.updatedAt || match.scheduledAt)}</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-md pt-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Toss</p>
                              <p className="font-semibold">{getLiveMatchData()?.tossWinner || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">Chose to {getLiveMatchData()?.tossDecision}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Player of the Match</p>
                              <p className="font-semibold">{getManOfTheMatch() || 'Not Announced'}</p>
                              <p className="text-xs text-muted-foreground">Outstanding Performance</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Current Live Score Display */}
                  {match.status === 'live' && (
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                          <Activity className="h-5 w-5" />
                          Live Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="text-center">
                            <h3 className="font-bold text-lg mb-2">{match.team1Name || "Team 1"}</h3>
                            <div className="text-3xl font-bold text-green-600">
                              {getCurrentScore().team1Score}/{getCurrentScore().team1Wickets}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ({Math.floor(getCurrentScore().currentOver)}.{getCurrentScore().currentBall} overs)
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="font-bold text-lg mb-2">{match.team2Name || "Team 2"}</h3>
                            <div className="text-3xl font-bold text-green-600">
                              {getCurrentScore().team2Score}/{getCurrentScore().team2Wickets}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getCurrentScore().team2Score > 0 ? `(${Math.floor(getCurrentScore().currentOver)}.${getCurrentScore().currentBall} overs)` : "Yet to bat"}
                            </div>
                          </div>
                        </div>
                        {getLiveMatchData() && (
                          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                            {getLiveMatchData()?.tossWinner && (
                              <p><strong>Toss:</strong> {getLiveMatchData()?.tossWinner} won and chose to {getLiveMatchData()?.tossDecision} first</p>
                            )}
                            {getLiveMatchData()?.currentStriker && (
                              <p><strong>Batting:</strong> {getPlayerName(getLiveMatchData()?.currentStriker || "")} (striker)</p>
                            )}
                            {getLiveMatchData()?.currentBowler && (
                              <p><strong>Bowling:</strong> {getPlayerName(getLiveMatchData()?.currentBowler || "")}</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Detailed Scorecard for Completed Matches */}
                  {getScorecard() && (
                    <>
                      {/* Team 1 Innings */}
                      {getScorecard().team1Innings && renderInningsCard(getScorecard().team1Innings, match.team1Name)}

                      {/* Team 2 Innings */}
                      {getScorecard().team2Innings && renderInningsCard(getScorecard().team2Innings, match.team2Name)}
                    </>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {match.status === 'upcoming'
                        ? 'Match has not started yet. Scorecard will be available once the match begins.'
                        : 'No scorecard data available for this match'
                      }
                    </p>
                    {match.status === 'upcoming' && match.team1Name && match.team2Name && (
                      <div className="mt-4 flex items-center justify-center gap-4">
                        <Badge variant="outline">{match.team1Name}</Badge>
                        <span className="text-muted-foreground">vs</span>
                        <Badge variant="outline">{match.team2Name}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="awards" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card data-testid={`card-match-awards-${match.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Match Awards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {match.status === 'completed' && (match.matchData as any)?.awards ? (
                      <div className="space-y-3">
                        {(match.matchData as any).awards.manOfTheMatch && (
                          <div className="flex justify-between">
                            <span>🏆 Man of the Match:</span>
                            <span className="font-semibold text-yellow-600">
                              {getPlayerName((match.matchData as any).awards.manOfTheMatch)}
                            </span>
                          </div>
                        )}
                        {(match.matchData as any).awards.bestBatsman && (
                          <div className="flex justify-between">
                            <span>🏏 Best Batsman:</span>
                            <span className="font-semibold">{getPlayerName((match.matchData as any).awards.bestBatsman)}</span>
                          </div>
                        )}
                        {(match.matchData as any).awards.bestBowler && (
                          <div className="flex justify-between">
                            <span>⚡ Best Bowler:</span>
                            <span className="font-semibold">{getPlayerName((match.matchData as any).awards.bestBowler)}</span>
                          </div>
                        )}
                        {(match.matchData as any).awards.bestFielder && (
                          <div className="flex justify-between">
                            <span>🤲 Best Fielder:</span>
                            <span className="font-semibold">{getPlayerName((match.matchData as any).awards.bestFielder)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6">
                        {match.status === 'completed'
                          ? 'No awards data available for this match'
                          : 'Awards will be announced after match completion'
                        }
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid={`card-match-result-${match.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Match Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {match.status === 'completed' ? (
                      <div className="space-y-3">
                        <div className="text-center">
                          <Badge variant="outline" className="text-lg p-3">
                            {getMatchResult()}
                          </Badge>
                        </div>
                        {(match.matchData as any)?.resultSummary?.marginBalls && (
                          <div className="text-center text-sm text-muted-foreground">
                            with {(match.matchData as any).resultSummary.marginBalls} balls remaining
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6">
                        Match result will be available once completed
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team-stats" className="mt-6">
              <div className="space-y-6">
                {/* Match Performance Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Match Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Team 1 Performance */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          {match.team1Name || "Team 1"}
                          {match.status === 'completed' && (match.matchData as any)?.resultSummary?.winnerId === (match.matchData as any)?.team1Id && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{getCurrentScore().team1Score}</div>
                            <div className="text-xs text-muted-foreground">Runs</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{getCurrentScore().team1Wickets}</div>
                            <div className="text-xs text-muted-foreground">Wickets</div>
                          </div>
                        </div>
                        {match.sport === 'cricket' && getScorecard()?.team1Innings?.[0] && (
                          <div className="text-sm text-muted-foreground">
                            <p>Run Rate: {getScorecard()?.team1Innings?.[0]?.runRate?.toFixed(2) || '0.00'}</p>
                            <p>Extras: {Object.values(getScorecard()?.team1Innings?.[0]?.extras || {}).reduce((a: number, b: any) => a + Number(b || 0), 0)}</p>
                          </div>
                        )}
                      </div>

                      {/* Team 2 Performance */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          {match.team2Name || "Team 2"}
                          {match.status === 'completed' && (match.matchData as any)?.resultSummary?.winnerId === (match.matchData as any)?.team2Id && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{getCurrentScore().team2Score}</div>
                            <div className="text-xs text-muted-foreground">Runs</div>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{getCurrentScore().team2Wickets}</div>
                            <div className="text-xs text-muted-foreground">Wickets</div>
                          </div>
                        </div>
                        {match.sport === 'cricket' && getScorecard()?.team2Innings?.[0] && (
                          <div className="text-sm text-muted-foreground">
                            <p>Run Rate: {getScorecard()?.team2Innings?.[0]?.runRate?.toFixed(2) || '0.00'}</p>
                            <p>Extras: {Object.values(getScorecard()?.team2Innings?.[0]?.extras || {}).reduce((a: number, b: any) => a + Number(b || 0), 0)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overall Team Statistics */}
                {teamStats ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Season Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6" data-testid={`team-stats-grid-${match.id}`}>
                        <Card data-testid={`card-wins-${match.id}`}>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600" data-testid={`stat-wins-${match.id}`}>{teamStats.matchesWon}</div>
                            <div className="text-sm text-muted-foreground">Wins</div>
                          </CardContent>
                        </Card>
                        <Card data-testid={`card-losses-${match.id}`}>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600" data-testid={`stat-losses-${match.id}`}>{teamStats.matchesLost}</div>
                            <div className="text-sm text-muted-foreground">Losses</div>
                          </CardContent>
                        </Card>
                        <Card data-testid={`card-draws-${match.id}`}>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600" data-testid={`stat-draws-${match.id}`}>{teamStats.matchesDrawn}</div>
                            <div className="text-sm text-muted-foreground">Draws</div>
                          </CardContent>
                        </Card>
                        <Card data-testid={`card-win-rate-${match.id}`}>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600" data-testid={`stat-win-rate-${match.id}`}>{teamStats.winRate.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">Win Rate</div>
                          </CardContent>
                        </Card>
                        <Card className="md:col-span-2" data-testid={`card-tournament-points-${match.id}`}>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600" data-testid={`stat-tournament-points-${match.id}`}>{teamStats.tournamentPoints}</div>
                            <div className="text-sm text-muted-foreground">Tournament Points</div>
                          </CardContent>
                        </Card>
                        <Card className="md:col-span-2" data-testid={`card-total-matches-${match.id}`}>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold" data-testid={`stat-total-matches-${match.id}`}>{teamStats.totalMatches}</div>
                            <div className="text-sm text-muted-foreground">Total Matches</div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Season statistics not available
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Match-specific performance data is shown above
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Match Timeline for Live/Completed matches */}
                {(match.status === 'live' || match.status === 'completed') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        Match Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        {getLiveMatchData()?.tossWinner && (
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="font-medium">Toss Winner:</span>
                            <span>{getLiveMatchData()?.tossWinner} (chose to {getLiveMatchData()?.tossDecision} first)</span>
                          </div>
                        )}

                        {match.status === 'live' && (
                          <>
                            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <span className="font-medium">Current Status:</span>
                              <Badge variant="outline" className="bg-green-100 text-green-800">Live - Inning {getLiveMatchData()?.currentInning || 1}</Badge>
                            </div>

                            {getLiveMatchData()?.currentStriker && (
                              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <span className="font-medium">On Strike:</span>
                                <span>{getPlayerName(getLiveMatchData()?.currentStriker || "")}</span>
                              </div>
                            )}

                            {getLiveMatchData()?.currentBowler && (
                              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <span className="font-medium">Bowling:</span>
                                <span>{getPlayerName(getLiveMatchData()?.currentBowler || "")}</span>
                              </div>
                            )}
                          </>
                        )}

                        {match.status === 'completed' && (
                          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="font-medium">Final Result:</span>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">{getMatchResult()}</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="squads" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team 1 Roster */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {match.team1Name || 'Team 1'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(match.matchData as any)?.team1Roster?.map((player: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <span className="font-medium">
                            {player.name}
                            {player.role && (player.role.includes('captain') || player.role.includes('wicket-keeper')) && (
                              <span className="ml-2 text-xs font-bold text-slate-800 dark:text-slate-200 italic">
                                {player.role === 'captain' && '(C)'}
                                {player.role === 'vice-captain' && '(VC)'}
                                {player.role === 'wicket-keeper' && '(WK)'}
                                {player.role === 'captain-wicket-keeper' && '(C & WK)'}
                                {player.role === 'vice-captain-wicket-keeper' && '(VC & WK)'}
                              </span>
                            )}
                          </span>
                          {player.battingStyle && (
                            <Badge variant="outline" className="text-[10px] px-1 h-5">{player.battingStyle}</Badge>
                          )}
                        </div>
                      ))}
                      {!(match.matchData as any)?.team1Roster?.length && (
                        <p className="text-muted-foreground text-center py-4">No squad data available for {match.team1Name}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Team 2 Roster */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {match.team2Name || 'Team 2'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(match.matchData as any)?.team2Roster?.map((player: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <span className="font-medium">
                            {player.name}
                            {player.role && (player.role.includes('captain') || player.role.includes('wicket-keeper')) && (
                              <span className="ml-2 text-xs font-bold text-slate-800 dark:text-slate-200 italic">
                                {player.role === 'captain' && '(C)'}
                                {player.role === 'vice-captain' && '(VC)'}
                                {player.role === 'wicket-keeper' && '(WK)'}
                                {player.role === 'captain-wicket-keeper' && '(C & WK)'}
                                {player.role === 'vice-captain-wicket-keeper' && '(VC & WK)'}
                              </span>
                            )}
                          </span>
                          {player.battingStyle && (
                            <Badge variant="outline" className="text-[10px] px-1 h-5">{player.battingStyle}</Badge>
                          )}
                        </div>
                      ))}
                      {!(match.matchData as any)?.team2Roster?.length && (
                        <p className="text-muted-foreground text-center py-4">No squad data available for {match.team2Name}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="awards" className="mt-6">
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Match Awards & Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const topPerformers = getTopPerformers();
                      if (!topPerformers) return <p className="text-muted-foreground text-center py-8">No performance awards available for this match.</p>;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                          {/* Best Batsman */}
                          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp className="h-12 w-12" /></div>
                            <CardContent className="p-6 text-center">
                              <div className="text-sm font-bold text-green-800 dark:text-green-200 mb-3 uppercase tracking-wider">🏏 Best Batsman</div>
                              {topPerformers.bestBatsman ? (
                                <div className="space-y-2">
                                  <div className="font-black text-xl text-green-700 dark:text-green-400">
                                    {getPlayerName(topPerformers.bestBatsman.playerId)}
                                  </div>
                                  <div className="text-sm font-medium text-muted-foreground">{topPerformers.bestBatsman.teamName}</div>
                                  <div className="inline-block px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-100 font-bold text-2xl mt-2">
                                    {topPerformers.bestBatsman.runs} <span className="text-sm font-normal">runs</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground pt-1">
                                    {topPerformers.bestBatsman.ballsFaced} balls • SR: {topPerformers.bestBatsman.strikeRate.toFixed(1)}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-muted-foreground py-4">No data</div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Best Bowler */}
                          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><Target className="h-12 w-12" /></div>
                            <CardContent className="p-6 text-center">
                              <div className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-3 uppercase tracking-wider">⚡ Best Bowler</div>
                              {topPerformers.bestBowler ? (
                                <div className="space-y-2">
                                  <div className="font-black text-xl text-blue-700 dark:text-blue-400">
                                    {getPlayerName(topPerformers.bestBowler.playerId)}
                                  </div>
                                  <div className="text-sm font-medium text-muted-foreground">{topPerformers.bestBowler.teamName}</div>
                                  <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100 font-bold text-2xl mt-2">
                                    {topPerformers.bestBowler.wickets} <span className="text-sm font-normal">wickets</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground pt-1">
                                    {topPerformers.bestBowler.overs} ov • {topPerformers.bestBowler.runsGiven} runs • Eco: {topPerformers.bestBowler.economy.toFixed(2)}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-muted-foreground py-4">No data</div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Best Fielder */}
                          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><Activity className="h-12 w-12" /></div>
                            <CardContent className="p-6 text-center">
                              <div className="text-sm font-bold text-orange-800 dark:text-orange-200 mb-3 uppercase tracking-wider">🤲 Best Fielder</div>
                              {topPerformers.bestFielder ? (
                                <div className="space-y-2">
                                  <div className="font-black text-xl text-orange-700 dark:text-orange-400">
                                    {getPlayerName(topPerformers.bestFielder.playerId)}
                                  </div>
                                  <div className="text-sm font-medium text-muted-foreground">{topPerformers.bestFielder.teamName}</div>
                                  <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-100 font-bold text-2xl mt-2">
                                    {topPerformers.bestFielder.catches + topPerformers.bestFielder.runOuts + topPerformers.bestFielder.stumpings} <span className="text-sm font-normal">dismissals</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground pt-1">
                                    {topPerformers.bestFielder.catches > 0 && `${topPerformers.bestFielder.catches} C`}
                                    {topPerformers.bestFielder.runOuts > 0 && `, ${topPerformers.bestFielder.runOuts} RO`}
                                    {topPerformers.bestFielder.stumpings > 0 && `, ${topPerformers.bestFielder.stumpings} ST`}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground py-4">No data</div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}

                    {getManOfTheMatch() && (
                      <div className="mt-8 pt-8 border-t text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Trophy className="h-12 w-12 text-yellow-500 animate-bounce" />
                          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Main Award</h4>
                          <p className="text-3xl font-black text-slate-900 dark:text-white">Player of the Match</p>
                          <Badge className="text-2xl py-2 px-8 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-none shadow-lg mt-2">
                            {getManOfTheMatch()}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team-stats" className="mt-6">
              <div className="space-y-6">
                {teamStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-bold">Team Performance Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Tournament Points</span>
                            <Badge variant="secondary" className="text-lg font-bold">{teamStats.tournamentPoints}</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              <span>Win Rate</span>
                              <span>{teamStats.winRate}%</span>
                            </div>
                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all duration-1000"
                                style={{ width: `${teamStats.winRate}%` }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center pt-2">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <p className="text-xs text-green-700 dark:text-green-300 font-bold uppercase">Won</p>
                              <p className="text-xl font-bold">{teamStats.matchesWon}</p>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <p className="text-xs text-red-700 dark:text-red-300 font-bold uppercase">Lost</p>
                              <p className="text-xl font-bold">{teamStats.matchesLost}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase">Drawn</p>
                              <p className="text-xl font-bold">{teamStats.matchesDrawn}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-bold">Match Summary Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg border border-dashed flex flex-col items-center justify-center min-h-[160px] text-center">
                          <Users className="h-10 w-10 text-muted-foreground mb-3" />
                          <p className="font-bold text-lg mb-1">{teamStats.totalMatches} matches played</p>
                          <p className="text-sm text-muted-foreground">Stats from current tournament season</p>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                          <span className="text-sm font-medium">Potential for Championship!</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="p-12 text-center border-dashed">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        <Activity className="h-12 w-12 text-muted-foreground opacity-30" />
                      </div>
                      <CardTitle className="text-xl text-muted-foreground">Team Statistics Unavailable</CardTitle>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Historical team statistics are not available for this specific match. Data collection starts after match finalization.
                      </p>
                    </CardHeader>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}