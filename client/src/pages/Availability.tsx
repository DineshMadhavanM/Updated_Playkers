import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "../components/navigation";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { insertMatchAvailabilitySchema, insertPlayerAvailabilitySchema, type MatchAvailability, type PlayerAvailability } from "../../../shared/schema";
import { Calendar as CalendarIcon, MapPin, User, Users, Info, Plus, Search, Trophy, TrendingUp, Filter, ArrowRight, Phone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { Calendar } from "../components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

interface ContactFormData {
    name: string;
    phoneNumber: string;
    place: string;
}

export default function Availability() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [matchDialogOpen, setMatchDialogOpen] = useState(false);
    const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
    const [searchRegion, setSearchRegion] = useState(user?.region || "");
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [contactTarget, setContactTarget] = useState<{ postId: string; postType: "match" | "player"; postDescription: string } | null>(null);
    const [contactForm, setContactForm] = useState<ContactFormData>({ name: "", phoneNumber: "", place: "" });
    const [contactErrors, setContactErrors] = useState<Partial<ContactFormData>>({});

    // Update searchRegion when user region loads
    if (user?.region && !searchRegion) {
        setSearchRegion(user.region);
    }

    const { data: matchPosts = [], isLoading: isLoadingMatch } = useQuery<MatchAvailability[]>({
        queryKey: ["/api/availability/match", searchRegion],
        queryFn: async () => {
            const query = searchRegion ? `?region=${encodeURIComponent(searchRegion)}` : "";
            const res = await fetch(`/api/availability/match${query}`);
            if (!res.ok) throw new Error("Failed to fetch match availability");
            return res.json();
        }
    });

    const { data: playerPosts = [], isLoading: isLoadingPlayer } = useQuery<PlayerAvailability[]>({
        queryKey: ["/api/availability/player", searchRegion],
        queryFn: async () => {
            const query = searchRegion ? `?region=${encodeURIComponent(searchRegion)}` : "";
            const res = await fetch(`/api/availability/player${query}`);
            if (!res.ok) throw new Error("Failed to fetch player availability");
            return res.json();
        }
    });

    const matchForm = useForm({
        resolver: zodResolver(insertMatchAvailabilitySchema.omit({ authorId: true })),
        defaultValues: {
            matchDate: new Date(),
            location: "",
            region: user?.region || "",
            requiredPlayersCount: 1,
            roleRequired: "",
            description: "",
            teamId: null,
        },
    });

    const playerForm = useForm({
        resolver: zodResolver(insertPlayerAvailabilitySchema.omit({ authorId: true })),
        defaultValues: {
            availableDate: new Date(),
            role: "",
            region: user?.region || "",
            experience: "",
            playerId: null,
        },
    });

    const createMatchPostMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiRequest("POST", "/api/availability/match", data);
        },
        onSuccess: (data, variables) => {
            toast({ title: "Post created", description: "Your match availability is now live." });
            setMatchDialogOpen(false);
            matchForm.reset();
            setSearchRegion(variables.region);
            queryClient.invalidateQueries({ queryKey: ["/api/availability/match"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Refresh user profile for region sync
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to create post",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const createPlayerPostMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiRequest("POST", "/api/availability/player", data);
        },
        onSuccess: (data, variables) => {
            toast({ title: "Post created", description: "Your availability is now live." });
            setPlayerDialogOpen(false);
            playerForm.reset();
            setSearchRegion(variables.region);
            queryClient.invalidateQueries({ queryKey: ["/api/availability/player"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Refresh user profile for region sync
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to create post",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const contactMutation = useMutation({
        mutationFn: async (data: ContactFormData & { postId: string; postType: string; postDescription: string }) => {
            const response = await apiRequest("POST", "/api/availability/contact", {
                name: data.name,
                phoneNumber: data.phoneNumber,
                place: data.place,
                postId: data.postId,
                postType: data.postType,
                postDescription: data.postDescription,
            });
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Contact Request Sent! 🎉",
                description: `Your request has been submitted. You will be contacted at ${contactForm.phoneNumber}.`,
            });
            setContactDialogOpen(false);
            setContactTarget(null);
            setContactForm({ name: "", phoneNumber: "", place: "" });
            setContactErrors({});
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to Send",
                description: error.message || "Could not submit request. Please try again.",
                variant: "destructive",
            });
        },
    });

    const validateContact = (): boolean => {
        const errors: Partial<ContactFormData> = {};
        if (!contactForm.name.trim()) errors.name = "Name is required";
        if (!contactForm.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
        else if (!/^\d{10}$/.test(contactForm.phoneNumber.replace(/\s/g, "")))
            errors.phoneNumber = "Enter a valid 10-digit phone number";
        if (!contactForm.place.trim()) errors.place = "Place is required";
        setContactErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleContactSubmit = () => {
        if (!contactTarget) return;
        if (validateContact()) {
            contactMutation.mutate({ ...contactForm, ...contactTarget });
        }
    };

    const openContact = (postId: string, postType: "match" | "player", postDescription: string) => {
        setContactTarget({ postId, postType, postDescription });
        setContactForm({
            name: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "",
            phoneNumber: "",
            place: user?.region || "",
        });
        setContactErrors({});
        setContactDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <Navigation />

            <div className="bg-primary/5 border-b border-primary/10 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Regional Availability</h1>
                            <p className="text-muted-foreground text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                {user?.region ? (
                                    <>Showing posts in <span className="text-primary font-bold">{searchRegion || user.region}</span></>
                                ) : (
                                    <span>Set your region to see local posts</span>
                                )}
                            </p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="relative w-64 mr-2">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search region..."
                                    value={searchRegion}
                                    onChange={(e) => setSearchRegion(e.target.value)}
                                    className="pl-8 bg-background/50 border-primary/20 focus:border-primary/50 transition-all"
                                />
                            </div>
                            <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="shadow-lg hover:shadow-primary/20 transition-all">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Find Players
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Looking for Players?</DialogTitle>
                                        <DialogDescription>
                                            Post your match details and find players in {user?.region || "your area"}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...matchForm}>
                                        <form onSubmit={matchForm.handleSubmit((data) => createMatchPostMutation.mutate(data))} className="space-y-4 pt-4">
                                            <FormField
                                                control={matchForm.control}
                                                name="region"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Region</FormLabel>
                                                        <FormControl><Input {...field} placeholder="e.g. London" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={matchForm.control}
                                                name="location"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Location</FormLabel>
                                                        <FormControl><Input {...field} placeholder="e.g. Lords Ground" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={matchForm.control}
                                                    name="matchDate"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel>Match Date</FormLabel>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            variant={"outline"}
                                                                            className={cn(
                                                                                "w-full pl-3 text-left font-normal",
                                                                                !field.value && "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            {field.value ? (
                                                                                format(field.value, "PPP")
                                                                            ) : (
                                                                                <span>Pick a date</span>
                                                                            )}
                                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={field.value}
                                                                        onSelect={field.onChange}
                                                                        disabled={(date) =>
                                                                            date < new Date() || date < new Date("1900-01-01")
                                                                        }
                                                                        initialFocus
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={matchForm.control}
                                                    name="requiredPlayersCount"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Players Needed</FormLabel>
                                                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={matchForm.control}
                                                name="roleRequired"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Role Needed</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a role" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Batsman">Batsman</SelectItem>
                                                                <SelectItem value="Bowler">Bowler</SelectItem>
                                                                <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
                                                                <SelectItem value="All-rounder">All-rounder</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={matchForm.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl><Textarea {...field} placeholder="Tell players about the match..." /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full" disabled={createMatchPostMutation.isPending}>
                                                {createMatchPostMutation.isPending ? "Posting..." : "Create Post"}
                                            </Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="shadow-sm hover:bg-primary/5">
                                        <User className="h-4 w-4 mr-2" />
                                        Find a Match
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Post Your Availability</DialogTitle>
                                        <DialogDescription>
                                            Let teams in {user?.region || "your area"} know you're ready to play.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...playerForm}>
                                        <form onSubmit={playerForm.handleSubmit((data) => createPlayerPostMutation.mutate(data))} className="space-y-4 pt-4">
                                            <FormField
                                                control={playerForm.control}
                                                name="region"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Region</FormLabel>
                                                        <FormControl><Input {...field} placeholder="e.g. London" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={playerForm.control}
                                                name="role"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Preferred Role</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a role" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Batsman">Batsman</SelectItem>
                                                                <SelectItem value="Bowler">Bowler</SelectItem>
                                                                <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
                                                                <SelectItem value="All-rounder">All-rounder</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={playerForm.control}
                                                name="availableDate"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Preferred Date</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-full pl-3 text-left font-normal",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(field.value, "PPP")
                                                                        ) : (
                                                                            <span>Pick a date</span>
                                                                        )}
                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value}
                                                                    onSelect={field.onChange}
                                                                    disabled={(date) =>
                                                                        date < new Date() || date < new Date("1900-01-01")
                                                                    }
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={playerForm.control}
                                                name="experience"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Experience Level</FormLabel>
                                                        <FormControl><Input {...field} placeholder="e.g. Intermediate" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full" disabled={createPlayerPostMutation.isPending}>
                                                {createPlayerPostMutation.isPending ? "Posting..." : "Post Availability"}
                                            </Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Tabs defaultValue="find-players" className="space-y-8">
                    <TabsList className="bg-muted p-1 rounded-xl w-fit">
                        <TabsTrigger value="find-players" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Users className="h-4 w-4 mr-2" />
                            Find Players
                        </TabsTrigger>
                        <TabsTrigger value="find-matches" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Trophy className="h-4 w-4 mr-2" />
                            Find Matches
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="find-players">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoadingMatch ? (
                                Array(3).fill(0).map((_, i) => <Card key={i} className="h-64 animate-pulse bg-muted" />)
                            ) : matchPosts.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                    <p className="text-xl text-muted-foreground">No matches looking for players in your region yet.</p>
                                </div>
                            ) : (
                                matchPosts.map((post) => (
                                    <Card key={post.id} className="group hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                                        <CardHeader>
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge className="bg-primary/10 text-primary border-primary/20 pointer-events-none">
                                                    {post.roleRequired} Required
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{format(new Date(post.createdAt), 'MMM d')}</span>
                                            </div>
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">{post.requiredPlayersCount} Players Needed</CardTitle>
                                            <CardDescription className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {post.location}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                                                {post.description}
                                            </p>
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8 ring-2 ring-background">
                                                        <AvatarFallback className="text-[10px] bg-primary/5">OP</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">Team Host</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="group/btn"
                                                    onClick={() => openContact(post.id, "match", `${post.roleRequired} needed at ${post.location} — ${post.requiredPlayersCount} players`)}
                                                >
                                                    Contact <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="find-matches">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoadingPlayer ? (
                                Array(3).fill(0).map((_, i) => <Card key={i} className="h-64 animate-pulse bg-muted" />)
                            ) : playerPosts.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                    <p className="text-xl text-muted-foreground">No players available in your region yet.</p>
                                </div>
                            ) : (
                                playerPosts.map((post) => (
                                    <Card key={post.id} className="group hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                                        <CardHeader>
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="border-primary/30 text-primary pointer-events-none">
                                                    {post.experience}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{format(new Date(post.createdAt), 'MMM d')}</span>
                                            </div>
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">{post.role}</CardTitle>
                                            <CardDescription className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3 text-green-500" /> Available now
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                                    <Avatar className="h-10 w-10 border-2 border-background">
                                                        <AvatarFallback>PL</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold">Available Player</p>
                                                        <p className="text-xs text-muted-foreground">Looking for {post.role} matches</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    className="w-full shadow-md hover:shadow-primary/20 transition-all"
                                                    onClick={() => openContact(post.id, "player", `${post.role} player available in ${post.region}`)}
                                                >
                                                    <Phone className="h-4 w-4 mr-2" /> Invite to Match
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Contact Dialog */}
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            Contact Request
                        </DialogTitle>
                        <DialogDescription>
                            Fill in your details below. They will contact you to arrange the match.
                        </DialogDescription>
                    </DialogHeader>

                    {contactTarget && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground mb-2">
                            <Info className="h-3 w-3 inline mr-1" />
                            {contactTarget.postDescription}
                        </div>
                    )}

                    <div className="space-y-4 py-2">
                        {/* Name */}
                        <div className="space-y-1">
                            <Label htmlFor="contact-name">Your Name *</Label>
                            <Input
                                id="contact-name"
                                placeholder="Enter your full name"
                                value={contactForm.name}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, name: e.target.value }));
                                    if (contactErrors.name) setContactErrors(prev => ({ ...prev, name: "" }));
                                }}
                            />
                            {contactErrors.name && <p className="text-xs text-destructive">{contactErrors.name}</p>}
                        </div>

                        {/* Phone */}
                        <div className="space-y-1">
                            <Label htmlFor="contact-phone">Phone Number *</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="contact-phone"
                                    placeholder="e.g., 9876543210"
                                    type="tel"
                                    className="pl-9"
                                    value={contactForm.phoneNumber}
                                    onChange={(e) => {
                                        setContactForm(prev => ({ ...prev, phoneNumber: e.target.value }));
                                        if (contactErrors.phoneNumber) setContactErrors(prev => ({ ...prev, phoneNumber: "" }));
                                    }}
                                />
                            </div>
                            {contactErrors.phoneNumber && <p className="text-xs text-destructive">{contactErrors.phoneNumber}</p>}
                        </div>

                        {/* Place */}
                        <div className="space-y-1">
                            <Label htmlFor="contact-place">Your Place / Location *</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="contact-place"
                                    placeholder="e.g., Coimbatore, Tamil Nadu"
                                    className="pl-9"
                                    value={contactForm.place}
                                    onChange={(e) => {
                                        setContactForm(prev => ({ ...prev, place: e.target.value }));
                                        if (contactErrors.place) setContactErrors(prev => ({ ...prev, place: "" }));
                                    }}
                                />
                            </div>
                            {contactErrors.place && <p className="text-xs text-destructive">{contactErrors.place}</p>}
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleContactSubmit}
                            disabled={contactMutation.isPending}
                            className="flex items-center gap-2"
                        >
                            {contactMutation.isPending ? (
                                <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Sending...</>
                            ) : (
                                <><Phone className="h-4 w-4" /> Send Contact Request</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
