import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "futgestao-secret-key";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mock Database
  const users: any[] = [];
  const players: any[] = [];
  const matches: any[] = [];

  // Socket.IO logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-match", (matchId) => {
      socket.join(`match-${matchId}`);
      console.log(`User ${socket.id} joined match ${matchId}`);
    });

    socket.on("update-list", (matchId) => {
      io.to(`match-${matchId}`).emit("list-updated");
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = (decoded as any).id;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: Date.now().toString(), name, email, password: hashedPassword };
    users.push(user);
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ user: { id: user.id, name, email }, token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ user: { id: user.id, name: user.name, email }, token });
  });

  app.put("/api/auth/profile", authenticate, async (req: any, res) => {
    const { name, email } = req.body;
    const userIndex = users.findIndex((u) => u.id === req.userId);
    if (userIndex === -1) return res.status(404).json({ message: "User not found" });
    users[userIndex] = { ...users[userIndex], name, email };
    res.json({ id: req.userId, name, email });
  });

  app.put("/api/auth/password", authenticate, async (req: any, res) => {
    const { password } = req.body;
    const userIndex = users.findIndex((u) => u.id === req.userId);
    if (userIndex === -1) return res.status(404).json({ message: "User not found" });
    const hashedPassword = await bcrypt.hash(password, 10);
    users[userIndex].password = hashedPassword;
    res.json({ message: "Password updated" });
  });

  // Player Routes
  app.get("/api/players", authenticate, (req: any, res) => {
    res.json(players.filter((p) => p.organizerId === req.userId));
  });

  app.post("/api/players", authenticate, (req: any, res) => {
    const player = { ...req.body, id: Date.now().toString(), organizerId: req.userId };
    players.push(player);
    res.json(player);
  });

  app.put("/api/players/:id", authenticate, (req: any, res) => {
    const index = players.findIndex((p) => p.id === req.params.id && p.organizerId === req.userId);
    if (index === -1) return res.status(404).json({ message: "Player not found" });
    players[index] = { ...players[index], ...req.body };
    res.json(players[index]);
  });

  // Match Routes
  app.get("/api/matches", authenticate, (req: any, res) => {
    res.json(matches.filter((m) => m.organizerId === req.userId));
  });

  app.get("/api/matches/:id", authenticate, (req: any, res) => {
    const match = matches.find((m) => m.id === req.params.id && m.organizerId === req.userId);
    if (!match) return res.status(404).json({ message: "Match not found" });
    res.json(match);
  });

  app.post("/api/matches", authenticate, (req: any, res) => {
    const match = { ...req.body, id: Date.now().toString(), organizerId: req.userId, status: "agendada" };
    matches.push(match);
    res.json(match);
  });

  app.put("/api/matches/:id", authenticate, (req: any, res) => {
    const index = matches.findIndex((m) => m.id === req.params.id && m.organizerId === req.userId);
    if (index === -1) return res.status(404).json({ message: "Match not found" });
    matches[index] = { ...matches[index], ...req.body };
    res.json(matches[index]);
  });

  // Match Players (In-memory storage for simplicity in this mock)
  const matchPlayersStore: Record<string, any[]> = {};

  app.get("/api/matches/:id/players", authenticate, (req: any, res) => {
    res.json(matchPlayersStore[req.params.id] || []);
  });

  app.post("/api/matches/:id/players", authenticate, (req: any, res) => {
    const player = { ...req.body, id: Date.now().toString() };
    if (!matchPlayersStore[req.params.id]) matchPlayersStore[req.params.id] = [];
    matchPlayersStore[req.params.id].push(player);
    res.json(player);
  });

  app.put("/api/matches/:id/players", authenticate, (req: any, res) => {
    matchPlayersStore[req.params.id] = req.body;
    res.json(matchPlayersStore[req.params.id]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
