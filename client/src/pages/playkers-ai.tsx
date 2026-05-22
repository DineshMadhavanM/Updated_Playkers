import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Sparkles, MessageSquare, Bot, User, HelpCircle, Trophy, Database, Users, MapPin, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface DBStats {
  totalUsers: number;
  totalPlayers: number;
  totalVenues: number;
  totalTeams: number;
  regions: string[];
}

const PRESET_PROMPTS = [
  "Show me the Coimbatore region players",
  "List the left batsman and wicket keeper in theni region",
  "Which venues support cricket?",
  "What teams are registered in the platform?"
];

export default function PlaykersAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hello! I am **Playkers Inner AI**, your direct search assistant to our live sports platform. \n\n" +
            "I have deep access to all registered players, teams, venues, matches, and regional bookings on Playkers. \n\n" +
            "How can I help you today? Try asking me about **Coimbatore players** or **left-handed wicket keepers in Theni**! 📊🏏",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load database stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const response = await apiRequest("GET", "/api/chat/inner-ai/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load DB stats:", err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/chat/inner-ai", {
        message: textToSend
      });
      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: "bot",
        text: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      toast({
        title: "Assistant Error",
        description: error.message || "Failed to query the Playkers Inner AI.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (prompt: string) => {
    if (isLoading) return;
    handleSendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Info & Dynamic Stats Card */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <Card className="border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 to-transparent shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-lg mb-1">
                <Database className="h-5 w-5" />
                <span>Live Intelligence</span>
              </div>
              <CardTitle className="text-xl">Playkers Inner AI</CardTitle>
              <CardDescription>
                Direct NLP search of our database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-700 dark:text-indigo-400">
                🔒 <strong>100% Verified Data:</strong> All answers are strictly sourced from our platform's live database of users, players, and match registries.
              </div>

              {/* Dynamic Database Statistics Panel */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Live Platform Stats</h4>
                
                {statsLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 border border-border/60 rounded-md bg-card flex flex-col gap-0.5">
                      <span className="text-muted-foreground">Players</span>
                      <span className="text-sm font-bold text-indigo-500">{stats.totalPlayers}</span>
                    </div>
                    <div className="p-2 border border-border/60 rounded-md bg-card flex flex-col gap-0.5">
                      <span className="text-muted-foreground">Registered Users</span>
                      <span className="text-sm font-bold text-indigo-500">{stats.totalUsers}</span>
                    </div>
                    <div className="p-2 border border-border/60 rounded-md bg-card flex flex-col gap-0.5">
                      <span className="text-muted-foreground">Venues</span>
                      <span className="text-sm font-bold text-indigo-500">{stats.totalVenues}</span>
                    </div>
                    <div className="p-2 border border-border/60 rounded-md bg-card flex flex-col gap-0.5">
                      <span className="text-muted-foreground">Active Teams</span>
                      <span className="text-sm font-bold text-indigo-500">{stats.totalTeams}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Stats unavailable</span>
                )}
              </div>

              {/* Dynamic Active Regions list */}
              {stats && stats.regions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-indigo-400" />
                    Active Regions
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {stats.regions.map((reg, idx) => (
                      <Badge key={idx} variant="secondary" className="text-[10px] bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                        {reg}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="hidden md:block">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Quick Database Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0 pb-4">
              {PRESET_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(prompt)}
                  disabled={isLoading}
                  className="text-left text-xs p-2 rounded-lg border border-border bg-card hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Window Panel */}
        <Card className="flex-1 flex flex-col h-[calc(100vh-140px)] min-h-[500px] border-border shadow-lg relative overflow-hidden bg-card/60 backdrop-blur-sm">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-indigo-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">Playkers Database Assistant</h3>
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 text-[10px] py-0 px-2">
                    Live DB
                  </Badge>
                </div>
                <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block animate-ping"></span>
                  Connected to Live Snapshot
                </p>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isBot = msg.sender === "bot";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 ${!isBot ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                      isBot 
                        ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400" 
                        : "bg-primary/20 border-primary/30 text-primary"
                    }`}>
                      {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      isBot 
                        ? "bg-muted text-foreground border border-border/50 rounded-tl-none font-normal" 
                        : "bg-primary text-primary-foreground rounded-tr-none font-medium shadow-md shadow-primary/10"
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed markdown-content prose dark:prose-invert max-w-none text-xs sm:text-sm">
                        {msg.text}
                      </div>
                      <span className={`text-[10px] block mt-1.5 opacity-60 text-right ${!isBot ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Thinking / Loading Animation */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted text-foreground border border-border/50 rounded-2xl rounded-tl-none px-4 py-3 text-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions on Mobile */}
          <div className="md:hidden flex gap-2 overflow-x-auto px-4 pb-2 pt-1 border-t border-border bg-card/40 scrollbar-none">
            {PRESET_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(prompt)}
                disabled={isLoading}
                className="shrink-0 text-xs py-1 px-3 rounded-full border border-border bg-card hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Panel */}
          <div className="p-4 border-t border-border bg-card/90">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Ask about Coimbatore players, left batsmen in Theni, venues..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 border-border focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-md shadow-indigo-600/10"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Send</span>
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
