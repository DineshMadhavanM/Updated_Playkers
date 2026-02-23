import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import type {
  User,
  UpsertUser,
  Venue,
  InsertVenue,
  Match,
  InsertMatch,
  InsertCricketMatch,
  MatchParticipant,
  InsertMatchParticipant,
  Booking,
  InsertBooking,
  Product,
  InsertProduct,
  Review,
  InsertReview,
  CartItem,
  InsertCartItem,
  UserStats,
  Team,
  InsertTeam,
  Player,
  InsertPlayer,
  PlayerPerformance,
  InsertPlayerPerformance,
  Invitation,
  InsertInvitation,
  Notification,
  InsertNotification,
  MatchAvailability,
  InsertMatchAvailability,
  PlayerAvailability,
  InsertPlayerAvailability,
} from "@shared/schema";
import type { IStorage } from './storage';

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private venues = new Map<string, Venue>();
  private matches = new Map<string, Match>();
  private matchParticipants = new Map<string, MatchParticipant>();
  private bookings = new Map<string, Booking>();
  private products = new Map<string, Product>();
  private reviews = new Map<string, Review>();
  private cartItems = new Map<string, CartItem>();
  private userStats = new Map<string, UserStats>();
  private teams = new Map<string, Team>();
  private players = new Map<string, Player>();
  private playerPerformances = new Map<string, PlayerPerformance>();
  private invitations = new Map<string, Invitation>();

  private notifications = new Map<string, Notification>();
  private matchAvailability = new Map<string, MatchAvailability>();
  private playerAvailability = new Map<string, PlayerAvailability>();

  constructor() {
    // Initialize with some seed data
    this.initializeSeedData();
  }

  private initializeSeedData() {
    // Add some sample venues
    const venue1: Venue = {
      id: uuidv4(),
      name: "Central Sports Complex",
      description: "Modern sports facility with multiple fields",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      latitude: "40.7128",
      longitude: "-74.0060",
      sports: ["football", "soccer"],
      pricePerHour: "50.00",
      facilities: ["parking", "showers", "equipment rental"],
      images: [],
      timing: null,
      googleMapsUrl: null,
      phoneNumber: null,
      ownerEmail: null,
      rating: "4.5",
      totalReviews: 25,
      ownerId: "owner1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const venue2: Venue = {
      id: uuidv4(),
      name: "Tennis Club Elite",
      description: "Premium tennis courts with professional lighting",
      address: "456 Court Ave",
      city: "Los Angeles",
      state: "CA",
      latitude: "34.0522",
      longitude: "-118.2437",
      sports: ["tennis"],
      pricePerHour: "75.00",
      facilities: ["parking", "pro shop", "coaching"],
      images: [],
      timing: null,
      googleMapsUrl: null,
      phoneNumber: null,
      ownerEmail: null,
      rating: "4.8",
      totalReviews: 45,
      ownerId: "owner2",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.venues.set(venue1.id, venue1);
    this.venues.set(venue2.id, venue2);

    // Add some sample products
    const product1: Product = {
      id: uuidv4(),
      name: "Professional Football",
      description: "Official size football for competitive play",
      category: "equipment",
      subcategory: "balls",
      price: "29.99",
      discountPrice: null,
      images: [],
      brand: "SportsPro",
      specifications: null,
      inStock: true,
      stockQuantity: 50,
      rating: "4.2",
      totalReviews: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const product2: Product = {
      id: uuidv4(),
      name: "Tennis Racket Pro",
      description: "High-quality tennis racket for professionals",
      category: "equipment",
      subcategory: "rackets",
      price: "149.99",
      discountPrice: null,
      images: [],
      brand: "TennisPro",
      specifications: null,
      inStock: true,
      stockQuantity: 25,
      rating: "4.7",
      totalReviews: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.set(product1.id, product1);
    this.products.set(product2.id, product2);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: { email: string; password: string; username?: string | null; firstName?: string | null; lastName?: string | null; profileImageUrl?: string | null; dateOfBirth?: string | null; location?: string | null; phoneNumber?: string | null; region?: string | null; isAdmin?: boolean }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user: User = {
      id: uuidv4(),
      email: userData.email,
      password: hashedPassword,
      username: userData.username || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
      location: userData.location || null,
      phoneNumber: userData.phoneNumber || null,
      region: userData.region || null,
      isAdmin: userData.isAdmin || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }



  // Availability post operations
  async createMatchAvailability(postData: InsertMatchAvailability): Promise<MatchAvailability> {
    const post: MatchAvailability = {
      id: uuidv4(),
      ...postData,
      teamId: postData.teamId || null,
      createdAt: new Date(),
    };
    this.matchAvailability.set(post.id, post);
    return post;
  }

  async getMatchAvailability(region: string): Promise<MatchAvailability[]> {
    return Array.from(this.matchAvailability.values())
      .filter((post) => post.region.toLowerCase() === region.toLowerCase())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createPlayerAvailability(postData: InsertPlayerAvailability): Promise<PlayerAvailability> {
    const post: PlayerAvailability = {
      id: uuidv4(),
      ...postData,
      playerId: postData.playerId || null,
      createdAt: new Date(),
    };
    this.playerAvailability.set(post.id, post);
    return post;
  }

  async getPlayerAvailability(region: string): Promise<PlayerAvailability[]> {
    return Array.from(this.playerAvailability.values())
      .filter((post) => post.region.toLowerCase() === region.toLowerCase())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.id && this.users.has(userData.id)) {
      const existing = this.users.get(userData.id)!;
      const updated = { ...existing, ...userData };
      this.users.set(userData.id, updated);
      return updated;
    } else {
      const user: User = {
        id: userData.id || uuidv4(),
        email: userData.email,
        password: userData.password || '',
        username: userData.username || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        location: userData.location || null,
        phoneNumber: userData.phoneNumber || null,
        region: userData.region || null,
        isAdmin: userData.isAdmin || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(user.id, user);
      return user;
    }
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...user, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Venue operations
  async getVenues(filters?: { sport?: string; city?: string; search?: string }): Promise<Venue[]> {
    let venues = Array.from(this.venues.values());

    if (filters?.sport) {
      venues = venues.filter(v => v.sports.includes(filters.sport!));
    }
    if (filters?.city) {
      venues = venues.filter(v => v.city.toLowerCase().includes(filters.city!.toLowerCase()));
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      venues = venues.filter(v =>
        v.name.toLowerCase().includes(search) ||
        v.description?.toLowerCase().includes(search)
      );
    }

    return venues;
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    return this.venues.get(id);
  }

  async createVenue(venueData: InsertVenue): Promise<Venue> {
    const venue: Venue = {
      id: uuidv4(),
      ...venueData,
      description: venueData.description || null,
      latitude: venueData.latitude || null,
      longitude: venueData.longitude || null,
      facilities: venueData.facilities || [],
      images: venueData.images || [],
      timing: venueData.timing || null,
      googleMapsUrl: venueData.googleMapsUrl || null,
      phoneNumber: venueData.phoneNumber || null,
      ownerEmail: venueData.ownerEmail || null,
      rating: venueData.rating || null,
      totalReviews: venueData.totalReviews || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.venues.set(venue.id, venue);
    return venue;
  }

  async updateVenue(id: string, venueData: Partial<InsertVenue>): Promise<Venue | undefined> {
    const existing = this.venues.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...venueData };
    this.venues.set(id, updated);
    return updated;
  }

  async deleteVenue(id: string): Promise<boolean> {
    return this.venues.delete(id);
  }

  async getUserVenues(userId: string): Promise<Venue[]> {
    return Array.from(this.venues.values()).filter(v => v.ownerId === userId);
  }

  // Match operations
  async getMatches(filters?: { sport?: string; status?: string; isPublic?: boolean }): Promise<Match[]> {
    let matches = Array.from(this.matches.values());

    if (filters?.sport) {
      matches = matches.filter(m => m.sport === filters.sport);
    }
    if (filters?.status) {
      matches = matches.filter(m => m.status === filters.status);
    }
    if (filters?.isPublic !== undefined) {
      matches = matches.filter(m => m.isPublic === filters.isPublic);
    }

    return matches;
  }

  async getMatch(id: string): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async createMatch(matchData: InsertMatch): Promise<Match> {
    const match: Match = {
      id: uuidv4(),
      ...matchData,
      isPublic: matchData.isPublic || false,
      duration: matchData.duration || null,
      currentPlayers: matchData.currentPlayers || 0,
      status: matchData.status || 'scheduled',
      team1Name: matchData.team1Name || null,
      team2Name: matchData.team2Name || null,
      team1Score: matchData.team1Score || null,
      team2Score: matchData.team2Score || null,
      matchData: matchData.matchData || null,
      description: matchData.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.matches.set(match.id, match);
    return match;
  }

  async updateMatch(id: string, matchData: Partial<InsertMatch>): Promise<Match | undefined> {
    const existing = this.matches.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...matchData };
    this.matches.set(id, updated);
    return updated;
  }

  async deleteMatch(id: string): Promise<boolean> {
    return this.matches.delete(id);
  }

  async getUserMatches(userId: string): Promise<Match[]> {
    const userParticipants = Array.from(this.matchParticipants.values())
      .filter(p => p.userId === userId);
    const matchIds = userParticipants.map(p => p.matchId);

    return Array.from(this.matches.values())
      .filter(m => matchIds.includes(m.id) || m.organizerId === userId);
  }

  // Match participant operations
  async addMatchParticipant(participantData: InsertMatchParticipant): Promise<MatchParticipant> {
    const participant: MatchParticipant = {
      id: uuidv4(),
      ...participantData,
      team: participantData.team || null,
      role: participantData.role || 'player',
      status: participantData.status || 'joined',
      joinedAt: new Date(),
    };
    this.matchParticipants.set(participant.id, participant);
    return participant;
  }

  async removeMatchParticipant(matchId: string, userId: string): Promise<boolean> {
    for (const [id, participant] of Array.from(this.matchParticipants.entries())) {
      if (participant.matchId === matchId && participant.userId === userId) {
        this.matchParticipants.delete(id);
        return true;
      }
    }
    return false;
  }

  async getMatchParticipants(matchId: string): Promise<MatchParticipant[]> {
    return Array.from(this.matchParticipants.values())
      .filter(p => p.matchId === matchId);
  }

  // Booking operations
  async getBookings(userId?: string): Promise<Booking[]> {
    let bookings = Array.from(this.bookings.values());
    if (userId) {
      bookings = bookings.filter(b => b.userId === userId);
    }
    return bookings;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getVenueBookings(venueId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(b => b.venueId === venueId);
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      id: uuidv4(),
      ...bookingData,
      matchId: bookingData.matchId || null,
      status: bookingData.status || 'confirmed',
      paymentStatus: bookingData.paymentStatus || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async updateBooking(id: string, bookingData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existing = this.bookings.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...bookingData };
    this.bookings.set(id, updated);
    return updated;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  // Product operations
  async getProducts(filters?: { category?: string; search?: string }): Promise<Product[]> {
    let products = Array.from(this.products.values());

    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    }

    return products;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const product: Product = {
      id: uuidv4(),
      ...productData,
      description: productData.description || null,
      subcategory: productData.subcategory || null,
      discountPrice: productData.discountPrice || null,
      images: productData.images || [],
      brand: productData.brand || null,
      specifications: productData.specifications || null,
      inStock: productData.inStock || true,
      stockQuantity: productData.stockQuantity || 0,
      rating: productData.rating || null,
      totalReviews: productData.totalReviews || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...productData };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values())
      .filter(item => item.userId === userId);
  }

  async addToCart(itemData: InsertCartItem): Promise<CartItem> {
    const item: CartItem = {
      id: uuidv4(),
      ...itemData,
      quantity: itemData.quantity || 1,
      createdAt: new Date(),
    };
    this.cartItems.set(item.id, item);
    return item;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const existing = this.cartItems.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, quantity };
    this.cartItems.set(id, updated);
    return updated;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: string): Promise<boolean> {
    let cleared = false;
    for (const [id, item] of Array.from(this.cartItems.entries())) {
      if (item.userId === userId) {
        this.cartItems.delete(id);
        cleared = true;
      }
    }
    return cleared;
  }

  // Review operations
  async getReviews(venueId?: string, productId?: string): Promise<Review[]> {
    let reviews = Array.from(this.reviews.values());

    if (venueId) {
      reviews = reviews.filter(r => r.venueId === venueId);
    }
    if (productId) {
      reviews = reviews.filter(r => r.productId === productId);
    }

    return reviews;
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const review: Review = {
      id: uuidv4(),
      ...reviewData,
      venueId: reviewData.venueId || null,
      productId: reviewData.productId || null,
      comment: reviewData.comment || null,
      images: reviewData.images || [],
      isVerified: reviewData.isVerified || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reviews.set(review.id, review);
    return review;
  }

  async updateReview(id: string, reviewData: Partial<InsertReview>): Promise<Review | undefined> {
    const existing = this.reviews.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...reviewData };
    this.reviews.set(id, updated);
    return updated;
  }

  async deleteReview(id: string): Promise<boolean> {
    return this.reviews.delete(id);
  }

  // User stats operations
  async getUserStats(userId: string): Promise<UserStats[]> {
    return Array.from(this.userStats.values())
      .filter(stats => stats.userId === userId);
  }

  async updateUserStats(userId: string, sport: string, stats: any): Promise<UserStats> {
    // Find existing stats for this user and sport
    let existingStats: UserStats | undefined;
    for (const [id, userStat] of Array.from(this.userStats.entries())) {
      if (userStat.userId === userId && userStat.sport === sport) {
        existingStats = userStat;
        break;
      }
    }

    if (existingStats) {
      const updated = { ...existingStats, stats };
      this.userStats.set(existingStats.id, updated);
      return updated;
    } else {
      const newStats: UserStats = {
        id: uuidv4(),
        userId,
        sport,
        matchesPlayed: stats.matchesPlayed || 0,
        matchesWon: stats.matchesWon || 0,
        totalScore: stats.totalScore || 0,
        bestPerformance: stats.bestPerformance || null,
        stats: stats.stats || null,
        updatedAt: new Date(),
      };
      this.userStats.set(newStats.id, newStats);
      return newStats;
    }
  }

  // Team operations
  async getTeams(filters?: { search?: string; sport?: string }): Promise<Team[]> {
    let teams = Array.from(this.teams.values());
    if (filters?.sport) {
      teams = teams.filter(t => t.sport === filters.sport);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      teams = teams.filter(t => t.name.toLowerCase().includes(search));
    }
    return teams;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const team: Team = {
      id: uuidv4(),
      ...teamData,
      shortName: teamData.shortName || null,
      description: teamData.description || null,
      city: teamData.city || null,
      captainId: teamData.captainId || null,
      viceCaptainId: teamData.viceCaptainId || null,
      logo: teamData.logo || null,
      homeVenueId: teamData.homeVenueId || null,
      totalMatches: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesDrawn: 0,
      totalRunsScored: 0,
      totalRunsConceded: 0,
      totalWicketsTaken: 0,
      totalWicketsLost: 0,
      tournamentPoints: 0,
      netRunRate: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.teams.set(team.id, team);
    return team;
  }

  async updateTeam(id: string, teamData: Partial<InsertTeam>): Promise<Team | undefined> {
    const existing = this.teams.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...teamData, updatedAt: new Date() };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.teams.delete(id);
  }

  async updateTeamStats(id: string, stats: {
    matchesWon?: number;
    matchesLost?: number;
    matchesDrawn?: number;
    runsScored?: number;
    wicketsTaken?: number;
    tournamentPoints?: number;
  }): Promise<Team | undefined> {
    const existing = this.teams.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      matchesWon: stats.matchesWon ?? existing.matchesWon,
      matchesLost: stats.matchesLost ?? existing.matchesLost,
      matchesDrawn: stats.matchesDrawn ?? existing.matchesDrawn,
      totalRunsScored: (existing.totalRunsScored || 0) + (stats.runsScored || 0),
      totalWicketsTaken: (existing.totalWicketsTaken || 0) + (stats.wicketsTaken || 0),
      tournamentPoints: stats.tournamentPoints ?? existing.tournamentPoints,
      updatedAt: new Date()
    };
    this.teams.set(id, updated);
    return updated;
  }

  // Player operations
  async getPlayers(filters?: { teamId?: string; role?: string; search?: string }): Promise<Player[]> {
    let players = Array.from(this.players.values());
    if (filters?.teamId) {
      players = players.filter(p => p.teamId === filters.teamId);
    }
    if (filters?.role) {
      players = players.filter(p => p.role === filters.role);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      players = players.filter(p => p.name.toLowerCase().includes(search));
    }
    return players;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayerByUserId(userId: string): Promise<Player | undefined> {
    for (const player of Array.from(this.players.values())) {
      if (player.userId === userId) {
        return player;
      }
    }
    return undefined;
  }

  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    const player: Player = {
      id: uuidv4(),
      ...playerData,
      username: playerData.username || null,
      email: playerData.email || null,
      teamId: playerData.teamId || null,
      teamName: playerData.teamName || null,
      userId: playerData.userId || null,
      role: playerData.role || null,
      battingStyle: playerData.battingStyle || null,
      bowlingStyle: playerData.bowlingStyle || null,
      jerseyNumber: playerData.jerseyNumber || null,
      isGuest: playerData.isGuest || null,
      teamRole: playerData.teamRole || "player",
      careerStats: {
        totalRuns: 0,
        totalBallsFaced: 0,
        totalFours: 0,
        totalSixes: 0,
        highestScore: 0,
        centuries: 0,
        halfCenturies: 0,
        innings: 0,
        dismissals: 0,
        battingAverage: 0,
        strikeRate: 0,
        totalOvers: 0,
        totalRunsGiven: 0,
        totalWickets: 0,
        totalMaidens: 0,
        bestBowlingFigures: null,
        fiveWicketHauls: 0,
        bowlingAverage: 0,
        economy: 0,
        catches: 0,
        runOuts: 0,
        stumpings: 0,
        totalMatches: 0,
        matchesWon: 0,
        manOfTheMatchAwards: 0,
        bestBatsmanAwards: 0,
        bestBowlerAwards: 0,
        bestFielderAwards: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.players.set(player.id, player);
    return player;
  }

  async updatePlayer(id: string, playerData: Partial<InsertPlayer>): Promise<Player | undefined> {
    const existing = this.players.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...playerData, updatedAt: new Date() };
    this.players.set(id, updated);
    return updated;
  }

  async deletePlayer(id: string): Promise<boolean> {
    return this.players.delete(id);
  }

  async updatePlayerStats(playerId: string, matchStats: any): Promise<Player | undefined> {
    const player = this.players.get(playerId);
    if (!player) return undefined;

    const careerStats = player.careerStats;
    const updatedCareerStats = {
      ...careerStats,
      totalMatches: careerStats.totalMatches + 1,
      totalRuns: careerStats.totalRuns + (matchStats.runsScored || 0),
      totalWickets: careerStats.totalWickets + (matchStats.wicketsTaken || 0),
    };

    const updated = {
      ...player,
      careerStats: updatedCareerStats,
      updatedAt: new Date()
    };
    this.players.set(playerId, updated);
    return updated;
  }

  // Performance operations
  async recordPlayerPerformance(performanceData: InsertPlayerPerformance): Promise<PlayerPerformance> {
    const performance: PlayerPerformance = {
      id: uuidv4(),
      playerId: performanceData.playerId,
      userId: performanceData.userId || null,
      matchId: performanceData.matchId,
      teamId: performanceData.teamId || null,
      teamName: performanceData.teamName || null,
      opposition: performanceData.opposition,
      venue: performanceData.venue || null,
      matchDate: performanceData.matchDate,
      matchFormat: performanceData.matchFormat || null,
      matchResult: (performanceData as any).matchResult || null,
      battingStats: (performanceData as any).battingStats || null,
      bowlingStats: (performanceData as any).bowlingStats || null,
      fieldingStats: (performanceData as any).fieldingStats || null,
      awards: performanceData.awards || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.playerPerformances.set(performance.id, performance);
    return performance;
  }

  async getPlayerPerformances(playerId: string): Promise<PlayerPerformance[]> {
    return Array.from(this.playerPerformances.values()).filter(p => p.playerId === playerId);
  }

  async getUserPerformances(userId: string): Promise<PlayerPerformance[]> {
    return Array.from(this.playerPerformances.values()).filter(p => p.userId === userId);
  }

  async updatePlayerAggregates(playerId: string, data: any): Promise<Player | undefined> {
    return this.updatePlayerStats(playerId, data);
  }

  async upsertPlayerByEmail(playerData: { name: string; email: string; teamId?: string; teamName?: string; role?: string }): Promise<Player> {
    for (const player of Array.from(this.players.values())) {
      if (player.email === playerData.email) {
        return player;
      }
    }
    return this.createPlayer(playerData as any);
  }

  async linkPlayerToUserByEmail(email: string): Promise<{ success: boolean; playerId?: string; userId?: string }> {
    const user = await this.getUserByEmail(email);
    if (!user) return { success: false };
    for (const player of Array.from(this.players.values())) {
      if (player.email === email) {
        player.userId = user.id;
        this.players.set(player.id, player);
        return { success: true, playerId: player.id, userId: user.id };
      }
    }
    return { success: false };
  }

  // Cricket match operations
  async createCricketMatch(matchData: InsertCricketMatch): Promise<Match> {
    return this.createMatch(matchData as any);
  }

  async updateMatchScorecard(matchId: string, scorecard: any): Promise<Match | undefined> {
    const match = this.matches.get(matchId);
    if (!match) return undefined;
    const updated = { ...match, matchData: scorecard, updatedAt: new Date() };
    this.matches.set(matchId, updated);
    return updated;
  }

  async getPlayerMatchHistory(playerId: string): Promise<Match[]> {
    const performances = await this.getPlayerPerformances(playerId);
    const matchIds = performances.map(p => p.matchId);
    return Array.from(this.matches.values()).filter(m => matchIds.includes(m.id));
  }

  async getTeamMatchHistory(teamId: string): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(m => (m as any).team1Id === teamId || (m as any).team2Id === teamId);
  }

  async updatePlayerCareerStats(matchId: string, playerStats: any[]): Promise<any> {
    for (const stat of playerStats) {
      await this.updatePlayerStats(stat.playerId, stat);
    }
    return { success: true, playersUpdated: playerStats.length };
  }

  async getPlayerByEmail(email: string, teamId?: string): Promise<Player | undefined> {
    for (const player of Array.from(this.players.values())) {
      if (player.email === email && (!teamId || player.teamId === teamId)) {
        return player;
      }
    }
    return undefined;
  }

  async mergePlayer(targetId: string, sourceId: string, mergedData: any): Promise<any> {
    const target = this.players.get(targetId);
    const source = this.players.get(sourceId);
    if (!target || !source) return { success: false };
    const updated = { ...target, ...mergedData, updatedAt: new Date() };
    this.players.set(targetId, updated);
    this.players.delete(sourceId);
    return { success: true, mergedPlayer: updated };
  }

  async updatePlayerReferences(oldId: string, newId: string): Promise<any> {
    for (const perf of Array.from(this.playerPerformances.values())) {
      if (perf.playerId === oldId) {
        perf.playerId = newId;
        this.playerPerformances.set(perf.id, perf);
      }
    }
    return { success: true, collectionsUpdated: ['playerPerformances'] };
  }

  async applyMatchResults(matchData: any): Promise<any> {
    const match = await this.updateMatch(matchData.matchId, { status: matchData.status });
    if (matchData.playerStats) {
      await this.updatePlayerCareerStats(matchData.matchId, matchData.playerStats);
    }
    return { success: true, updatedMatch: match };
  }

  // Invitation operations
  async createInvitation(invitationData: InsertInvitation): Promise<Invitation> {
    const invitation: Invitation = {
      id: uuidv4(),
      email: invitationData.email,
      inviterName: invitationData.inviterName || "Unknown",
      inviterId: invitationData.inviterId || "Unknown",
      invitationType: invitationData.invitationType,
      matchType: invitationData.matchType || null,
      matchId: invitationData.matchId || null,
      teamId: invitationData.teamId || null,
      inviterTeamId: invitationData.inviterTeamId || null,
      sport: invitationData.sport || null,
      matchTitle: invitationData.matchTitle || null,
      teamName: invitationData.teamName || null,
      message: invitationData.message || null,
      token: uuidv4(),
      status: "pending",
      acceptedAt: null,
      acceptedByUserId: null,
      acceptedByPlayerId: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
    this.invitations.set(invitation.id, invitation);
    return invitation;
  }

  async getInvitation(id: string): Promise<Invitation | undefined> {
    return this.invitations.get(id);
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    for (const inv of Array.from(this.invitations.values())) {
      if (inv.token === token) return inv;
    }
    return undefined;
  }

  async getInvitations(filters?: any): Promise<Invitation[]> {
    let invs = Array.from(this.invitations.values());
    if (filters?.inviterId) invs = invs.filter(i => i.inviterId === filters.inviterId);
    if (filters?.email) invs = invs.filter(i => i.email === filters.email);
    return invs;
  }

  async updateInvitation(id: string, data: any): Promise<Invitation | undefined> {
    const existing = this.invitations.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.invitations.set(id, updated);
    return updated;
  }

  async revokeInvitation(id: string): Promise<boolean> {
    return this.invitations.delete(id);
  }

  async acceptInvitation(token: string, data: any): Promise<any> {
    const inv = await this.getInvitationByToken(token);
    if (!inv) return { success: false, error: 'Invalid token' };
    const updated = await this.updateInvitation(inv.id, {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedByUserId: data.userId || null,
      acceptedByPlayerId: data.playerId || null
    });
    return { success: true, invitation: updated };
  }

  async cleanupExpiredInvitations(): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const inv of Array.from(this.invitations.values())) {
      if (inv.expiresAt && inv.expiresAt < now) {
        this.invitations.delete(inv.id);
        count++;
      }
    }
    return count;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      recipientUserId: notificationData.recipientUserId || null,
      recipientPlayerId: notificationData.recipientPlayerId || null,
      recipientEmail: notificationData.recipientEmail || null,
      senderName: notificationData.senderName,
      senderEmail: notificationData.senderEmail,
      senderPhone: notificationData.senderPhone,
      senderPlace: notificationData.senderPlace || null,
      preferredTiming: notificationData.preferredTiming || null,
      type: notificationData.type,
      bookingId: notificationData.bookingId || null,
      matchType: notificationData.matchType || null,
      location: notificationData.location || null,
      team1Id: notificationData.team1Id || null,
      team2Id: notificationData.team2Id || null,
      sport: notificationData.sport || null,
      message: notificationData.message || null,
      status: "unread",
      createdAt: new Date(),
      readAt: null,
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async getNotifications(recipientId: string, filters?: { status?: string }): Promise<Notification[]> {
    let notifs = Array.from(this.notifications.values()).filter(n => n.recipientUserId === recipientId);
    if (filters?.status) {
      notifs = notifs.filter(n => n.status === filters.status);
    }
    return notifs;
  }

  async getUnreadNotificationCount(recipientId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter(n => n.recipientUserId === recipientId && n.status === "unread").length;
  }

  async updateNotificationStatus(id: string, status: "read" | "accepted" | "declined"): Promise<Notification | undefined> {
    const existing = this.notifications.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status };
    this.notifications.set(id, updated);
    return updated;
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }


}