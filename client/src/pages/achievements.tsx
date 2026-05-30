import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Heart,
  MessageSquare,
  Send,
  Image as ImageIcon,
  Loader2,
  Trash2,
  MoreVertical,
  Flame,
  Award,
  Users,
  Compass,
  X,
  ThumbsUp,
  Plus,
  Search,
} from "lucide-react";
import type { Achievement } from "@shared/schema";

export default function Achievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog controls
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Comments state maps
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Query achievements
  const { data: achievements = [], isLoading: isFeedLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const [activeTab, setActiveTab] = useState<"achievements" | "my-posts">("achievements");
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");

  // Query players for search
  const { data: searchPlayers = [], isLoading: isSearchLoading } = useQuery<any[]>({
    queryKey: ["/api/players", playerSearchQuery],
    queryFn: async () => {
      const url = playerSearchQuery.trim()
        ? `/api/players?search=${encodeURIComponent(playerSearchQuery.trim())}`
        : `/api/players`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch players");
      return res.json();
    },
    enabled: isSearchOpen,
  });

  // Filter achievements based on active tab or selected player:
  const filteredAchievements = achievements.filter((post) => {
    if (selectedPlayer) {
      if (selectedPlayer.userId && post.userId) {
        return post.userId === selectedPlayer.userId;
      }
      return post.userName.toLowerCase() === selectedPlayer.name.toLowerCase();
    }
    if (activeTab === "my-posts") {
      return post.userId === user?.id;
    }
    return post.userId !== user?.id;
  });

  // Query user stats for the sidebar
  const { data: userStats = [] } = useQuery<any[]>({
    queryKey: ["/api/user/stats"],
  });

  // Calculate total posts, likes, and comments for the logged-in user (like LinkedIn/Instagram profile stats)
  const userPosts = achievements.filter((post) => post.userId === user?.id);
  const totalPosts = userPosts.length;
  const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  const totalComments = userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

  // Create achievement mutation
  const createAchievementMutation = useMutation({
    mutationFn: async (data: { text: string; imageUrl: string | null }) => {
      const res = await apiRequest("POST", "/api/achievements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      setPostText("");
      setImageUrl(null);
      setIsCreateOpen(false);
      toast({
        title: "Achievement posted!",
        description: "Your sports moment has been shared with the community.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to post",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Like achievement mutation
  const likeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/achievements/${id}/like`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
    },
    onError: (err: any) => {
      toast({
        title: "Action failed",
        description: err.message || "Failed to update like status.",
        variant: "destructive",
      });
    },
  });

  // Comment achievement mutation
  const commentMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const res = await apiRequest("POST", `/api/achievements/${id}/comment`, { text });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      setCommentTexts((prev) => ({ ...prev, [variables.id]: "" }));
    },
    onError: (err: any) => {
      toast({
        title: "Comment failed",
        description: err.message || "Failed to add comment.",
        variant: "destructive",
      });
    },
  });

  // Delete achievement mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/achievements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      toast({
        title: "Post deleted",
        description: "Your achievement post was successfully removed.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Deletion failed",
        description: err.message || "Failed to delete post.",
        variant: "destructive",
      });
    },
  });

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      setUploadingImage(true);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setImageUrl(data.url);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload image to Cloudinary.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePostSubmit = () => {
    if (!postText.trim()) return;
    createAchievementMutation.mutate({ text: postText, imageUrl });
  };

  const handleCommentSubmit = (id: string) => {
    const text = commentTexts[id];
    if (!text || !text.trim()) return;
    commentMutation.mutate({ id, text: text.trim() });
  };

  const toggleComments = (id: string) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent sm:text-4xl">
              Achievements Feed
            </h1>
            <p className="text-muted-foreground mt-1">
              Celebrate your victories, share highlights, and inspire your community.
            </p>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Mini Profile Card & Stats (3/12 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden border-border bg-card shadow-sm">
              {/* Header Banner */}
              <div className="h-16 bg-gradient-to-r from-primary/20 to-accent/20 relative" />
              <CardContent className="p-6 pt-0 relative flex flex-col items-center text-center">
                {/* Large Avatar */}
                <Avatar className="h-20 w-20 border-4 border-card rounded-full -mt-10 shadow-md">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <h3 className="font-bold text-lg mt-3 text-foreground">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 justify-center">
                  <Compass className="h-3 w-3" />
                  {user?.region || "No region selected"}
                </p>

                <Separator className="my-4 w-full" />

                {/* Quick Profile Stats */}
                <div className="w-full space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-primary" />
                      Total Posts
                    </span>
                    <span className="font-semibold text-foreground">{totalPosts}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ThumbsUp className="h-4 w-4 text-yellow-500" />
                      Total Likes
                    </span>
                    <span className="font-semibold text-foreground">{totalLikes}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-accent" />
                      Total Comments
                    </span>
                    <span className="font-semibold text-foreground">{totalComments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links Widget */}
            <Card className="hidden lg:block border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-1">
                  <a href="/" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors">
                    Home Page
                  </a>
                  <a href="/profile" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors">
                    My Player Profile
                  </a>
                  <a href="/availability" className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-muted text-foreground transition-colors">
                    Player Availability
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column: The Feed (6/12 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Create Post / Search Player section */}
            <Card className="border-border bg-card shadow-sm p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Trigger Dialog for adding post */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="w-full flex items-center justify-center gap-2 py-6 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-90 transition-all shadow-sm">
                      <Plus className="h-5 w-5" />
                      Add Post
                    </Button>
                  </DialogTrigger>
                  
                  {/* Create Post Dialog Content */}
                  <DialogContent className="sm:max-w-[550px] bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Create a post</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex gap-3 mt-4 items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-sm">{user?.firstName} {user?.lastName}</h4>
                        <span className="text-xs text-muted-foreground">Posting to community</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      <Textarea
                        placeholder="What did you achieve? Share match scores, personal milestones, or highlight clips..."
                        className="min-h-[140px] resize-none border-border focus:ring-primary focus-visible:ring-primary text-base"
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                      />

                      {/* Image Upload Area inside modal */}
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleImageUpload}
                        />

                        {uploadingImage && (
                          <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-md bg-muted/30">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Uploading image...</p>
                            </div>
                          </div>
                        )}

                        {!uploadingImage && !imageUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 py-6 border-dashed"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            Add a photo of your achievement
                          </Button>
                        )}

                        {imageUrl && (
                          <div className="relative rounded-md overflow-hidden border border-border h-48 bg-black/5">
                            <img
                              src={imageUrl}
                              alt="Upload preview"
                              className="w-full h-full object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
                              onClick={() => setImageUrl(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreateOpen(false);
                          setImageUrl(null);
                          setPostText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={!postText.trim() || uploadingImage || createAchievementMutation.isPending}
                        onClick={handlePostSubmit}
                      >
                        {createAchievementMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Posting...
                          </>
                        ) : (
                          "Post"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Search Player Profile Button & Dialog */}
                <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-6 rounded-xl text-sm font-semibold border-border text-foreground hover:bg-muted/50 transition-all shadow-sm">
                      <Search className="h-5 w-5 text-muted-foreground" />
                      Search Player Profile
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="sm:max-w-[450px] bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Search Player Profiles</DialogTitle>
                    </DialogHeader>
                    
                    <div className="mt-4 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search players by name, role or email..."
                          className="pl-9 border-border"
                          value={playerSearchQuery}
                          onChange={(e) => setPlayerSearchQuery(e.target.value)}
                        />
                        {playerSearchQuery && (
                          <button
                            onClick={() => setPlayerSearchQuery("")}
                            className="absolute right-3 top-2.5 hover:text-foreground text-muted-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {isSearchLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : searchPlayers.length === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            {playerSearchQuery ? "No players found matching your search." : "Type to search players..."}
                          </div>
                        ) : (
                          searchPlayers.map((player) => (
                            <button
                              key={player.id}
                              onClick={() => {
                                setSelectedPlayer(player);
                                setIsSearchOpen(false);
                                setPlayerSearchQuery("");
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-left border border-transparent hover:border-border transition-all"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {player.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-sm text-foreground truncate">{player.name}</h5>
                                <p className="text-xs text-muted-foreground truncate">
                                  {player.role ? player.role.charAt(0).toUpperCase() + player.role.slice(1) : "No role"} 
                                  {player.teamName ? ` • ${player.teamName}` : ""}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator className="my-3" />
              
              {/* Filter Tabs underneath create input */}
              <div className="flex justify-around">
                <button
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "my-posts" && !selectedPlayer
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                  onClick={() => {
                    setSelectedPlayer(null);
                    setActiveTab("my-posts");
                  }}
                >
                  <ImageIcon className="h-4 w-4 text-emerald-500" />
                  <span>My Posts</span>
                </button>
                <button
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "achievements" && !selectedPlayer
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                  onClick={() => {
                    setSelectedPlayer(null);
                    setActiveTab("achievements");
                  }}
                >
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span>Achievements</span>
                </button>
              </div>
            </Card>

            {/* Achievements Feed List */}
            <div className="space-y-6">
              {selectedPlayer && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-primary/20 bg-primary/5 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {selectedPlayer.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary/70">
                          Filtering Feed
                        </span>
                        <h4 className="font-bold text-sm text-foreground leading-tight">
                          {selectedPlayer.name}'s Achievements
                        </h4>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPlayer(null)}
                      className="text-muted-foreground hover:text-foreground h-8 px-2"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filter
                    </Button>
                  </Card>
                </motion.div>
              )}

              {isFeedLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading achievements feed...</p>
                </div>
              ) : filteredAchievements.length === 0 ? (
                <Card className="p-8 text-center border-border bg-card">
                  <div className="max-w-xs mx-auto">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-semibold text-lg">No posts yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPlayer
                        ? `No achievements posted by ${selectedPlayer.name} yet.`
                        : activeTab === "my-posts"
                        ? "You haven't shared any posts yet. Post your first sports achievement!"
                        : "No achievements posted by other users yet!"}
                    </p>
                    {selectedPlayer ? (
                      <Button className="mt-4" variant="outline" onClick={() => setSelectedPlayer(null)}>
                        View All Feed
                      </Button>
                    ) : activeTab === "my-posts" ? (
                      <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                        Share Achievement
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ) : (
                <AnimatePresence>
                  {filteredAchievements.map((post) => {
                    const isLiked = post.likes?.includes(user?.id || "");
                    const isAuthor = post.userId === user?.id;
                    const isAdmin = user?.isAdmin || false;

                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="border-border bg-card shadow-sm overflow-hidden">
                          {/* Post Header */}
                          <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start space-y-0">
                            <div className="flex gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={post.userAvatar || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {post.userName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-bold text-sm text-foreground">
                                  {post.userName}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                                </span>
                              </div>
                            </div>

                            {/* Dropdown Options (Delete) */}
                            {(isAuthor || isAdmin) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-border">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive flex gap-2 cursor-pointer"
                                    onClick={() => deleteMutation.mutate(post.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete post
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </CardHeader>

                          {/* Post Content */}
                          <CardContent className="p-4 pt-2 pb-3 space-y-3">
                            <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">
                              {post.text}
                            </p>

                            {/* Post Image */}
                            {post.imageUrl && (
                              <div className="rounded-lg overflow-hidden border border-border bg-muted/10 max-h-[400px] flex items-center justify-center">
                                <img
                                  src={post.imageUrl}
                                  alt="Achievement attachment"
                                  className="w-full object-contain max-h-[400px]"
                                />
                              </div>
                            )}

                            {/* Likes and Comments stats */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5">
                              <span className="flex items-center gap-1 hover:underline cursor-pointer">
                                <ThumbsUp className="h-3 w-3 text-primary fill-primary/10" />
                                {post.likes?.length || 0} likes
                              </span>
                              <span
                                className="hover:underline cursor-pointer"
                                onClick={() => toggleComments(post.id)}
                              >
                                {post.comments?.length || 0} comments
                              </span>
                            </div>

                            <Separator className="my-1.5" />

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`flex-1 flex gap-2 items-center justify-center text-xs font-semibold ${
                                  isLiked
                                    ? "text-primary hover:text-primary/95"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                onClick={() => likeMutation.mutate(post.id)}
                              >
                                <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} />
                                {isLiked ? "Liked" : "Like"}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 flex gap-2 items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground"
                                onClick={() => toggleComments(post.id)}
                              >
                                <MessageSquare className="h-4 w-4" />
                                Comment
                              </Button>
                            </div>

                            {/* Expanded Comments Section */}
                            {expandedComments[post.id] && (
                              <div className="pt-4 space-y-4 border-t border-border mt-3">
                                {/* Comment form */}
                                <div className="flex gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.profileImageUrl || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {user?.firstName?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 flex gap-2">
                                    <Input
                                      placeholder="Write a comment..."
                                      className="h-8 text-xs border-border"
                                      value={commentTexts[post.id] || ""}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setCommentTexts((prev) => ({
                                          ...prev,
                                          [post.id]: e.target.value,
                                        }))
                                      }
                                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === "Enter") {
                                          handleCommentSubmit(post.id);
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      className="h-8 w-8 p-0 shrink-0"
                                      disabled={
                                        !commentTexts[post.id] ||
                                        !commentTexts[post.id].trim() ||
                                        commentMutation.isPending
                                      }
                                      onClick={() => handleCommentSubmit(post.id)}
                                    >
                                      {commentMutation.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Send className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Comments list */}
                                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                                  {post.comments && post.comments.length > 0 ? (
                                    post.comments.map((comment) => (
                                      <div key={comment.id} className="flex gap-3 items-start text-xs">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={comment.userAvatar || undefined} />
                                          <AvatarFallback className="bg-primary/10 text-primary">
                                            {comment.userName?.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 bg-muted p-2.5 rounded-lg">
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-bold text-foreground">
                                              {comment.userName}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                              {comment.createdAt
                                                ? formatDistanceToNow(new Date(comment.createdAt), {
                                                    addSuffix: true,
                                                  })
                                                : ""}
                                            </span>
                                          </div>
                                          <p className="text-foreground leading-normal whitespace-pre-wrap">
                                            {comment.text}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      No comments yet. Write a comment to kickstart the conversation!
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Right Column: Widgets / Suggested content (3/12 cols) */}
          <div className="lg:col-span-3 hidden lg:block space-y-6">
            
            {/* Community guidelines widget */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent" />
                  Community Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground space-y-2 leading-relaxed">
                <p>
                  <strong>✨ Show Off Your Wins:</strong> Shared a great score, ran a marathon, or hit a match milestone? Post it!
                </p>
                <p>
                  <strong>🤝 Be Supportive:</strong> Celebrate other users' achievements with likes and comments. Respect every player.
                </p>
                <p>
                  <strong>📷 Upload Media:</strong> Pictures speak louder! Add ground photos, team lineup screenshots, or scoreboard photos.
                </p>
              </CardContent>
            </Card>

            {/* trending highlights widget */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="h-4 w-4 text-accent animate-pulse" />
                  Community Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3.5">
                <div className="flex items-start gap-2.5 text-xs">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">
                    MATCH
                  </Badge>
                  <div>
                    <h5 className="font-semibold text-foreground">IPL Local Leagues</h5>
                    <p className="text-muted-foreground mt-0.5">Dinesh Madhavan scored a century in friendly matches!</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 shrink-0">
                    TEAM
                  </Badge>
                  <div>
                    <h5 className="font-semibold text-foreground">Titans CC</h5>
                    <p className="text-muted-foreground mt-0.5">Won the Regional Cup yesterday with an outstanding 10-wicket victory!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
