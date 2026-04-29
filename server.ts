/**
 * SIMULATED BACKEND (Express + Vite)
 * 
 * NOTE: This server is used for the live preview in this environment.
 * The real Django backend requested is implemented in the project files:
 * - /backend/ (Django project)
 * - /users/ (Auth app)
 * - /futebol/ (Core app)
 * - /vercel.json (Vercel config)
 * - /requirements.txt (Python dependencies)
 * 
 * The API endpoints below match the Django implementation.
 */
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
  const players: any[] = [
    { id: "1", nome: "Gabriel Jesus", nivel_estrelas: 4.5, ativo: true, organizador: "1", data_cadastro: new Date() },
    { id: "2", nome: "Vinicius Jr", nivel_estrelas: 5.0, ativo: true, organizador: "1", data_cadastro: new Date() },
  ];
  const peladas: any[] = [];
  const peladaJogadores: any[] = [];
  const championships: any[] = [];
  const games: any[] = [];
  const events: any[] = [];
  const championshipEvents: any[] = []; // Unified events for championship games
  const timePeladas: any[] = [];
  const timeJogadores: any[] = [];

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
  app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: Date.now().toString(), name, email, password: hashedPassword };
    users.push(user);
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ user: { id: user.id, name, email }, token });
  });

  app.post("/api/token", async (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ user: { id: user.id, name: user.name, email }, token });
  });

  app.get("/api/me", authenticate, (req: any, res) => {
    const user = users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user.id, name: user.name, email: user.email });
  });

  // Socket.io for Real-Time Live Game
  io.on("connection", (socket) => {
    socket.on("join-pelada", (peladaId) => {
      socket.join(`pelada-${peladaId}`);
    });

    socket.on("update-cronometro", (data) => {
      // data: { peladaId, segundos, ativo }
      const pelada = peladas.find(p => p.id === data.peladaId);
      if (pelada) {
        pelada.cronometro_segundos = data.segundos;
        pelada.cronometro_ativo = data.ativo;
      }
      socket.to(`pelada-${data.peladaId}`).emit("cronometro-changed", data);
    });

    socket.on("update-placar", (data) => {
      // data: { peladaId, placar_casa, placar_visitante }
      const pelada = peladas.find(p => p.id === data.peladaId);
      if (pelada) {
        pelada.placar_casa = data.placar_casa;
        pelada.placar_visitante = data.placar_visitante;
      }
      socket.to(`pelada-${data.peladaId}`).emit("placar-changed", data);
    });

    socket.on("novo-evento", (data) => {
      // data: { peladaId, evento }
      socket.to(`pelada-${data.peladaId}`).emit("evento-recebido", data.evento);
    });
  });

  // Events API
  app.get("/api/eventos", authenticate, (req: any, res) => {
    const { pelada } = req.query;
    res.json(events.filter(e => e.pelada === pelada).map(e => ({
      ...e,
      jogador_nome: players.find(p => p.id === e.jogador)?.nome
    })));
  });

  app.post("/api/eventos", authenticate, (req: any, res) => {
    const evento = { id: Date.now().toString(), ...req.body };
    events.push(evento);
    res.status(201).json(evento);
  });

  // Players (Jogadores)
  app.get("/api/jogadores/:id", authenticate, (req: any, res) => {
    const player = players.find(p => p.id === req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });
    
    // Calculate stats
    const pEvents = events.filter(e => e.jogador === player.id);
    const stats = {
      total_jogos: peladas.filter(p => peladaJogadores.some(pj => pj.peladaId === p.id && pj.jogadorId === player.id)).length,
      total_gols: pEvents.filter(e => e.tipo === 'gol').length,
      total_assistencias: events.filter(e => e.jogador_assistencia === player.id).length,
      total_vitorias: 0,
      total_empates: 0,
      total_derrotas: 0,
      media_gols: 0
    };
    stats.media_gols = stats.total_jogos > 0 ? stats.total_gols / stats.total_jogos : 0;

    res.json({ ...player, estatisticas: stats });
  });

  app.get("/api/jogadores", authenticate, (req: any, res) => {
    res.json(players.filter(p => p.organizador === req.userId));
  });

  app.post("/api/jogadores", authenticate, (req: any, res) => {
    const player = { 
      id: Date.now().toString(), 
      ...req.body, 
      organizador: req.userId,
      data_cadastro: new Date() 
    };
    players.push(player);
    res.json(player);
  });

  app.put("/api/jogadores/:id", authenticate, (req: any, res) => {
    const index = players.findIndex(p => p.id === req.params.id && p.organizador === req.userId);
    if (index === -1) return res.status(404).json({ message: "Player not found" });
    players[index] = { ...players[index], ...req.body };
    res.json(players[index]);
  });

  app.delete("/api/jogadores/:id", authenticate, (req: any, res) => {
    const index = players.findIndex(p => p.id === req.params.id && p.organizador === req.userId);
    if (index === -1) return res.status(404).json({ message: "Player not found" });
    // Soft delete
    players[index].ativo = false;
    res.status(204).send();
  });

  // Peladas
  app.get("/api/peladas", authenticate, (req: any, res) => {
    res.json(peladas.filter(p => p.organizador === req.userId));
  });

  app.get("/api/peladas/:id", authenticate, (req: any, res) => {
    const pelada = peladas.find(p => p.id === req.params.id && p.organizador === req.userId);
    if (!pelada) return res.status(404).json({ message: "Pelada not found" });
    
    const inscritos = peladaJogadores
      .filter(pj => pj.peladaId === req.params.id)
      .map(pj => {
        const player = players.find(p => p.id === pj.jogadorId);
        return { ...pj, jogador_nome: player?.nome, jogador_nivel: player?.nivel_estrelas };
      });
      
    res.json({ ...pelada, inscritos });
  });

  app.post("/api/peladas", authenticate, (req: any, res) => {
    const pelada = { 
      id: Date.now().toString(), 
      ...req.body, 
      organizador: req.userId,
      status: 'agendada'
    };
    peladas.push(pelada);
    res.json(pelada);
  });

  app.put("/api/peladas/:id", authenticate, (req: any, res) => {
    const index = peladas.findIndex(p => p.id === req.params.id && p.organizador === req.userId);
    if (index === -1) return res.status(404).json({ message: "Pelada not found" });
    peladas[index] = { ...peladas[index], ...req.body };
    res.json(peladas[index]);
  });

  app.get("/api/peladas/:id/times", authenticate, (req: any, res) => {
    const times = timePeladas.filter(t => t.peladaId === req.params.id);
    res.json(times.sort((a,b) => a.ordem - b.ordem).map(t => ({
      ...t,
      jogadores: timeJogadores
        .filter(tj => tj.timeId === t.id)
        .map(tj => {
          const p = players.find(player => player.id === tj.jogadorId);
          return { id: tj.id, jogador: tj.jogadorId, jogador_nome: p?.nome, jogador_nivel: p?.nivel_estrelas };
        })
    })));
  });

  app.post("/api/peladas/:id/sortear", authenticate, (req: any, res) => {
    const peladaId = req.params.id;
    const confirmed = peladaJogadores.filter(pj => pj.peladaId === peladaId && pj.presenca_confirmada);
    
    // Create 3 basic times for demo
    for (let i = 0; i < 3; i++) {
        const timeId = `t-${peladaId}-${i+1}`;
        if (!timePeladas.find(t => t.id === timeId)) {
            timePeladas.push({ id: timeId, peladaId, nome_time: `Time ${i + 1}`, ordem: i + 1 });
        }
        const start = i * 5;
        confirmed.slice(start, start + 5).forEach(pj => {
            if (!timeJogadores.find(tj => tj.timeId === timeId && tj.jogadorId === pj.jogadorId)) {
                timeJogadores.push({ id: `tj-${timeId}-${pj.jogadorId}`, timeId, jogadorId: pj.jogadorId });
            }
        });
    }
    res.json({ message: "Sorteio realizado" });
  });

  app.post("/api/peladas/:id/substituir", authenticate, (req: any, res) => {
    const { sai_id, entra_id } = req.body;
    const tjSai = timeJogadores.find(tj => tj.jogadorId === sai_id);
    if (!tjSai) return res.status(404).json({ message: "Player not in a team" });
    
    const teamId = tjSai.timeId;
    const idx = timeJogadores.findIndex(tj => tj.jogadorId === sai_id);
    timeJogadores.splice(idx, 1);

    const idxEntra = timeJogadores.findIndex(tj => tj.jogadorId === entra_id);
    if (idxEntra !== -1) timeJogadores.splice(idxEntra, 1);

    timeJogadores.push({ id: `tj-sub-${Date.now()}`, timeId: teamId, jogadorId: entra_id });
    res.json({ message: "Substituição realizada" });
  });

  app.post("/api/peladas/:id/rodar-times", authenticate, (req: any, res) => {
    const { time_id } = req.body;
    const time = timePeladas.find(t => t.id === time_id);
    if (time) {
      const maxOrdem = Math.max(...timePeladas.filter(t => t.peladaId === req.params.id).map(t => t.ordem), 0);
      time.ordem = maxOrdem + 1;
    }
    res.json({ message: "Rodagem concluída" });
  });

  // Pelada Jogadores actions
  app.post("/api/peladas/:id/jogadores", authenticate, (req: any, res) => {
    const { jogador_id } = req.body;
    const peladaId = req.params.id;
    
    const existing = peladaJogadores.find(pj => pj.peladaId === peladaId && pj.jogadorId === jogador_id);
    if (existing) return res.json(existing);

    const pj = {
      id: Date.now().toString(),
      peladaId,
      jogadorId: jogador_id,
      ordem_chegada: peladaJogadores.filter(pj => pj.peladaId === peladaId).length + 1,
      presenca_confirmada: true,
      pagamento_confirmado: false
    };
    peladaJogadores.push(pj);
    res.status(201).json(pj);
  });

  app.patch("/api/pelada-jogadores/:id/", authenticate, (req: any, res) => {
    const pj = peladaJogadores.find(p => p.id === req.params.id);
    if (pj) {
       Object.assign(pj, req.body);
       return res.json(pj);
    }
    res.status(404).send();
  });

  app.delete("/api/pelada-jogadores/:id/", authenticate, (req: any, res) => {
    const idx = peladaJogadores.findIndex(pj => pj.id === req.params.id);
    if (idx !== -1) peladaJogadores.splice(idx, 1);
    res.status(204).send();
  });

  // Championship Mock
  app.get("/api/campeonatos", authenticate, (req, res) => {
    res.json(championships);
  });
  app.post("/api/campeonatos", authenticate, (req: any, res) => {
    const c = { id: Date.now().toString(), ...req.body, status: 'rascunho', times: [], jogos: [] };
    championships.push(c);
    res.json(c);
  });
  app.get("/api/campeonatos/:id", authenticate, (req, res) => {
    const c = championships.find(c => c.id === req.params.id);
    res.json(c || { error: 'Not found' });
  });

  app.post("/api/campeonatos/:id/times/", authenticate, (req, res) => {
    const c = championships.find(c => c.id === req.params.id);
    if (c) {
      const team = { id: Date.now().toString(), nome: req.body.nome };
      c.times.push(team);
      res.status(201).json(team);
    } else {
      res.status(404).send();
    }
  });

  app.post("/api/campeonatos/:id/gerar_tabela", authenticate, (req, res) => {
    const c = championships.find(c => c.id === req.params.id);
    if (c && c.times.length >= 2) {
      c.jogos = [];
      // Simple round robin mock
      for (let i = 0; i < c.times.length; i++) {
        for (let j = i + 1; j < c.times.length; j++) {
          c.jogos.push({
            id: `g-${c.id}-${i}-${j}`,
            time_casa: c.times[i].id,
            time_casa_nome: c.times[i].nome,
            time_visitante: c.times[j].id,
            time_visitante_nome: c.times[j].nome,
            gols_casa: 0,
            gols_visitante: 0,
            status: 'agendado',
            data_hora: new Date(Date.now() + (c.jogos.length * 86400000))
          });
        }
      }
      c.status = 'ativo';
    }
    res.json({ message: 'Tabela gerada', jogos: c?.jogos });
  });

  app.get("/api/campeonatos/:id/classificacao", authenticate, (req, res) => {
    const c = championships.find(c => c.id === req.params.id);
    if (!c) return res.status(404).send();

    const standings: any = {};
    c.times.forEach((t: any) => {
      standings[t.id] = { id: t.id, nome: t.nome, pts: 0, pj: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0 };
    });

    c.jogos.filter((j: any) => j.status === 'realizado').forEach((j: any) => {
      const casa = standings[j.time_casa];
      const visi = standings[j.time_visitante];

      casa.pj++;visi.pj++;
      casa.gp += j.gols_casa; casa.gc += j.gols_visitante;
      visi.gp += j.gols_visitante; visi.gc += j.gols_casa;

      if (j.gols_casa > j.gols_visitante) {
        casa.pts += 3; casa.v++; visi.d++;
      } else if (j.gols_casa < j.gols_visitante) {
        visi.pts += 3; visi.v++; casa.d++;
      } else {
        casa.pts += 1; visi.pts += 1; casa.e++; visi.e++;
      }
      casa.sg = casa.gp - casa.gc;
      visi.sg = visi.gp - visi.gc;
    });

    const result = Object.values(standings).sort((a: any, b: any) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
    res.json(result);
  });

  app.get("/api/campeonatos/:id/artilharia", authenticate, (req, res) => {
    const c = championships.find(c => c.id === req.params.id);
    if (!c) return res.status(404).send();

    const goals: any = {};
    championshipEvents.filter(e => e.campeonatoId === req.params.id && e.tipo === 'gol').forEach(e => {
        if (!goals[e.jogadorId]) {
            const player = players.find(p => p.id === e.jogadorId);
            goals[e.jogadorId] = { id: e.jogadorId, nome: player?.nome || "Desconhecido", gols: 0 };
        }
        goals[e.jogadorId].gols++;
    });

    const result = Object.values(goals).sort((a: any, b: any) => b.gols - a.gols);
    res.json(result);
  });

  app.get("/api/campeonatos/:id/cartoes", authenticate, (req, res) => {
    const c = championships.find(c => c.id === req.params.id);
    if (!c) return res.status(404).send();

    const stats: any = {};
    championshipEvents.filter(e => e.campeonatoId === req.params.id && (e.tipo === 'cartao_amarelo' || e.tipo === 'cartao_vermelho')).forEach(e => {
        if (!stats[e.jogadorId]) {
            const player = players.find(p => p.id === e.jogadorId);
            stats[e.jogadorId] = { id: e.jogadorId, nome: player?.nome || "Desconhecido", amarelos: 0, vermelhos: 0, suspenso: false };
        }
        if (e.tipo === 'cartao_amarelo') stats[e.jogadorId].amarelos++;
        if (e.tipo === 'cartao_vermelho') stats[e.jogadorId].vermelhos++;
        
        if (stats[e.jogadorId].amarelos >= 2 || stats[e.jogadorId].vermelhos >= 1) {
            stats[e.jogadorId].suspenso = true;
        }
    });

    res.json(Object.values(stats));
  });

  app.post("/api/campeonatos/:id/jogos/:jogoId/registrar", authenticate, (req, res) => {
    const c = championships.find(c => c.id === req.params.id);
    if (!c) return res.status(404).send();

    const juego = c.jogos.find((j: any) => j.id === req.params.jogoId);
    if (!juego) return res.status(404).send();

    const { gols_casa, gols_visitante, eventos } = req.body;
    juego.gols_casa = gols_casa;
    juego.gols_visitante = gols_visitante;
    juego.status = 'realizado';

    eventos.forEach((e: any) => {
        championshipEvents.push({ ...e, campeonatoId: c.id, jogoId: juego.id });
    });

    res.json(juego);
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
