import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Sparkles, MessageSquare, Bot, User, HelpCircle, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

const PRESET_PROMPTS = [
  "What is LBW (Leg Before Wicket)?",
  "Explain the 10 ways to get out in cricket",
  "Who is MS Dhoni (Captain Cool)?",
  "Tell me about the Indian Premier League (IPL)"
];

export default function CricketAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hi player! I am **CreaseChat**, your dedicated 24/7 Cricket AI expert. I live and breathe cricket, meaning I can **only** talk about cricket! Ask me about rules, legendary players, IPL franchises, or tactics. What cricket query is on your mind today? 🏏",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const response = await apiRequest("POST", "/api/chat/cricket", {
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
        title: "Communication Error",
        description: error.message || "Failed to deliver message to CreaseChat.",
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
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Info Card (Aesthetics) */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <Card className="border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-lg mb-1">
                <Trophy className="h-5 w-5" />
                <span>Playkers Arena</span>
              </div>
              <CardTitle className="text-xl">CreaseChat AI</CardTitle>
              <CardDescription>
                The ultimate cricket knowledge hub.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-400">
                ⚠️ <strong>Cricket Only Rules!</strong> CreaseChat will politely decline to answer questions about any other subjects or sports.
              </div>
              <div className="space-y-2">
                <span className="font-semibold text-foreground text-xs uppercase tracking-wider block">Ask me about:</span>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Detailed game rules & terminologies</li>
                  <li>Historic records & player stats</li>
                  <li>T20, ODI, and Test format strategies</li>
                  <li>IPL teams and histories</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hidden md:block">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Quick Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0 pb-4">
              {PRESET_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(prompt)}
                  disabled={isLoading}
                  className="text-left text-xs p-2 rounded-lg border border-border bg-card hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat window panel */}
        <Card className="flex-1 flex flex-col h-[calc(100vh-140px)] min-h-[500px] border-border shadow-lg relative overflow-hidden bg-card/60 backdrop-blur-sm">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">CreaseChat</h3>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 px-2">
                    Cricket Guru
                  </Badge>
                </div>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                  Online & Ready
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
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 ${
                      isBot 
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                        : "bg-primary/20 border-primary/30 text-primary"
                    }`}>
                      {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isBot 
                        ? "bg-muted text-foreground border border-border/50 rounded-tl-none font-normal" 
                        : "bg-primary text-primary-foreground rounded-tr-none font-medium shadow-md shadow-primary/10"
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed markdown-content">
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
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted text-foreground border border-border/50 rounded-2xl rounded-tl-none px-4 py-3 text-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
                className="shrink-0 text-xs py-1 px-3 rounded-full border border-border bg-card hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all duration-200 disabled:opacity-50"
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
                placeholder="Ask CreaseChat about cricket rules, teams, stars..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 border-border focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md shadow-emerald-600/10"
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
