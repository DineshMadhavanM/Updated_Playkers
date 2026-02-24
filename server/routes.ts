import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeEmailAuth, requireAuth, requireAdmin, isAdminEmail, registerUser, loginUser } from "./emailAuth";
import {
  insertVenueSchema,
  insertMatchSchema,
  insertCricketMatchSchema,
  insertBookingSchema,
  insertProductSchema,
  insertReviewSchema,
  insertMatchParticipantSchema,
  insertCartItemSchema,
  insertTeamSchema,
  insertPlayerSchema,
  matchCompletionSchema,
  MatchCompletionInput,
  insertInvitationSchema,
  insertNotificationSchema,
  Notification,
  Booking,
  insertMatchAvailabilitySchema,
  insertPlayerAvailabilitySchema,
  profileUpdateSchema,
} from "@shared/schema";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for memory storage
const storage_multer = multer.memoryStorage();
const upload = multer({ storage: storage_multer });

// CSRF protection middleware
function csrfProtection(req: any, res: any, next: any) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const host = req.get('Host');

  if (!origin && !referer) {
    return res.status(403).json({ message: 'Missing Origin or Referer header' });
  }

  const allowedOrigins = [
    `http://${host}`,
    `https://${host}`,
    `http://localhost:5000`,
    `https://localhost:5000`,
    `http://localhost:5173`,
    `https://localhost:5173`,
    `http://localhost:3000`,
    `https://localhost:3000`
  ];

  const isValidOrigin = origin && allowedOrigins.some(allowed => origin.startsWith(allowed));
  const isValidReferer = referer && allowedOrigins.some(allowed => referer.startsWith(allowed));

  if (!isValidOrigin && !isValidReferer) {
    console.warn(`[CSRF] Blocked: Origin=${origin}, Referer=${referer}, Host=${host}, URL=${req.originalUrl}`);
    return res.status(403).json({ message: 'Invalid origin or referer' });
  }

  next();
}

// Validation schemas for authentication
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(),
  location: z.string().optional(),
  phoneNumber: z.string().optional(),
  region: z.string().min(1, "Region is required"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set trust proxy for production
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Initialize email/password authentication
  initializeEmailAuth(app);

  // DEBUG ENDPOINT - REMOVE AFTER USE
  app.get("/api/debug/user-stats/:email", async (req, res) => {
    try {
      const email = req.params.email;
      const db = (storage as any).db;
      if (!db) return res.status(500).json({ message: "DB not initialized" });

      const collections = await db.listCollections().toArray();
      const counts: any = {};
      for (const coll of collections) {
        counts[coll.name] = await db.collection(coll.name).countDocuments();
      }

      const players = await db.collection('players').find({
        email: { $regex: new RegExp('^' + email.replace('.', '\\.') + '$', 'i') }
      }).toArray();

      const user = await db.collection('users').findOne({
        email: { $regex: new RegExp('^' + email.replace('.', '\\.') + '$', 'i') }
      });

      const perfs = await db.collection('playerPerformances').find({
        $or: [
          { playerEmail: email },
          { userId: user?.id },
          { playerId: { $in: players.map((p: any) => p.id) } }
        ]
      }).toArray();

      const recentMatches = await db.collection('matches').find({ status: 'completed' }).sort({ updatedAt: -1 }).limit(5).toArray();

      const allPlayers = await db.collection('players').find({}).toArray();

      res.json({
        email,
        counts,
        user: user ? { id: user.id, email: user.email } : null,
        players: players.map((p: any) => ({ id: p.id, name: p.name, email: p.email, userId: p.userId, careerStats: p.careerStats })),
        performancesCount: perfs.length,
        recentMatches: recentMatches.map((m: any) => ({
          id: m.id,
          title: m.title,
          updatedAt: m.updatedAt,
          scorecardPlayerIds: [
            ...(m.matchData?.scorecard?.team1Innings || []),
            ...(m.matchData?.scorecard?.team2Innings || [])
          ].flatMap((inn: any) => [
            ...(inn.batsmen || []).map((b: any) => b.playerId),
            ...(inn.bowlers || []).map((bw: any) => bw.playerId)
          ])
        })),
        allPlayersCount: allPlayers.length,
        matchedPlayersBySimilarName: allPlayers.filter((p: any) => p.name.toLowerCase().includes('dinesh') || p.name.toLowerCase().includes('madhavan'))
          .map((p: any) => ({ id: p.id, name: p.name, email: p.email }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Middleware to make email/password auth compatible with req.user pattern
  // This allows endpoints checking req.user to work with session-based auth
  app.use(async (req: any, res, next) => {
    if (req.session && req.session.user) {
      req.user = req.session.user;

      // Normalize user ID if it's stored as _id (MongoDB default)
      if (req.user._id && !req.user.id) {
        req.user.id = typeof req.user._id === 'object' ? req.user._id.toString() : req.user._id;
      }

      // 🔍 [SECURITY] Periodically re-verify admin status from database or hardcoded config
      // to ensure site admin bypasses work even if session is stale
      if (!req.user.isAdmin || isAdminEmail(req.user.email)) {
        const isHardcodedAdmin = isAdminEmail(req.user.email);
        if (isHardcodedAdmin) {
          req.user.isAdmin = true;
          req.session.user.isAdmin = true;
        } else {
          // Double check database if not already an admin in session
          try {
            const dbUser = await storage.getUser(req.user.id);
            if (dbUser?.isAdmin) {
              req.user.isAdmin = true;
              req.session.user.isAdmin = true;
            }
          } catch (e) {
            console.error("[AUTH] Error re-verifying admin status:", e);
          }
        }
      }
    }
    next();
  });



  // Apply CSRF protection to all routes
  app.use(csrfProtection);

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, dateOfBirth, location, phoneNumber, region } = registerSchema.parse(req.body);
      const user = await registerUser(email, password, firstName, lastName, dateOfBirth, location, phoneNumber, region);

      // Auto-link to player profile if email matches
      try {
        const linkResult = await storage.linkPlayerToUserByEmail(email);
        if (linkResult.success) {
          console.log(`✅ Auto-linked user ${user.id} to player ${linkResult.playerId} via email ${email}`);
        }
      } catch (linkError) {
        console.warn('Failed to auto-link player on registration:', linkError);
      }

      // Regenerate session to prevent session fixation
      (req as any).session.regenerate((err: any) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: 'Failed to create secure session' });
        }

        // Strip password from user object before storing in session
        const { password: _, ...userWithoutPassword } = user;
        (req as any).session.user = userWithoutPassword;

        res.status(201).json({
          message: "User registered successfully",
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
        });
      });
    } catch (error: any) {
      console.error("Error registering user:", error);
      res.status(400).json({ message: error.message || "Failed to register user" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await loginUser(email, password);

      // Regenerate session to prevent session fixation
      (req as any).session.regenerate((err: any) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: 'Failed to create secure session' });
        }

        // Set user in session (password already stripped by loginUser)
        (req as any).session.user = user;

        // Auto-link to player profile if email matches
        storage.linkPlayerToUserByEmail(email).then(linkResult => {
          if (linkResult.success) {
            console.log(`✅ Auto-linked user ${user.id} to player ${linkResult.playerId} via email ${email} on login`);
          }
        }).catch(linkError => {
          console.warn('Failed to auto-link player on login:', linkError);
        });

        res.json({
          message: "Login successful",
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
        });
      });
    } catch (error: any) {
      console.error("Error logging in user:", error);
      res.status(401).json({ message: error.message || "Failed to log in" });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((error: any) => {
      if (error) {
        console.error("Error logging out:", error);
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile update schema
  const profileUpdateSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be at most 30 characters").regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens").optional().or(z.literal("")),
    dateOfBirth: z.string().optional(),
    location: z.string().optional(),
    phoneNumber: z.string().optional(),
    region: z.string().optional(),
  });

  app.put('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      console.log('🔍 [PROFILE UPDATE] req.body.region:', req.body.region);
      const updateData = profileUpdateSchema.parse(req.body);
      console.log('🔍 [PROFILE UPDATE] updateData.region after parse:', updateData.region);

      // Convert empty string username to null for database
      const processedData = {
        ...updateData,
        username: updateData.username === "" ? null : updateData.username,
        dateOfBirth: updateData.dateOfBirth ? updateData.dateOfBirth : null,
        location: updateData.location || null,
        phoneNumber: updateData.phoneNumber || null,
        region: updateData.region || null,
      };
      console.log('🔍 [PROFILE UPDATE] processedData.region:', processedData.region);

      // Get current user to preserve existing data
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Use upsertUser to update the profile
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: processedData.email,
        username: processedData.username || null,
        firstName: processedData.firstName || null,
        lastName: processedData.lastName || null,
        profileImageUrl: currentUser.profileImageUrl, // Preserve existing image
        dateOfBirth: processedData.dateOfBirth ? new Date(processedData.dateOfBirth) : null,
        location: processedData.location || null,
        phoneNumber: processedData.phoneNumber || null,
        region: processedData.region || null,
        isAdmin: currentUser.isAdmin || false, // Preserve existing admin status
      });
      console.log('🔍 [PROFILE UPDATE] updatedUser.region from DB:', updatedUser.region);

      // Auto-link to player profile if email matches
      try {
        const linkResult = await storage.linkPlayerToUserByEmail(processedData.email);
        if (linkResult.success) {
          console.log(`✅ Auto-linked user ${userId} to player ${linkResult.playerId} via email ${processedData.email}`);
        }
      } catch (linkError) {
        console.warn('Failed to auto-link player on profile update:', linkError);
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      // Update session with new user data
      (req as any).session.user = userWithoutPassword;
      (req as any).session.save((err: any) => {
        if (err) console.error('Failed to save session after profile update:', err);
      });

      res.json({ message: "Profile updated successfully", user: userWithoutPassword });
    } catch (error: any) {
      console.error("Error updating user profile:", error);

      if (error.code === 'ER_DUP_ENTRY' || error.message.includes('duplicate')) {
        return res.status(400).json({ message: "Username already exists. Please choose a different username." });
      }

      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  // Venue routes
  app.get('/api/venues', async (req, res) => {
    try {
      const { sport, city, search } = req.query;
      const venues = await storage.getVenues({
        sport: sport as string,
        city: city as string,
        search: search as string,
      });
      res.json(venues);
    } catch (error) {
      console.error("Error fetching venues:", error);
      res.status(500).json({ message: "Failed to fetch venues" });
    }
  });

  app.get('/api/venues/:id', async (req, res) => {
    try {
      const venue = await storage.getVenue(req.params.id);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.json(venue);
    } catch (error) {
      console.error("Error fetching venue:", error);
      res.status(500).json({ message: "Failed to fetch venue" });
    }
  });
  app.post('/api/venues', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const venueData = insertVenueSchema.parse({ ...req.body, ownerId: userId });
      const venue = await storage.createVenue(venueData);
      res.status(201).json(venue);
    } catch (error) {
      console.error("Error creating venue:", error);
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  app.put('/api/venues/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const venueId = req.params.id;

      const venue = await storage.getVenue(venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }

      if (venue.ownerId !== userId) {
        return res.status(403).json({ message: "You don't have permission to edit this venue" });
      }

      const venueData = insertVenueSchema.partial().parse(req.body);
      const updatedVenue = await storage.updateVenue(venueId, venueData);
      res.json(updatedVenue);
    } catch (error) {
      console.error("Error updating venue:", error);
      res.status(500).json({ message: "Failed to update venue" });
    }
  });

  app.delete('/api/venues/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const venueId = req.params.id;

      const venue = await storage.getVenue(venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }

      if (venue.ownerId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this venue" });
      }

      await storage.deleteVenue(venueId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting venue:", error);
      res.status(500).json({ message: "Failed to delete venue" });
    }
  });

  // Photo upload route
  app.post('/api/upload', requireAuth, upload.single('photo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Convert buffer to base64 for Cloudinary upload
      const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
        folder: "playkers_venues",
      });

      res.json({ url: uploadResponse.secure_url });
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  app.get('/api/user/venues', requireAuth, async (req: any, res) => {
    try {
      const user = req.session.user;
      const userId = user.id;
      console.log(`[VENUES DEBUG] Fetching venues for user: ${user.email} | ID: ${userId}`);
      const venues = await storage.getUserVenues(userId);
      console.log(`[VENUES DEBUG] Found ${venues.length} venues for userId: ${userId}`);
      res.json(venues);
    } catch (error) {
      console.error("Error fetching user venues:", error);
      res.status(500).json({ message: "Failed to fetch your venues" });
    }
  });

  app.get('/api/debug/session', (req: any, res) => {
    res.json({
      user: req.session?.user ? { id: req.session.user.id, email: req.session.user.email } : null,
      authenticated: !!(req.session && req.session.user),
    });
  });

  // Match routes
  app.get('/api/matches', async (req, res) => {
    try {
      const { sport, status, isPublic } = req.query;
      const matches = await storage.getMatches({
        sport: sport as string,
        status: status as string,
        isPublic: isPublic === 'true',
      });
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get('/api/matches/:id', async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      console.error("Error fetching match:", error);
      res.status(500).json({ message: "Failed to fetch match" });
    }
  });

  app.post('/api/matches', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;

      // Convert scheduledAt string to Date object if it's a string
      const requestBody = { ...req.body, organizerId: userId };
      if (requestBody.scheduledAt && typeof requestBody.scheduledAt === 'string') {
        requestBody.scheduledAt = new Date(requestBody.scheduledAt);
      }

      const matchData = insertMatchSchema.parse(requestBody);

      // Link players by email if matchData contains rosters
      if (matchData.matchData) {
        const roster1 = matchData.matchData.team1Roster || [];
        const roster2 = matchData.matchData.team2Roster || [];

        // Process each roster to upsert players and link by email
        const processRoster = async (roster: any[]) => {
          for (let i = 0; i < roster.length; i++) {
            const rosterEntry = roster[i];
            if (rosterEntry.email) {
              try {
                // Upsert player by email - creates player record and links to user if email matches
                const player = await storage.upsertPlayerByEmail({
                  email: rosterEntry.email,
                  name: rosterEntry.name,
                  role: rosterEntry.role
                });

                // Store both id and playerId in the roster for future reference
                rosterEntry.id = player.id;
                rosterEntry.playerId = player.id;
              } catch (error) {
                console.error(`Failed to upsert player ${rosterEntry.email}:`, error);
                // Continue processing other players even if one fails
              }
            } else if (rosterEntry.playerId) {
              // If no email but has playerId, ensure id field is also set
              rosterEntry.id = rosterEntry.playerId;
            }
          }
        };

        await processRoster(roster1);
        await processRoster(roster2);
      }

      const match = await storage.createMatch(matchData);
      res.status(201).json(match);
    } catch (error) {
      console.error("Error creating match:", error);
      res.status(500).json({ message: "Failed to create match" });
    }
  });

  app.put('/api/matches/:id', requireAuth, async (req: any, res) => {
    try {
      // Get the existing match to preserve important data like roster
      const existingMatch = await storage.getMatch(req.params.id);
      if (!existingMatch) {
        return res.status(404).json({ message: "Match not found" });
      }

      // Merge the update data with existing match data
      // Always preserve the existing matchData (which contains roster information) while allowing score updates
      const updateData = { ...req.body };

      // Get existing and incoming matchData
      const existingMatchData = (existingMatch.matchData ?? {}) as any;
      const incomingMatchData = (req.body.matchData ?? {}) as any;

      // Always preserve roster data, even if the update doesn't include matchData
      updateData.matchData = {
        ...existingMatchData,  // Preserve all existing data (including rosters)
        ...incomingMatchData,  // Apply new updates (like scores)
        // Explicitly preserve roster data to ensure it's never lost
        team1Roster: incomingMatchData.team1Roster ?? existingMatchData.team1Roster,
        team2Roster: incomingMatchData.team2Roster ?? existingMatchData.team2Roster,
      };

      const match = await storage.updateMatch(req.params.id, updateData);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      console.error("Error updating match:", error);
      res.status(500).json({ message: "Failed to update match" });
    }
  });

  // Match participants routes
  app.get('/api/matches/:id/participants', async (req, res) => {
    try {
      const participants = await storage.getMatchParticipants(req.params.id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching match participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Match roster routes (for cricket team rosters)
  app.get('/api/matches/:id/roster', async (req, res) => {
    try {
      const match = await storage.getMatch(req.params.id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      // Extract roster data from matchData if it exists
      const matchData = match.matchData as any;
      if (matchData && matchData.team1Roster && matchData.team2Roster) {
        // Flatten the rosters and add team information
        const team1Players = matchData.team1Roster.map((player: any) => ({
          ...player,
          team: 'team1',
          matchId: req.params.id
        }));

        const team2Players = matchData.team2Roster.map((player: any) => ({
          ...player,
          team: 'team2',
          matchId: req.params.id
        }));

        const allPlayers = [...team1Players, ...team2Players];
        res.json(allPlayers);
      } else {
        // Return empty array if no roster data
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching match roster:", error);
      res.status(500).json({ message: "Failed to fetch roster" });
    }
  });

  app.post('/api/matches/:id/join', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const participantData = insertMatchParticipantSchema.parse({
        matchId: req.params.id,
        userId,
        ...req.body,
      });
      const participant = await storage.addMatchParticipant(participantData);
      res.status(201).json(participant);
    } catch (error) {
      console.error("Error joining match:", error);
      res.status(500).json({ message: "Failed to join match" });
    }
  });

  app.delete('/api/matches/:id/leave', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const success = await storage.removeMatchParticipant(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Participation not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error leaving match:", error);
      res.status(500).json({ message: "Failed to leave match" });
    }
  });

  // Match completion endpoint
  app.patch('/api/matches/:id/complete', requireAuth, async (req: any, res) => {
    try {
      const matchId = req.params.id;
      const userId = req.session.user.id;
      const completionData = matchCompletionSchema.parse({ matchId, ...req.body });

      // Get match details
      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      // Authorization: Only match organizer can complete the match
      if (match.organizerId !== userId) {
        return res.status(403).json({ message: "Only the match organizer can complete the match" });
      }

      // Check if match is already completed
      if (match.status === 'completed') {
        return res.status(400).json({ message: "Match is already completed" });
      }

      const { finalScorecard, awards, resultSummary } = completionData;
      const matchDate = match.scheduledAt || new Date();
      const winnerId = resultSummary.winnerId;

      // Extract team IDs - prefer canonical IDs from matchData, fallback to team names
      const matchData = match.matchData as any || {};
      const team1Id = matchData.team1Id || match.team1Name;
      const team2Id = matchData.team2Id || match.team2Name;

      if (!team1Id || !team2Id) {
        return res.status(400).json({ message: "Match must have valid team identifiers" });
      }

      // Ensure team IDs are distinct
      if (team1Id === team2Id) {
        return res.status(400).json({ message: "Team identifiers must be distinct" });
      }

      // Validate winnerId if provided
      if (winnerId && winnerId !== team1Id && winnerId !== team2Id) {
        return res.status(400).json({
          message: `Invalid winnerId: must be either ${team1Id} or ${team2Id}`
        });
      }

      // Collect player performance data from scorecard
      const playerPerformances = new Map<string, any>();

      // Process batting performances with canonical team ID
      const processBatting = (innings: any[], battingTeamId: string, fieldingTeamId: string) => {
        for (const inning of innings) {
          for (const batsman of inning.batsmen || []) {
            if (!batsman.playerId) continue;

            if (!playerPerformances.has(batsman.playerId)) {
              playerPerformances.set(batsman.playerId, {
                playerId: batsman.playerId,
                matchId,
                matchDate,
                teamId: battingTeamId,
                runsScored: 0,
                ballsFaced: 0,
                fours: 0,
                sixes: 0,
                isOut: false,
                oversBowled: 0,
                runsGiven: 0,
                wicketsTaken: 0,
                maidens: 0,
                catches: 0,
                runOuts: 0,
                stumpings: 0,
              });
            }

            const perf = playerPerformances.get(batsman.playerId)!;
            perf.runsScored += batsman.runsScored || 0;
            perf.ballsFaced += batsman.ballsFaced || 0;
            perf.fours += batsman.fours || 0;
            perf.sixes += batsman.sixes || 0;
            perf.isOut = perf.isOut || (batsman.dismissalType && batsman.dismissalType !== 'not-out');
          }
        }
      };

      // Process bowling performances with canonical team ID
      const processBowling = (innings: any[], battingTeamId: string, fieldingTeamId: string) => {
        for (const inning of innings) {
          for (const bowler of inning.bowlers || []) {
            if (!bowler.playerId) continue;

            if (!playerPerformances.has(bowler.playerId)) {
              playerPerformances.set(bowler.playerId, {
                playerId: bowler.playerId,
                matchId,
                matchDate,
                teamId: fieldingTeamId, // Bowler's team is the fielding team
                runsScored: 0,
                ballsFaced: 0,
                fours: 0,
                sixes: 0,
                isOut: false,
                oversBowled: 0,
                runsGiven: 0,
                wicketsTaken: 0,
                maidens: 0,
                catches: 0,
                runOuts: 0,
                stumpings: 0,
              });
            }

            const perf = playerPerformances.get(bowler.playerId)!;
            perf.oversBowled += bowler.overs || 0;
            perf.runsGiven += bowler.runsGiven || 0;
            perf.wicketsTaken += bowler.wickets || 0;
            perf.maidens += bowler.maidens || 0;
          }
        }
      };

      // Process fielding performances with canonical team ID
      const processFielding = (innings: any[], battingTeamId: string, fieldingTeamId: string) => {
        for (const inning of innings) {
          for (const batsman of inning.batsmen || []) {
            // Count catches and stumpings
            if (batsman.fielderOut) {
              const fielderId = batsman.fielderOut;
              if (!playerPerformances.has(fielderId)) {
                playerPerformances.set(fielderId, {
                  playerId: fielderId,
                  matchId,
                  matchDate,
                  teamId: fieldingTeamId, // Fielder's team is the fielding team
                  runsScored: 0,
                  ballsFaced: 0,
                  fours: 0,
                  sixes: 0,
                  isOut: false,
                  oversBowled: 0,
                  runsGiven: 0,
                  wicketsTaken: 0,
                  maidens: 0,
                  catches: 0,
                  runOuts: 0,
                  stumpings: 0,
                });
              }

              const perf = playerPerformances.get(fielderId)!;
              if (batsman.dismissalType === 'caught') {
                perf.catches += 1;
              } else if (batsman.dismissalType === 'run-out') {
                perf.runOuts += 1;
              } else if (batsman.dismissalType === 'stumped') {
                perf.stumpings += 1;
              }
            }
          }
        }
      };

      // Process all innings with canonical team IDs
      // team1Innings: team1 bats, team2 bowls/fields
      processBatting(finalScorecard.team1Innings || [], team1Id, team2Id);
      processBowling(finalScorecard.team1Innings || [], team1Id, team2Id);
      processFielding(finalScorecard.team1Innings || [], team1Id, team2Id);

      // team2Innings: team2 bats, team1 bowls/fields
      processBatting(finalScorecard.team2Innings || [], team2Id, team1Id);
      processBowling(finalScorecard.team2Innings || [], team2Id, team1Id);
      processFielding(finalScorecard.team2Innings || [], team2Id, team1Id);

      // Record player performances and update aggregates
      const playerErrors: string[] = [];
      let playersProcessed = 0;
      let playersSkipped = 0;

      for (const [playerId, perfData] of Array.from(playerPerformances.entries())) {
        try {
          // Determine if player won the match
          const matchWon = !!(winnerId && perfData.teamId === winnerId);

          // Determine awards
          const manOfMatch = awards?.manOfTheMatch === playerId;
          const bestBatsman = awards?.bestBatsman === playerId;
          const bestBowler = awards?.bestBowler === playerId;
          const bestFielder = awards?.bestFielder === playerId;

          // Record the performance (idempotent due to unique index)
          await storage.recordPlayerPerformance({
            ...perfData,
            manOfMatch,
            bestBatsman,
            bestBowler,
            bestFielder,
          });

          // Update career aggregates
          await storage.updatePlayerAggregates(playerId, {
            runsScored: perfData.runsScored,
            ballsFaced: perfData.ballsFaced,
            fours: perfData.fours,
            sixes: perfData.sixes,
            isOut: perfData.isOut,
            oversBowled: perfData.oversBowled,
            runsGiven: perfData.runsGiven,
            wicketsTaken: perfData.wicketsTaken,
            maidens: perfData.maidens,
            catches: perfData.catches,
            runOuts: perfData.runOuts,
            stumpings: perfData.stumpings,
            manOfMatch,
            bestBatsman,
            bestBowler,
            bestFielder,
            matchWon,
          });

          playersProcessed++;
        } catch (error: any) {
          // Check if it's a duplicate key error (code 11000) - treat as success
          if (error.code === 11000 || error.message?.includes('duplicate')) {
            console.log(`Player ${playerId} performance already recorded (skipped)`);
            playersSkipped++;
          } else {
            console.error(`Failed to record performance for player ${playerId}:`, error);
            playerErrors.push(`${playerId}: ${error.message}`);
          }
        }
      }

      // Only mark as completed if no non-duplicate errors occurred
      if (playerErrors.length > 0) {
        return res.status(207).json({
          message: "Match completion encountered errors",
          playersProcessed,
          playersSkipped,
          totalPlayers: playerPerformances.size,
          errors: playerErrors,
        });
      }

      // Update match status and result
      const updatedMatch = await storage.updateMatch(matchId, {
        status: 'completed',
        matchData: {
          ...(match.matchData as any || {}),
          scorecard: finalScorecard,
          awards,
          resultSummary,
        },
      });

      res.json({
        message: "Match completed successfully",
        match: updatedMatch,
        playersProcessed,
        playersSkipped,
        totalPlayers: playerPerformances.size,
      });
    } catch (error) {
      console.error("Error completing match:", error);
      res.status(500).json({ message: "Failed to complete match" });
    }
  });

  // User matches route
  app.get('/api/user/matches', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const matches = await storage.getUserMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching user matches:", error);
      res.status(500).json({ message: "Failed to fetch user matches" });
    }
  });

  // Booking routes
  app.get('/api/bookings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const bookings = await storage.getBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/owner/bookings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const venues = await storage.getUserVenues(userId);

      const allBookingRequests: Booking[] = [];
      for (const venue of venues) {
        const venueBookings = await storage.getVenueBookings(venue.id);
        allBookingRequests.push(...venueBookings);
      }

      // Sort by start time descending
      allBookingRequests.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      res.json(allBookingRequests);
    } catch (error) {
      console.error("Error fetching owner bookings:", error);
      res.status(500).json({ message: "Failed to fetch booking requests" });
    }
  });

  app.post('/api/bookings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const bookingData = insertBookingSchema.parse({ ...req.body, userId });
      const booking = await storage.createBooking(bookingData);

      // Notify the venue owner
      try {
        console.log(`🔍 Attempting to notify owner for booking ${booking.id}, venueId: ${booking.venueId}`);
        const venue = await storage.getVenue(booking.venueId);
        if (venue && venue.ownerId) {
          console.log(`🔍 Found venue ${venue.name}, ownerId: ${venue.ownerId}`);
          const booker = req.session.user;
          const bookerName = booker.firstName && booker.lastName
            ? `${booker.firstName} ${booker.lastName}`
            : (booker.username || booker.email);

          const notificationData = {
            recipientUserId: venue.ownerId,
            senderName: booking.bookerName,
            senderEmail: booking.bookerEmail,
            senderPhone: booking.bookerPhone,
            type: "booking_request" as const,
            bookingId: booking.id,
            location: `${venue.name} - ${venue.city}`,
            senderPlace: booking.bookerPlace,
            preferredTiming: booking.preferredTiming,
            message: `${booking.bookerName} (${booking.bookerEmail}) from ${booking.bookerPlace} has requested to book ${venue.name} for ${booking.preferredTiming}. Phone: ${booking.bookerPhone}`,
          };

          const notification = await storage.createNotification(notificationData);
          console.log(`✅ Created booking notification ${notification.id} for venue owner ${venue.ownerId}`);
        } else {
          console.log(`⚠️  Could not notify owner: Venue found? ${!!venue}, OwnerId: ${venue?.ownerId}`);
        }
      } catch (notifyError) {
        console.error("❌ Error creating booking notification:", notifyError);
        // Don't fail the booking creation if notification fails
      }

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const { category, search } = req.query;
      const products = await storage.getProducts({
        category: category as string,
        search: search as string,
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes
  app.get('/api/cart', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const cartData = insertCartItemSchema.parse({ ...req.body, userId });
      const cartItem = await storage.addToCart(cartData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put('/api/cart/:id', requireAuth, async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', requireAuth, async (req, res) => {
    try {
      const success = await storage.removeFromCart(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Review routes
  app.get('/api/reviews', async (req, res) => {
    try {
      const { venueId, productId } = req.query;
      const reviews = await storage.getReviews(venueId as string, productId as string);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/reviews', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const reviewData = insertReviewSchema.parse({ ...req.body, userId });
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // User stats routes
  app.get('/api/user/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Admin routes for user management
  // Sanitize user data (already defined below)

  // Helper function to sanitize user data (remove password)
  function sanitizeUser(user: any) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Get all users for admin panel
  app.get('/api/admin/users', requireAdmin, async (req: any, res) => {
    try {
      if (storage.getAllUsers) {
        const users = await storage.getAllUsers();
        // Remove password from response for security
        const sanitizedUsers = users.map(sanitizeUser);
        res.json(sanitizedUsers);
      } else {
        res.status(501).json({ message: "Admin functionality not available" });
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user count for admin dashboard
  app.get('/api/admin/users/count', requireAdmin, async (req: any, res) => {
    try {
      if (storage.getUserCount) {
        const count = await storage.getUserCount();
        res.json({ count });
      } else {
        res.status(501).json({ message: "Admin functionality not available" });
      }
    } catch (error) {
      console.error("Error fetching user count:", error);
      res.status(500).json({ message: "Failed to fetch user count" });
    }
  });

  // Get single user details for admin
  app.get('/api/admin/users/:id', requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response for security
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Delete user for admin
  app.delete('/api/admin/users/:id', requireAdmin, async (req: any, res) => {
    try {
      if (storage.deleteUser) {
        const success = await storage.deleteUser(req.params.id);
        if (!success) {
          return res.status(404).json({ message: "User found?" });
        }
        res.status(204).send();
      } else {
        res.status(501).json({ message: "Admin functionality not available" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get all team admins and co-admins
  app.get('/api/admin/team-roles', requireAdmin, async (req: any, res) => {
    try {
      // 1. Get all players who are admins or co-admins
      const allPlayers = await storage.getPlayers({});
      const teamAdmins = allPlayers.filter(p => p.teamRole === "admin" || p.teamRole === "co-admin");

      // 2. Decorate with user and team info
      const results = await Promise.all(teamAdmins.map(async (player) => {
        let user = null;
        if (player.userId) {
          user = await storage.getUser(player.userId);
        }

        const team = player.teamId ? await storage.getTeam(player.teamId) : null;

        return {
          id: player.id,
          name: player.name,
          email: player.email,
          teamRole: player.teamRole,
          teamId: player.teamId,
          teamName: team?.name || player.teamName || "Unknown Team",
          userId: player.userId,
          userEmail: user?.email,
          userDisplayName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null
        };
      }));

      res.json(results);
    } catch (error) {
      console.error("Error fetching team roles:", error);
      res.status(500).json({ message: "Failed to fetch team roles" });
    }
  });

  // Check player email registrations
  app.get('/api/admin/check-player-emails', requireAdmin, async (req: any, res) => {
    try {
      const players = await storage.getPlayers({});

      if (!storage.getAllUsers) {
        return res.status(501).json({ message: "Admin functionality not available" });
      }

      const users = await storage.getAllUsers();

      // Create case-insensitive email map for efficient lookup
      const emailToUserMap = new Map();
      users.forEach(user => {
        emailToUserMap.set(user.email.toLowerCase().trim(), user);
      });

      const playersWithEmailStatus = [];

      for (const player of players) {
        if (player.email) {
          const normalizedEmail = player.email.toLowerCase().trim();
          const matchingUser = emailToUserMap.get(normalizedEmail);
          const isLinked = !!player.userId;
          const matchedLinked = isLinked && matchingUser && player.userId === matchingUser.id;

          playersWithEmailStatus.push({
            player: {
              id: player.id,
              name: player.name,
              email: player.email,
              userId: player.userId,
              teamId: player.teamId,
              teamName: player.teamName
            },
            isRegistered: !!matchingUser,
            matchingUser: matchingUser ? sanitizeUser(matchingUser) : null,
            isLinked: isLinked,
            matchedLinked: !!matchedLinked
          });
        }
      }

      const summary = {
        totalPlayers: players.length,
        playersWithEmail: playersWithEmailStatus.length,
        registeredEmails: playersWithEmailStatus.filter(p => p.isRegistered).length,
        linkedPlayers: playersWithEmailStatus.filter(p => p.isLinked).length,
        matchedLinkedPlayers: playersWithEmailStatus.filter(p => p.matchedLinked).length,
        unlinkableRegisteredPlayers: playersWithEmailStatus.filter(p => p.isRegistered && !p.isLinked).length
      };

      res.json({ summary, players: playersWithEmailStatus });
    } catch (error) {
      console.error("Error checking player emails:", error);
      res.status(500).json({ message: "Failed to check player emails" });
    }
  });

  // Link player to user account
  app.post('/api/admin/link-player/:playerId', requireAdmin, async (req: any, res) => {
    try {
      const { playerId } = req.params;

      // Get player
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      if (!player.email) {
        return res.status(400).json({ message: "Player has no email address" });
      }

      // Find matching user by email
      const matchingUser = await storage.getUserByEmail(player.email);
      if (!matchingUser) {
        return res.status(404).json({ message: "No registered user found with this email" });
      }

      // Check if player is already linked
      if (player.userId && player.userId === matchingUser.id) {
        return res.status(400).json({ message: "Player is already linked to this user" });
      }

      // Check if user already has a linked player
      const existingPlayer = await storage.getPlayerByUserId(matchingUser.id);
      if (existingPlayer && existingPlayer.id !== playerId) {
        return res.status(409).json({
          message: "User already has a linked player",
          existingPlayer: {
            id: existingPlayer.id,
            name: existingPlayer.name,
            email: existingPlayer.email
          }
        });
      }

      // Link player to user
      const updatedPlayer = await storage.updatePlayer(playerId, { userId: matchingUser.id });
      if (!updatedPlayer) {
        return res.status(500).json({ message: "Failed to link player to user" });
      }

      res.json({
        message: "Player successfully linked to user account",
        player: updatedPlayer,
        user: sanitizeUser(matchingUser)
      });
    } catch (error) {
      console.error("Error linking player to user:", error);
      res.status(500).json({ message: "Failed to link player to user" });
    }
  });

  // Unlink player from user account
  app.post('/api/admin/unlink-player/:playerId', requireAdmin, async (req: any, res) => {
    try {
      const { playerId } = req.params;

      // Get player
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      if (!player.userId) {
        return res.status(400).json({ message: "Player is not linked to any user" });
      }

      // Unlink player from user  
      const updatedPlayer = await storage.updatePlayer(playerId, { userId: undefined });
      if (!updatedPlayer) {
        return res.status(500).json({ message: "Failed to unlink player from user" });
      }

      res.json({
        message: "Player successfully unlinked from user account",
        player: updatedPlayer
      });
    } catch (error) {
      console.error("Error unlinking player from user:", error);
      res.status(500).json({ message: "Failed to unlink player from user" });
    }
  });


  // Update player's team role (admin/co-admin/player)
  app.patch('/api/players/:id/team-role', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { teamRole } = req.body;

      if (!["admin", "co-admin", "player"].includes(teamRole)) {
        return res.status(400).json({ message: "Invalid teamRole. Must be 'admin', 'co-admin', or 'player'" });
      }

      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const updatedPlayer = await storage.updatePlayer(id, { teamRole } as any);
      if (!updatedPlayer) {
        return res.status(500).json({ message: "Failed to update player role" });
      }

      res.json(updatedPlayer);
    } catch (error) {
      console.error("Error updating player team role:", error);
      res.status(500).json({ message: "Failed to update player team role" });
    }
  });

  // Team routes
  app.get('/api/teams', async (req, res) => {
    try {
      const { search, sport } = req.query;
      const teams = await storage.getTeams({
        search: search as string,
        sport: sport as string,
      });
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get('/api/teams/:id', async (req, res) => {
    try {
      const team = await storage.getTeam(req.params.id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post('/api/teams', requireAuth, async (req: any, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error: any) {
      console.error("Error creating team:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", issues: error.issues });
      }
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.put('/api/teams/:id', requireAuth, async (req: any, res) => {
    try {
      const teamId = req.params.id;
      const user = req.user || req.session.user;

      // Check if team exists
      const existingTeam = await storage.getTeam(teamId);
      if (!existingTeam) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check authorization
      // 1. Site Admin has access
      const isSiteAdmin = user?.isAdmin || (user?.email && isAdminEmail?.(user.email));

      if (!isSiteAdmin) {
        // 2. Check user's role in this team
        const userProfiles = await storage.getPlayers({ userId: user.id, teamId });
        const userProfile = userProfiles[0];
        const isAllowed = userProfile?.teamRole === "admin" || userProfile?.teamRole === "co-admin";

        if (!isAllowed) {
          return res.status(403).json({
            message: "You don't have permission to edit this team. Only Team Admin or Co-Admin can do that."
          });
        }
      }

      const teamData = insertTeamSchema.partial().parse(req.body);
      const team = await storage.updateTeam(teamId, teamData);
      res.json(team);
    } catch (error: any) {
      console.error("Error updating team:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", issues: error.issues });
      }
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete('/api/teams/:id', requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteTeam(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Get team match history
  app.get('/api/teams/:id/matches', async (req, res) => {
    try {
      const matches = await storage.getTeamMatchHistory(req.params.id);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching team match history:", error);
      res.status(500).json({ message: "Failed to fetch team match history" });
    }
  });

  // Player routes
  app.get('/api/players', async (req, res) => {
    try {
      const { teamId, role, search, userId } = req.query;
      const players = await storage.getPlayers({
        teamId: teamId as string,
        role: role as string,
        search: search as string,
        userId: userId as string,
      });
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get('/api/user/players', requireAuth, async (req: any, res) => {
    try {
      const players = await storage.getPlayers({
        userId: req.user.id
      });
      res.json(players);
    } catch (error) {
      console.error("Error fetching user players:", error);
      res.status(500).json({ message: "Failed to fetch user player profiles" });
    }
  });

  app.get('/api/players/:id', async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player:", error);
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  // Get player match performances with pagination
  app.get('/api/players/:id/performances', async (req, res) => {
    try {
      const playerId = req.params.id;
      // Parse and validate pagination parameters (clamp limit 0-100, offset >= 0)
      const limit = Math.min(Math.max(0, parseInt(req.query.limit as string, 10) || 20), 100);
      const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

      // Verify player exists
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Fetch performances with pagination
      const performances = await storage.getPlayerPerformances(playerId, { limit, offset });

      res.json({
        player: {
          id: player.id,
          name: player.name,
        },
        performances,
        pagination: {
          limit,
          offset,
          count: performances.length,
        },
      });
    } catch (error) {
      console.error("Error fetching player performances:", error);
      res.status(500).json({ message: "Failed to fetch player performances" });
    }
  });

  // Get user match performances with pagination
  app.get('/api/user/performances', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      // Parse and validate pagination parameters (clamp limit 0-100, offset >= 0)
      const limit = Math.min(Math.max(0, parseInt(req.query.limit as string, 10) || 20), 100);
      const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

      // Fetch performances with pagination
      const performances = await storage.getUserPerformances(userId, { limit, offset });

      res.json({
        performances,
        pagination: {
          limit,
          offset,
          count: performances.length,
        },
      });
    } catch (error) {
      console.error("Error fetching user performances:", error);
      res.status(500).json({ message: "Failed to fetch user performances" });
    }
  });

  app.post('/api/players', requireAuth, async (req: any, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);

      // Check for email conflicts within the same team if email is provided
      if (playerData.email && playerData.teamId) {
        const existingPlayer = await storage.getPlayerByEmail(playerData.email, playerData.teamId);
        if (existingPlayer) {
          return res.status(409).json({
            message: "Email conflict detected",
            conflictType: "email_exists",
            existingPlayer: existingPlayer, // Include full player profile
            suggestedAction: "merge_profiles"
          });
        }
      }

      const player = await storage.createPlayer(playerData);

      // Auto-link to user account if email matches
      if (playerData.email) {
        try {
          const linkResult = await storage.linkPlayerToUserByEmail(playerData.email);
          if (linkResult.success) {
            console.log(`✅ Auto-linked player ${player.id} to user ${linkResult.userId} via email ${playerData.email}`);
          }
        } catch (linkError) {
          console.warn('Failed to auto-link user on player creation:', linkError);
        }
      }

      res.status(201).json(player);
    } catch (error: any) {
      console.error("Error creating player:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", issues: error.issues });
      }
      // Return the actual error message so users know what went wrong
      res.status(500).json({ message: error.message || "Failed to create player" });
    }
  });

  app.put('/api/players/:id', requireAuth, async (req, res) => {
    try {
      const playerData = insertPlayerSchema.partial().parse(req.body);

      // Get the existing player to check authorization
      const existingPlayer = await storage.getPlayer(req.params.id);
      if (!existingPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Check if user is authorized to edit this player
      const user = (req as any).session.user;
      const isAdmin = isAdminEmail(user?.email);
      const isOwner = existingPlayer.email && user?.email &&
        existingPlayer.email.toLowerCase() === user.email.toLowerCase();

      // Debug logging
      console.log('🔐 Authorization check for player update:');
      console.log('  User email:', user?.email);
      console.log('  User isAdmin:', user?.isAdmin);
      console.log('  Existing player email:', existingPlayer.email);
      console.log('  isOwner:', isOwner);
      console.log('  isAdmin:', isAdmin);

      if (!isAdmin && !isOwner) {
        console.log('❌ Authorization DENIED - User cannot edit this player');
        return res.status(403).json({
          message: "You don't have permission to edit this player profile"
        });
      }

      console.log('✅ Authorization GRANTED - User can edit this player');

      // Check for email conflicts within the same team if email is being updated
      if (playerData.email && playerData.teamId) {
        const conflictPlayer = await storage.getPlayerByEmail(playerData.email, playerData.teamId, req.params.id);
        if (conflictPlayer) {
          return res.status(409).json({
            message: "Email conflict detected",
            conflictType: "email_exists",
            existingPlayer: conflictPlayer, // Include full player profile
            suggestedAction: "merge_profiles"
          });
        }
      }

      const player = await storage.updatePlayer(req.params.id, playerData);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Auto-link to user account if email matches
      if (playerData.email) {
        try {
          const linkResult = await storage.linkPlayerToUserByEmail(playerData.email);
          if (linkResult.success) {
            console.log(`✅ Auto-linked player ${req.params.id} to user ${linkResult.userId} via email ${playerData.email}`);
          }
        } catch (linkError) {
          console.warn('Failed to auto-link user on player update:', linkError);
        }
      }

      res.json(player);
    } catch (error: any) {
      console.error("Error updating player:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", issues: error.issues });
      }
      // Return the actual error message so users know what went wrong
      res.status(500).json({ message: error.message || "Failed to update player" });
    }
  });

  app.delete('/api/players/:id', requireAuth, async (req, res) => {
    try {
      // Get the existing player to check authorization
      const existingPlayer = await storage.getPlayer(req.params.id);
      if (!existingPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Check if user is authorized to delete this player
      const user = (req as any).session.user;
      const isAdmin = isAdminEmail(user?.email);
      const isOwner = existingPlayer.email && user?.email &&
        existingPlayer.email.toLowerCase() === user.email.toLowerCase();

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          message: "You don't have permission to delete this player profile"
        });
      }

      const success = await storage.deletePlayer(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  // Player merge endpoint
  app.post('/api/players/merge', requireAuth, async (req: any, res) => {
    try {
      const mergeSchema = z.object({
        targetPlayerId: z.string().min(1, "Target player ID is required"),
        sourcePlayerId: z.string().min(1, "Source player ID is required"),
        mergeCareerStats: z.boolean().default(true),
        fieldsToUpdate: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          teamName: z.string().optional(),
          role: z.enum(["batsman", "bowler", "all-rounder", "wicket-keeper"]).optional(),
          battingStyle: z.enum(["right-handed", "left-handed"]).optional(),
          bowlingStyle: z.enum(["right-arm-fast", "left-arm-fast", "right-arm-medium", "left-arm-medium", "right-arm-spin", "left-arm-spin", "leg-spin", "off-spin"]).optional(),
          jerseyNumber: z.number().int().optional()
        }).optional()
      });

      const { targetPlayerId, sourcePlayerId, mergeCareerStats, fieldsToUpdate } = mergeSchema.parse(req.body);

      // Validate that the players are different
      if (targetPlayerId === sourcePlayerId) {
        return res.status(400).json({
          message: "Cannot merge a player with itself"
        });
      }

      // Verify both players exist before attempting merge
      const [targetPlayer, sourcePlayer] = await Promise.all([
        storage.getPlayer(targetPlayerId),
        storage.getPlayer(sourcePlayerId)
      ]);

      if (!targetPlayer) {
        return res.status(404).json({ message: "Target player not found" });
      }
      if (!sourcePlayer) {
        return res.status(404).json({ message: "Source player not found" });
      }

      // Execute the merge with transactional safety
      const mergeResult = await storage.mergePlayer(
        targetPlayerId,
        sourcePlayerId,
        fieldsToUpdate || {},
        mergeCareerStats
      );

      if (!mergeResult.success) {
        return res.status(500).json({
          message: "Failed to merge players",
          errors: mergeResult.errors
        });
      }

      // Return success response with detailed merge information
      res.status(200).json({
        message: "Players merged successfully",
        mergedPlayer: mergeResult.mergedPlayer,
        mergeMetadata: {
          targetPlayerId,
          sourcePlayerId,
          mergeCareerStats,
          fieldsUpdated: fieldsToUpdate ? Object.keys(fieldsToUpdate) : [],
          mergeTimestamp: new Date().toISOString()
        },
        cacheInvalidation: {
          players: [targetPlayerId, sourcePlayerId],
          teams: [
            targetPlayer.teamId,
            sourcePlayer.teamId
          ].filter(Boolean),
          matches: [], // Matches will need invalidation if they reference the merged players
          message: "Frontend should invalidate player and team caches"
        }
      });

    } catch (error: any) {
      console.error("Error merging players:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          message: "Validation error",
          issues: error.issues
        });
      }
      res.status(500).json({
        message: "Failed to merge players",
        error: error.message
      });
    }
  });

  // Get player match history
  app.get('/api/players/:id/matches', async (req, res) => {
    try {
      const matches = await storage.getPlayerMatchHistory(req.params.id);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching player match history:", error);
      res.status(500).json({ message: "Failed to fetch player match history" });
    }
  });

  // Get player by user ID
  app.get('/api/users/:userId/player', async (req, res) => {
    try {
      const player = await storage.getPlayerByUserId(req.params.userId);
      if (!player) {
        return res.status(404).json({ message: "Player profile not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player by user ID:", error);
      res.status(500).json({ message: "Failed to fetch player profile" });
    }
  });

  // Enhanced cricket match routes
  app.post('/api/matches/cricket', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const requestBody = { ...req.body, organizerId: userId };

      // Convert scheduledAt string to Date object if it's a string
      if (requestBody.scheduledAt && typeof requestBody.scheduledAt === 'string') {
        requestBody.scheduledAt = new Date(requestBody.scheduledAt);
      }

      const cricketMatchData = insertCricketMatchSchema.parse(requestBody);
      const match = await storage.createCricketMatch(cricketMatchData);
      res.status(201).json(match);
    } catch (error: any) {
      console.error("Error creating cricket match:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", issues: error.issues });
      }
      res.status(500).json({ message: "Failed to create cricket match" });
    }
  });

  // Update match scorecard
  app.put('/api/matches/:id/scorecard', requireAuth, async (req, res) => {
    try {
      const { scorecard } = req.body;
      const match = await storage.updateMatchScorecard(req.params.id, scorecard);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      console.error("Error updating match scorecard:", error);
      res.status(500).json({ message: "Failed to update match scorecard" });
    }
  });

  // Save player profiles with match statistics
  app.post('/api/matches/:id/save-player-profiles', requireAuth, async (req, res) => {
    try {
      const matchId = req.params.id;
      const { playerStats } = req.body;

      console.log(`🔄 Saving player profiles for match ${matchId}`);

      if (!playerStats || !Array.isArray(playerStats)) {
        return res.status(400).json({ message: "Player stats array is required" });
      }

      // Validate and dedupe player stats
      const validatedPlayerStats = [];
      const seenPlayerIds = new Set();

      for (const stat of playerStats) {
        // Basic validation
        if (!stat.playerId || !stat.teamId) {
          console.warn('Skipping player stat with missing playerId or teamId:', stat);
          continue;
        }

        // Dedupe by playerId (keep first occurrence)
        if (seenPlayerIds.has(stat.playerId)) {
          console.warn(`Duplicate playerId ${stat.playerId} found, skipping`);
          continue;
        }

        seenPlayerIds.add(stat.playerId);
        validatedPlayerStats.push({
          playerId: stat.playerId,
          teamId: stat.teamId,
          runsScored: typeof stat.runsScored === 'number' ? stat.runsScored : 0,
          ballsFaced: typeof stat.ballsFaced === 'number' ? stat.ballsFaced : 0,
          fours: typeof stat.fours === 'number' ? stat.fours : 0,
          sixes: typeof stat.sixes === 'number' ? stat.sixes : 0,
          isOut: Boolean(stat.isOut),
          oversBowled: typeof stat.oversBowled === 'number' ? stat.oversBowled : 0,
          runsGiven: typeof stat.runsGiven === 'number' ? stat.runsGiven : 0,
          wicketsTaken: typeof stat.wicketsTaken === 'number' ? stat.wicketsTaken : 0,
          maidens: typeof stat.maidens === 'number' ? stat.maidens : 0,
          manOfMatch: Boolean(stat.manOfMatch)
        });
      }

      if (validatedPlayerStats.length === 0) {
        return res.status(400).json({ message: "No valid player statistics found" });
      }

      // Save individual player career statistics
      const result = await storage.updatePlayerCareerStats(matchId, validatedPlayerStats);

      if (result.success) {
        res.json({
          message: "Player profiles updated successfully",
          playersUpdated: result.playersUpdated,
          cacheInvalidation: result.cacheInvalidation
        });
      } else {
        res.status(500).json({
          message: "Failed to update some player profiles",
          errors: result.errors
        });
      }

    } catch (error: any) {
      console.error('Error saving player profiles:', error);
      res.status(500).json({ message: "Failed to save player profiles" });
    }
  });

  // Complete a cricket match with final scorecard and statistics
  app.post('/api/matches/:id/complete', requireAuth, async (req: any, res) => {
    try {
      const matchId = req.params.id;
      console.log(`📊 DATA FLOW STEP 1: Starting match completion for match ${matchId}`);

      // Check if match exists and is not already processed
      const existingMatch = await storage.getMatch(matchId);
      if (!existingMatch) {
        console.log(`❌ DATA FLOW ERROR: Match ${matchId} not found`);
        return res.status(404).json({ message: "Match not found" });
      }

      // Check for idempotency - if already processed, return existing data
      const existingMatchData = existingMatch.matchData as any;
      if (existingMatchData?.processed === true) {
        console.log(`⚠️ DATA FLOW: Match ${matchId} already processed, returning existing data`);
        return res.status(200).json({
          message: "Match already completed",
          match: existingMatch,
          alreadyProcessed: true
        });
      }

      console.log(`✅ DATA FLOW STEP 1: Match ${matchId} found and ready for completion`);
      console.log(`🏏 Match Details: ${existingMatch.title} - Status: ${existingMatch.status}`);

      // Validate the completion data using our enhanced schema
      console.log(`📊 DATA FLOW STEP 2: Validating scorecard data for match ${matchId}`);
      const completionData: MatchCompletionInput = matchCompletionSchema.parse({
        ...req.body,
        matchId,
      });

      console.log(`✅ DATA FLOW STEP 2: Scorecard data validated successfully`);
      console.log(`📈 Scorecard Contains: ${(completionData.finalScorecard.team1Innings || []).length + (completionData.finalScorecard.team2Innings || []).length} innings`);

      console.log(`📊 DATA FLOW STEP 3: Preparing for atomic match completion (scorecard + stats update)`);

      // Extract team and player data from scorecard for statistics updates
      console.log(`📊 DATA FLOW STEP 4: Extracting individual player statistics from scorecard`);
      const { finalScorecard, awards, resultSummary } = completionData;

      // Determine team IDs and names from match data
      const team1Id = (existingMatch.matchData as any)?.team1Id || null;
      const team2Id = (existingMatch.matchData as any)?.team2Id || null;
      const team1Name = existingMatch.team1Name || (existingMatch.matchData as any)?.team1Name;
      const team2Name = existingMatch.team2Name || (existingMatch.matchData as any)?.team2Name;
      const winnerId = resultSummary.winnerId;

      console.log(`🏏 Teams: ${team1Name} (${team1Id}) vs ${team2Name} (${team2Id}), Winner: ${winnerId || 'None'}`);

      // Extract player statistics from scorecard
      const playerStats: any[] = [];
      console.log(`📈 Processing player performance data from innings...`);

      // Process both innings for player stats
      [...(finalScorecard.team1Innings || []), ...(finalScorecard.team2Innings || [])].forEach((innings: any) => {
        // Add batting stats
        innings.batsmen?.forEach((batsman: any) => {
          const existingPlayerStat = playerStats.find(p => p.playerId === batsman.playerId);
          if (existingPlayerStat) {
            existingPlayerStat.runsScored = (existingPlayerStat.runsScored || 0) + batsman.runsScored;
            existingPlayerStat.ballsFaced = (existingPlayerStat.ballsFaced || 0) + batsman.ballsFaced;
            existingPlayerStat.fours = (existingPlayerStat.fours || 0) + batsman.fours;
            existingPlayerStat.sixes = (existingPlayerStat.sixes || 0) + batsman.sixes;
            // Update dismissal if not already out
            if (!existingPlayerStat.isOut && batsman.dismissalType !== 'not-out') {
              existingPlayerStat.isOut = true;
              existingPlayerStat.dismissalType = batsman.dismissalType;
            }
          } else {
            playerStats.push({
              playerId: batsman.playerId,
              teamId: innings.battingTeamId,
              runsScored: batsman.runsScored,
              ballsFaced: batsman.ballsFaced,
              fours: batsman.fours,
              sixes: batsman.sixes,
              isOut: batsman.dismissalType !== 'not-out',
              dismissalType: batsman.dismissalType === 'not-out' ? null : batsman.dismissalType,
            });
          }
        });

        // Add bowling stats
        innings.bowlers?.forEach((bowler: any) => {
          const existingPlayerStat = playerStats.find(p => p.playerId === bowler.playerId);
          if (existingPlayerStat) {
            existingPlayerStat.oversBowled = (existingPlayerStat.oversBowled || 0) + bowler.overs;
            existingPlayerStat.runsGiven = (existingPlayerStat.runsGiven || 0) + bowler.runsGiven;
            existingPlayerStat.wicketsTaken = (existingPlayerStat.wicketsTaken || 0) + bowler.wickets;
            existingPlayerStat.maidens = (existingPlayerStat.maidens || 0) + bowler.maidens;
          } else {
            playerStats.push({
              playerId: bowler.playerId,
              teamId: innings.battingTeamId === team1Id ? team2Id : team1Id, // Bowler is from opposite team
              oversBowled: bowler.overs,
              runsGiven: bowler.runsGiven,
              wicketsTaken: bowler.wickets,
              maidens: bowler.maidens,
            });
          }
        });
      });

      console.log(`✅ DATA FLOW STEP 4: Extracted stats for ${playerStats.length} players`);

      // Add awards to player stats
      if (awards) {
        console.log(`🏆 Processing player awards...`);
        if (awards.manOfTheMatch) {
          const player = playerStats.find(p => p.playerId === awards.manOfTheMatch);
          if (player) {
            player.manOfMatch = true;
            console.log(`👑 Man of the Match: Player ${awards.manOfTheMatch}`);
          }
        }
        if (awards.bestBatsman) {
          const player = playerStats.find(p => p.playerId === awards.bestBatsman);
          if (player) {
            player.bestBatsman = true;
            console.log(`🏏 Best Batsman: Player ${awards.bestBatsman}`);
          }
        }
        if (awards.bestBowler) {
          const player = playerStats.find(p => p.playerId === awards.bestBowler);
          if (player) {
            player.bestBowler = true;
            console.log(`⚾ Best Bowler: Player ${awards.bestBowler}`);
          }
        }
        if (awards.bestFielder) {
          const player = playerStats.find(p => p.playerId === awards.bestFielder);
          if (player) {
            player.bestFielder = true;
            console.log(`🥅 Best Fielder: Player ${awards.bestFielder}`);
          }
        }
      }

      // Apply match results atomically - updates match, teams, and player statistics
      console.log(`📊 DATA FLOW STEP 4-5: Atomically updating match + team + player statistics`);
      let applyResult;
      let userStatsUpdated = 0;
      const userStatsErrors: string[] = [];

      if (playerStats.length > 0) {
        const matchResultsData = {
          matchId,
          status: 'completed' as const,
          team1Id,
          team2Id,
          team1Name,
          team2Name,
          winnerTeamId: winnerId,
          scorecard: finalScorecard,
          awards,
          resultSummary,
          playerStats
        };

        applyResult = await storage.applyMatchResults(matchResultsData);

        if (!applyResult.success) {
          console.log(`❌ DATA FLOW ERROR: Failed atomic update - match, teams, and players`);
          console.error("Error applying match results:", applyResult.errors);
          return res.status(500).json({
            message: "Failed to complete match and update statistics",
            errors: applyResult.errors
          });
        }

        console.log(`✅ DATA FLOW STEP 4-5: Atomic update successful - match, teams, and players updated`);
        console.log(`📈 Stats Update Summary: ${playerStats.length} players updated`);

        // Update user cricket statistics for linked players
        console.log(`👤 DATA FLOW STEP 6: Updating user cricket statistics for linked players`);

        for (const playerStat of playerStats) {
          try {
            // Get player to check if they're linked to a user
            const player = await storage.getPlayer(playerStat.playerId);
            if (player && player.userId) {
              console.log(`🔄 Updating cricket stats for linked user ${player.userId} (player: ${player.name})`);

              const userStatsUpdate = {
                runsScored: playerStat.runsScored || 0,
                ballsFaced: playerStat.ballsFaced || 0,
                fours: playerStat.fours || 0,
                sixes: playerStat.sixes || 0,
                isOut: playerStat.isOut || false,
                oversBowled: playerStat.oversBowled || 0,
                runsGiven: playerStat.runsGiven || 0,
                wicketsTaken: playerStat.wicketsTaken || 0,
                maidens: playerStat.maidens || 0,
                catches: playerStat.catches || 0,
                runOuts: playerStat.runOuts || 0,
                stumpings: playerStat.stumpings || 0,
                manOfMatch: playerStat.manOfMatch || false,
                bestBatsman: playerStat.bestBatsman || false,
                bestBowler: playerStat.bestBowler || false,
                bestFielder: playerStat.bestFielder || false,
                isWinner: playerStat.teamId === winnerId
              };

              const userStatsResult = await storage.updateUserCricketStats?.(player.userId, matchId, userStatsUpdate);
              if (userStatsResult?.success) {
                if (userStatsResult.alreadyProcessed) {
                  console.log(`⚠️ User cricket stats already processed for ${player.name} (user: ${player.userId})`);
                } else {
                  userStatsUpdated++;
                  console.log(`✅ User cricket stats updated for ${player.name} (user: ${player.userId})`);
                }
              } else {
                const errorMsg = `Failed to update user stats for ${player.name}: ${userStatsResult?.error || 'Unknown error'}`;
                console.error(`❌ ${errorMsg}`);
                userStatsErrors.push(errorMsg);
              }
            }
          } catch (error) {
            const errorMsg = `Error processing user stats for player ${playerStat.playerId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`❌ ${errorMsg}`);
            userStatsErrors.push(errorMsg);
          }
        }

        console.log(`✅ DATA FLOW STEP 6: User cricket stats update completed - ${userStatsUpdated}/${playerStats.length} linked players updated`);
        if (userStatsErrors.length > 0) {
          console.log(`⚠️ User stats update errors: ${userStatsErrors.length}`);
          userStatsErrors.forEach(error => console.log(`   - ${error}`));
        }

        // Log cache invalidation information for frontend
        const cacheInfo = (applyResult as any).cacheInvalidation;
        if (cacheInfo) {
          console.log(`🔄 DATA FLOW: Cache invalidation required for:`);
          console.log(`   - Teams: ${cacheInfo.teams.join(', ')}`);
          console.log(`   - Players: ${cacheInfo.players.join(', ')}`);
          console.log(`   - Matches: ${cacheInfo.matches.join(', ')}`);
        }
      } else {
        console.log(`⚠️ DATA FLOW: Skipping atomic update - missing teams or no player stats`);
        // If no stats to update, just mark match as completed
        const matchResultsData = {
          matchId,
          status: 'completed' as const,
          scorecard: finalScorecard,
          awards,
          resultSummary,
          playerStats: []
        };
        applyResult = await storage.applyMatchResults(matchResultsData);
      }

      console.log(`🎉 DATA FLOW COMPLETE: Match ${matchId} processing finished successfully`);
      console.log(`📊 FINAL SUMMARY: Match → Scorecard → ${playerStats.length} Player Stats → Career Updates → Profile Ready`);

      res.status(200).json({
        message: "Match completed successfully",
        match: applyResult.updatedMatch,
        statistics: {
          teamsUpdated: team1Id && team2Id ? 2 : 0,
          playersUpdated: playerStats.length,
          userStatsUpdated: userStatsUpdated || 0,
          awardsProcessed: awards ? Object.keys(awards).length : 0
        },
        dataFlow: {
          matchProcessed: true,
          scorecardStored: true,
          playerStatsExtracted: playerStats.length,
          careerStatsUpdated: true,
          userStatsUpdated: userStatsUpdated || 0,
          userStatsErrors: userStatsErrors || [],
          profilesReady: true,
          atomicUpdate: true
        },
        cacheInvalidation: (applyResult as any).cacheInvalidation || {
          teams: [],
          players: [],
          matches: []
        }
      });

    } catch (error: any) {
      console.log(`❌ DATA FLOW FAILED: Error completing match ${req.params.id}`);
      console.error("Error completing match:", error);
      if (error.name === 'ZodError') {
        console.log(`📊 DATA FLOW ERROR: Scorecard validation failed - ${error.issues?.[0]?.message || 'Invalid data'}`);
        return res.status(400).json({
          message: "Validation error",
          issues: error.issues
        });
      }
      res.status(500).json({ message: "Failed to complete match" });
    }
  });

  // Player stats update route (for post-match statistics)
  app.put('/api/players/:id/stats', requireAuth, async (req, res) => {
    try {
      const { matchStats } = req.body;
      const player = await storage.updatePlayerStats(req.params.id, matchStats);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error updating player stats:", error);
      res.status(500).json({ message: "Failed to update player stats" });
    }
  });

  // Team stats update route (for post-match statistics)
  app.put('/api/teams/:id/stats', requireAuth, async (req, res) => {
    try {
      const { stats } = req.body;
      const team = await storage.updateTeamStats(req.params.id, stats);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error updating team stats:", error);
      res.status(500).json({ message: "Failed to update team stats" });
    }
  });

  // Development route to seed sample completed matches with result data
  app.post('/api/dev/seed-completed-matches', requireAuth, async (req, res) => {
    try {
      // Get some live matches to convert to completed
      const allMatches = await storage.getMatches();
      const liveMatches = allMatches.filter(match =>
        match.status === 'live' &&
        (match.matchData as any)?.team1Id &&
        (match.matchData as any)?.team2Id
      ).slice(0, 3); // Take first 3 live matches

      const completedMatches = [];

      for (let i = 0; i < liveMatches.length; i++) {
        const match = liveMatches[i];
        const matchData = match.matchData as any;

        // Create different result types for variety
        let resultSummary;
        const team1Id = matchData.team1Id;
        const team2Id = matchData.team2Id;

        if (i === 0) {
          // Team 1 wins by runs
          resultSummary = {
            winnerId: team1Id,
            resultType: "won-by-runs" as const,
            marginRuns: 25
          };
        } else if (i === 1) {
          // Team 2 wins by wickets  
          resultSummary = {
            winnerId: team2Id,
            resultType: "won-by-wickets" as const,
            marginWickets: 4
          };
        } else {
          // Tied match
          resultSummary = {
            resultType: "tied" as const
          };
        }

        // Update the match to completed with result summary
        const updatedMatch = await storage.updateMatch(match.id, {
          status: 'completed',
          matchData: {
            ...matchData,
            resultSummary,
            processed: true
          }
        });

        if (updatedMatch) {
          completedMatches.push(updatedMatch);
        }
      }

      res.json({
        message: `Successfully created ${completedMatches.length} completed matches with result data`,
        matches: completedMatches.map(m => ({
          id: m.id,
          title: m.title,
          status: m.status,
          resultSummary: (m.matchData as any).resultSummary
        }))
      });

    } catch (error) {
      console.error("Error seeding completed matches:", error);
      res.status(500).json({ message: "Failed to seed completed matches" });
    }
  });

  // Invitation routes
  app.post("/api/invitations", requireAuth, async (req: any, res) => {
    try {
      const user = req.user || req.session.user;

      if (!user) {
        console.warn("🚫 INVITATION: Unauthorized attempt (user not found after auth check)");
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log("📝 INVITATION: Request body:", req.body);

      const validationResult = insertInvitationSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorDetails = {
          body: req.body,
          errors: validationResult.error.format(),
          timestamp: new Date().toISOString()
        };
        console.error("❌ INVITATION: Validation failed:", errorDetails.errors);

        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.format()
        });
      }

      const validatedData = validationResult.data;

      // Add inviter information
      const invitationData = {
        ...validatedData,
        inviterName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
        inviterId: user.id,
      };

      const invitation = await storage.createInvitation(invitationData);

      // Generate the invitation link
      const baseUrl = process.env.REPL_SLUG
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : `http://localhost:${process.env.PORT || 5000}`;
      const invitationLink = `${baseUrl}/accept-invite/${invitation.token}`;

      res.json({
        ...invitation,
        invitationLink
      });
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      res.status(400).json({ message: error.message || "Failed to create invitation" });
    }
  });

  app.get("/api/invitations", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const filters: any = {};
      if (req.query.matchId) filters.matchId = req.query.matchId as string;
      if (req.query.teamId) filters.teamId = req.query.teamId as string;
      if (req.query.status) filters.status = req.query.status as string;

      // Support viewing both sent and received invitations
      const type = req.query.type as string;
      if (type === 'received') {
        // Show invitations sent to this user's email
        filters.email = user.email;
      } else {
        // Default: show invitations created by this user
        filters.inviterId = user.id;
      }

      const invitations = await storage.getInvitations(filters);

      // Generate invitation links for each
      const baseUrl = process.env.REPL_SLUG
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : `http://localhost:${process.env.PORT || 5000}`;

      const invitationsWithLinks = invitations.map(inv => ({
        ...inv,
        invitationLink: `${baseUrl}/accept-invite/${inv.token}`
      }));

      res.json(invitationsWithLinks);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.get("/api/invitations/token/:token", async (req, res) => {
    try {
      const invitation = await storage.getInvitationByToken(req.params.token);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Check if expired
      if (new Date() > invitation.expiresAt && invitation.status === 'pending') {
        await storage.updateInvitation(invitation.id, { status: 'expired' });
        return res.status(410).json({ message: "Invitation has expired" });
      }

      res.json(invitation);
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  app.post("/api/invitations/:token/accept", async (req, res) => {
    try {
      const { token } = req.params;
      const { guestPlayerData } = req.body;
      const user = (req as any).user;

      const invitation = await storage.getInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: `Invitation is ${invitation.status}` });
      }

      if (new Date() > invitation.expiresAt) {
        await storage.updateInvitation(invitation.id, { status: 'expired' });
        return res.status(410).json({ message: "Invitation has expired" });
      }

      let playerId: string | undefined;

      // If guest player data is provided, create a guest player
      if (guestPlayerData) {
        const player = await storage.createPlayer({
          name: guestPlayerData.name,
          email: guestPlayerData.email,
          isGuest: true,
          teamId: invitation.teamId || undefined,
        });
        playerId = player.id;
      } else if (user) {
        // For authenticated users, try to find or create their player profile
        let player = await storage.getPlayerByUserId(user.id);
        if (!player) {
          player = await storage.createPlayer({
            name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
            email: user.email,
            userId: user.id,
            teamId: invitation.teamId || undefined,
          });
        }
        playerId = player.id;
      }

      // Accept the invitation
      const result = await storage.acceptInvitation(token, {
        userId: user?.id,
        playerId,
      });

      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({
        message: "Invitation accepted successfully",
        invitation: result.invitation,
        playerId,
      });
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: error.message || "Failed to accept invitation" });
    }
  });

  app.delete("/api/invitations/:id", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const invitation = await storage.getInvitation(req.params.id);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Only the inviter can revoke
      if (invitation.inviterId !== user.id) {
        return res.status(403).json({ message: "You can only revoke your own invitations" });
      }

      const success = await storage.revokeInvitation(req.params.id);

      if (success) {
        res.json({ message: "Invitation revoked successfully" });
      } else {
        res.status(500).json({ message: "Failed to revoke invitation" });
      }
    } catch (error) {
      console.error("Error revoking invitation:", error);
      res.status(500).json({ message: "Failed to revoke invitation" });
    }
  });

  // Match Request endpoint
  app.post("/api/match-requests", requireAuth, async (req: any, res) => {
    try {
      const { team1Id, team2Id, matchType, message } = req.body;
      const user = req.user || req.session?.user;
      const userId = user?.id || (user as any)?._id?.toString();

      console.log(`[ROUTE DEBUG] /api/match-requests attempt by ${user?.email || 'Guest'}. isSiteAdmin: ${user?.isAdmin || false}, team1Id: ${team1Id}, team2Id: ${team2Id}`);

      if (!team1Id || !team2Id) {
        return res.status(400).json({ message: "Both team1Id and team2Id are required" });
      }

      // 1. Verify sender is Admin/Co-Admin of team1 or a Site Admin
      // DEFINITIVE FAIL-SAFE: If email matches ADMIN_EMAIL, it's a site admin.
      const isSiteAdmin = user?.isAdmin === true || isAdminEmail(user?.email);

      if (!isSiteAdmin) {
        if (!userId) {
          return res.status(401).json({ message: "User ID not found in session" });
        }

        const team1Profiles = await storage.getPlayers({ userId, teamId: team1Id });
        const senderProfile = team1Profiles[0];
        const isAllowed = senderProfile?.teamRole === "admin" || senderProfile?.teamRole === "co-admin";

        if (!isAllowed) {
          console.warn(`[AUTH DENIED] User ${userId} (${user?.email}) blocked from match request for team ${team1Id}`);
          return res.status(403).json({
            message: "Only Team Admins or Co-Admins can initiate match requests."
          });
        }
      } else {
        console.log(`[AUTH BYPASS] Site Admin ${user?.email} initiating match request.`);
      }

      // 2. Identify Admins/Co-Admins of team2
      const team2Players = await storage.getPlayers({ teamId: team2Id });
      const team2Admins = team2Players.filter(p =>
        (p.teamRole === "admin" || p.teamRole === "co-admin") && p.userId
      );

      if (team2Admins.length === 0) {
        return res.status(404).json({
          message: "Could not find any Admin or Co-Admin for the opponent team to receive the request."
        });
      }

      // 3. Send notifications to all team2 admins
      const senderName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;
      const team1 = await storage.getTeam(team1Id);
      const team2 = await storage.getTeam(team2Id);

      const notifications = await Promise.all(team2Admins.map(admin =>
        storage.createNotification({
          recipientUserId: admin.userId!,
          senderName: senderName,
          senderEmail: user.email,
          senderPhone: user.phoneNumber || "Not provided",
          type: "match_request",
          team1Id,
          team2Id,
          matchType: matchType || "Friendly",
          message: message || `${team1?.name || 'A team'} has challenged ${team2?.name || 'your team'} to a ${matchType || 'Friendly'} match!`
        })
      ));

      res.status(201).json({
        message: "Match request sent successfully",
        notificationCount: notifications.length
      });
    } catch (error: any) {
      console.error("Error creating match request:", error);
      res.status(500).json({ message: "Failed to send match request" });
    }
  });

  // Notification routes
  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.json(notification);
    } catch (error: any) {
      console.error("Error creating notification:", error);
      res.status(400).json({ message: error.message || "Failed to create notification" });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as string;

      const notifications = await storage.getNotifications(user.id, filters);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const count = await storage.getUnreadNotificationCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications/:id/accept", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get the notification being accepted
      const allNotifications = await storage.getNotifications(user.id);
      const notification = allNotifications.find(n => n.id === req.params.id);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Update notification status to accepted
      const updatedNotification = await storage.updateNotificationStatus(req.params.id, "accepted");

      // Send notification back to original sender
      try {
        // Look up player by sender's email first
        let senderPlayer = await storage.getPlayerByEmail(notification.senderEmail);

        // If no player found, try to find user by email and check for linked player
        if (!senderPlayer) {
          const senderUser = await storage.getUserByEmail(notification.senderEmail);
          if (senderUser) {
            // Check if this user has any linked player (by userId)
            const linkedPlayer = await storage.getPlayerByUserId(senderUser.id);
            if (linkedPlayer) {
              senderPlayer = linkedPlayer;
            } else {
              // Create a minimal player profile for notifications only
              try {
                const playerName = senderUser.firstName && senderUser.lastName
                  ? `${senderUser.firstName} ${senderUser.lastName}`
                  : notification.senderName;

                senderPlayer = await storage.createPlayer({
                  name: playerName,
                  email: notification.senderEmail,
                  userId: senderUser.id,
                });
                console.log(`✅ Created player profile for user ${senderUser.email} to receive notifications`);
              } catch (createError: any) {
                console.error(`❌ Failed to create player for ${senderUser.email}:`, createError.message);
                // If creation fails, we can't send the notification
                throw createError;
              }
            }
          }
        }

        if (senderPlayer) {
          // Create acceptance notification for the sender
          const accepterName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email;

          await storage.createNotification({
            recipientPlayerId: senderPlayer.id,
            recipientEmail: notification.senderEmail,
            senderName: accepterName,
            senderEmail: user.email,
            senderPhone: user.phoneNumber || "Not provided",
            type: "match_request",
            matchType: notification.matchType || undefined,
            location: notification.location || undefined,
            message: `${accepterName} accepted your match request! Please contact them to finalize the details.`,
          });

          console.log(`✅ Sent acceptance notification to ${notification.senderEmail}`);
        } else {
          console.log(`⚠️  Could not find user or player with email ${notification.senderEmail} to send acceptance notification`);
        }
      } catch (error) {
        console.error("Error sending acceptance notification:", error);
        // Don't fail the main request if sending notification fails
      }

      res.json({
        ...updatedNotification,
        matchRequestData: notification.type === 'match_request' ? {
          // Swap: notification.team2Id is the accepter's team (should be Team 1 from their view)
          //       notification.team1Id is the challenger's team (should be Team 2)
          team1Id: notification.team2Id || null,
          team2Id: notification.team1Id || null,
          matchType: notification.matchType || "Friendly",
          sport: notification.sport || "cricket"
        } : null
      });
    } catch (error) {
      console.error("Error accepting notification:", error);
      res.status(500).json({ message: "Failed to accept notification" });
    }
  });

  app.post("/api/notifications/:id/accept-booking", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Directly mark notification as accepted by its ID (no user-scoped filter)
      const updatedNotification = await storage.updateNotificationStatus(req.params.id, "accepted");

      if (!updatedNotification) {
        return res.status(404).json({ message: "Booking request notification not found" });
      }

      // Send a booking_accepted notification back to the original requester
      try {
        const accepterName = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email;

        const senderEmail = updatedNotification.senderEmail;
        if (senderEmail) {
          const senderUser = await storage.getUserByEmail(senderEmail);
          let recipientUserId: string | undefined;
          let recipientPlayerId: string | undefined;

          if (senderUser) {
            recipientUserId = senderUser.id;
          } else {
            const senderPlayer = await storage.getPlayerByEmail(senderEmail);
            if (senderPlayer) {
              recipientPlayerId = senderPlayer.id;
            }
          }

          if (recipientUserId || recipientPlayerId) {
            await storage.createNotification({
              recipientUserId,
              recipientPlayerId,
              recipientEmail: senderEmail,
              senderName: accepterName,
              senderEmail: user.email,
              senderPhone: (user as any).phoneNumber || "Not provided",
              type: "booking_accepted",
              message: `${accepterName} accepted your booking request! They will contact you to finalize the details.`,
            });
            console.log(`✅ Sent booking_accepted notification to ${senderEmail}`);
          }
        }
      } catch (notifError) {
        console.error("Error sending booking_accepted notification:", notifError);
        // Don't fail the main request
      }

      res.json(updatedNotification);
    } catch (error) {
      console.error("Error accepting booking notification:", error);
      res.status(500).json({ message: "Failed to accept booking" });
    }
  });

  app.patch("/api/notifications/:id/status", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { status } = req.body;
      if (!["read", "accepted", "declined"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedNotification = await storage.updateNotificationStatus(req.params.id, status as any);
      if (!updatedNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // If declined and it's a match request, notify the original sender
      if (status === "declined" && updatedNotification.type === "match_request") {
        try {
          const originalNotification = await storage.getNotifications(user.id).then(notifs => notifs.find(n => n.id === req.params.id));
          // Note: updateNotificationStatus returns the updated notification, but we might need the original senderEmail
          const senderEmail = updatedNotification.senderEmail;
          const senderName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;

          if (senderEmail) {
            const senderUser = await storage.getUserByEmail(senderEmail);
            let recipientUserId: string | undefined;
            let recipientPlayerId: string | undefined;

            if (senderUser) {
              recipientUserId = senderUser.id;
            } else {
              const senderPlayer = await storage.getPlayerByEmail(senderEmail);
              if (senderPlayer) {
                recipientPlayerId = senderPlayer.id;
              }
            }

            if (recipientUserId || recipientPlayerId) {
              await storage.createNotification({
                recipientUserId,
                recipientPlayerId,
                recipientEmail: senderEmail,
                senderName: senderName,
                senderEmail: user.email,
                senderPhone: user.phoneNumber || "Not provided",
                type: "match_request",
                message: `${senderName} declined your match request.`,
              });
            }
          }
        } catch (notifyError) {
          console.error("Error sending decline notification:", notifyError);
        }
      }

      res.json(updatedNotification);
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const success = await storage.deleteNotification(req.params.id);
      if (success) {
        res.json({ message: "Notification deleted successfully" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Booking status update route
  app.patch("/api/bookings/:id/status", requireAuth, async (req: any, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "confirmed", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Only the venue owner can update booking status
      const venue = await storage.getVenue(booking.venueId);
      if (!venue || venue.ownerId !== req.session.user.id) {
        return res.status(403).json({ message: "Only the venue owner can update status" });
      }

      const updatedBooking = await storage.updateBooking(req.params.id, { status });

      // Notify the booker if accepted
      if (status === "confirmed") {
        try {
          const owner = req.session.user;
          const ownerName = owner.firstName && owner.lastName ? `${owner.firstName} ${owner.lastName}` : (owner.username || owner.email);

          await storage.createNotification({
            recipientUserId: booking.userId,
            senderName: ownerName,
            senderEmail: owner.email,
            senderPhone: owner.phoneNumber || "Not provided",
            type: "booking_accepted",
            bookingId: booking.id,
            location: venue.name,
            message: `Your booking for ${venue.name} has been accepted!`,
          });
        } catch (notifyError) {
          console.error("Error notifying booker:", notifyError);
        }
      }

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Generic booking update route
  app.patch("/api/bookings/:id", requireAuth, async (req: any, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Allow either the booker or the venue owner to update
      const venue = await storage.getVenue(booking.venueId);
      const isOwner = venue && venue.ownerId === req.session.user.id;
      const isBooker = booking.userId === req.session.user.id;

      if (!isOwner && !isBooker) {
        return res.status(403).json({ message: "Unauthorized to update this booking" });
      }

      const updatedBooking = await storage.updateBooking(req.params.id, req.body);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Handle booking acceptance from notification
  app.post("/api/notifications/:id/accept-booking", requireAuth, async (req: any, res) => {
    try {
      const allNotifications = await storage.getNotifications(req.session.user.id);
      const notification = allNotifications.find(n => n.id === req.params.id);

      if (!notification || notification.type !== "booking_request" || !notification.bookingId) {
        return res.status(404).json({ message: "Booking request notification not found" });
      }

      const booking = await storage.getBooking(notification.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update booking status
      const updatedBooking = await storage.updateBooking(booking.id, { status: "confirmed" });

      // Update notification status
      await storage.updateNotificationStatus(notification.id, "accepted");

      // Notify the booker
      try {
        const venue = await storage.getVenue(booking.venueId);
        const owner = req.session.user;
        const ownerName = owner.firstName && owner.lastName ? `${owner.firstName} ${owner.lastName}` : (owner.username || owner.email);

        await storage.createNotification({
          recipientUserId: booking.userId,
          senderName: ownerName,
          senderEmail: owner.email,
          senderPhone: owner.phoneNumber || "Not provided",
          type: "booking_accepted",
          bookingId: booking.id,
          location: venue?.name || "Venue",
          message: `Your booking for ${venue?.name || 'the venue'} has been accepted!`,
        });
      } catch (notifyError) {
        console.error("Error notifying booker from notification accept:", notifyError);
      }

      res.json({ message: "Booking accepted successfully", booking: updatedBooking });
    } catch (error) {
      console.error("Error accepting booking from notification:", error);
      res.status(500).json({ message: "Failed to accept booking" });
    }
  });

  // Availability routes
  app.post("/api/availability/match", requireAuth, async (req: any, res) => {
    console.log("POST /api/availability/match - Body:", JSON.stringify(req.body));
    try {
      const data = insertMatchAvailabilitySchema.parse({
        ...req.body,
        authorId: (req.user as any).id,
      });

      // Update user's region from the post to ensure profile is in sync
      if (data.region) {
        console.log(`Updating user ${(req.user as any).id} region to ${data.region}`);
        await storage.updateUser((req.user as any).id, { region: data.region });
      }

      const post = await storage.createMatchAvailability(data);
      console.log("Match post created:", JSON.stringify(post));
      res.json(post);
    } catch (error: any) {
      console.error("Error creating match availability:", error);
      res.status(400).json({ message: error.message || "Failed to create match availability" });
    }
  });

  app.use("/api/availability/match", (req, res, next) => {
    console.log(`Middleware check for /api/availability/match: ${req.method} ${req.originalUrl}`);
    next();
  });

  app.get("/api/availability/match", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser((req.user as any).id);
      const region = (req.query.region as string) || user?.region;

      if (!region) {
        return res.json([]);
      }
      const posts = await storage.getMatchAvailability(region);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching match availability:", error);
      res.status(500).json({ message: "Failed to fetch match availability" });
    }
  });




  app.post("/api/availability/player", requireAuth, async (req: any, res) => {
    try {
      const data = insertPlayerAvailabilitySchema.parse({
        ...req.body,
        authorId: (req.user as any).id,
      });

      // Update user's region from the post to ensure profile is in sync
      if (data.region) {
        await storage.updateUser((req.user as any).id, { region: data.region });
      }

      const post = await storage.createPlayerAvailability(data);
      res.json(post);
    } catch (error: any) {
      console.error("Error creating player availability:", error);
      res.status(400).json({ message: error.message || "Failed to create player availability" });
    }
  });

  app.get("/api/availability/player", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser((req.user as any).id);
      const region = (req.query.region as string) || user?.region;

      if (!region) {
        return res.json([]);
      }
      const posts = await storage.getPlayerAvailability(region);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching player availability:", error);
      res.status(500).json({ message: "Failed to fetch player availability" });
    }
  });

  // Availability Contact endpoint
  app.post("/api/availability/contact", requireAuth, async (req: any, res) => {
    try {
      const { name, phoneNumber, place, postType, postId, postDescription } = req.body;
      if (!name || !phoneNumber || !place) {
        return res.status(400).json({ message: "Name, phone number, and place are required" });
      }

      const sender = await storage.getUser((req.user as any).id);

      // Store as a notification for the admin
      const ADMIN_EMAIL = "kit27.ad17@gmail.com";
      const adminUser = await storage.getUserByEmail(ADMIN_EMAIL);

      const message = `Availability Contact Request:
Type: ${postType || "availability"}
Post: ${postDescription || postId}
Requester Name: ${name}
Phone: ${phoneNumber}
Place: ${place}
Sent by: ${sender?.firstName || ""} ${sender?.lastName || ""} (${sender?.email || ""})`;

      if (adminUser) {
        await storage.createNotification({
          recipientUserId: adminUser.id,
          senderName: name,
          senderEmail: sender?.email || "",
          senderPhone: phoneNumber,
          senderPlace: place,
          type: "booking_request",
          message: message,
          preferredTiming: `Phone: ${phoneNumber} | Place: ${place}`,
        });
      }

      res.json({ message: "Contact request sent successfully" });
    } catch (error: any) {
      console.error("Error sending availability contact:", error);
      res.status(500).json({ message: error.message || "Failed to send contact request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
