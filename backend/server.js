const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = "futgestao-secret-key-2026";

app.use(cors());
app.use(express.json());
app.use(express.static("../frontend"));

const storage = {
  users: [],
  players: [],
  matches: [],
  matchPlayers: {},
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (storage.users.find(u => u.email === email)) {
    return res.status(400).json({ message: "Email já cadastrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword
  };
  storage.users.push(user);
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ user: { id: user.id, name, email }, token });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = storage.users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ user: { id: user.id, name: user.name, email }, token });
});

app.put("/api/auth/profile", authenticate, async (req, res) => {
  const { name, email } = req.body;
  const userIndex = storage.users.findIndex((u) => u.id === req.userId);
  if (userIndex === -1) return res.status(404).json({ message: "Usuário não encontrado" });
  storage.users[userIndex] = { ...storage.users[userIndex], name, email };
  res.json({ id: req.userId, name, email });
});

app.put("/api/auth/password", authenticate, async (req, res) => {
  const { password } = req.body;
  const userIndex = storage.users.findIndex((u) => u.id === req.userId);
  if (userIndex === -1) return res.status(404).json({ message: "Usuário não encontrado" });
  const hashedPassword = await bcrypt.hash(password, 10);
  storage.users[userIndex].password = hashedPassword;
  res.json({ message: "Senha atualizada" });
});

app.get("/api/players", authenticate, (req, res) => {
  res.json(storage.players.filter((p) => p.organizerId === req.userId));
});

app.post("/api/players", authenticate, (req, res) => {
  const player = { ...req.body, id: Date.now().toString(), organizerId: req.userId };
  storage.players.push(player);
  res.json(player);
});

app.put("/api/players/:id", authenticate, (req, res) => {
  const index = storage.players.findIndex((p) => p.id === req.params.id && p.organizerId === req.userId);
  if (index === -1) return res.status(404).json({ message: "Jogador não encontrado" });
  storage.players[index] = { ...storage.players[index], ...req.body };
  res.json(storage.players[index]);
});

app.get("/api/matches", authenticate, (req, res) => {
  res.json(storage.matches.filter((m) => m.organizerId === req.userId));
});

app.get("/api/matches/:id", authenticate, (req, res) => {
  const match = storage.matches.find((m) => m.id === req.params.id && m.organizerId === req.userId);
  if (!match) return res.status(404).json({ message: "Pelada não encontrada" });
  res.json(match);
});

app.post("/api/matches", authenticate, (req, res) => {
  const match = {
    ...req.body,
    id: Date.now().toString(),
    organizerId: req.userId,
    status: "agendada"
  };
  storage.matches.push(match);
  storage.matchPlayers[match.id] = [];
  res.json(match);
});

app.put("/api/matches/:id", authenticate, (req, res) => {
  const index = storage.matches.findIndex((m) => m.id === req.params.id && m.organizerId === req.userId);
  if (index === -1) return res.status(404).json({ message: "Pelada não encontrada" });
  storage.matches[index] = { ...storage.matches[index], ...req.body };
  res.json(storage.matches[index]);
});

app.get("/api/matches/:id/players", authenticate, (req, res) => {
  res.json(storage.matchPlayers[req.params.id] || []);
});

app.post("/api/matches/:id/players", authenticate, (req, res) => {
  const player = { ...req.body, id: Date.now().toString() };
  if (!storage.matchPlayers[req.params.id]) storage.matchPlayers[req.params.id] = [];
  storage.matchPlayers[req.params.id].push(player);
  res.json(player);
});

app.put("/api/matches/:id/players", authenticate, (req, res) => {
  storage.matchPlayers[req.params.id] = req.body;
  res.json(storage.matchPlayers[req.params.id]);
});

io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);

  socket.on("join-match", (matchId) => {
    socket.join(`match-${matchId}`);
    console.log(`Usuário ${socket.id} entrou na pelada ${matchId}`);
  });

  socket.on("update-list", (matchId) => {
    io.to(`match-${matchId}`).emit("list-updated");
  });

  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║           🎯 FutGestão Backend Iniciado               ║
╠═══════════════════════════════════════════════════════╣
║  Servidor rodando em: http://localhost:${PORT}        ║
║  Status: ✅ Operacional                               ║
║  Socket.IO: ✅ Ativo                                  ║
╚═══════════════════════════════════════════════════════╝
  `);
});
