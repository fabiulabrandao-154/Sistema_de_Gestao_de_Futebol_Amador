const API_URL = window.location.origin + '/api';
let socket = null;
let currentUser = null;
let token = null;

const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
};

const api = {
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint);
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    },
};

const initSocket = () => {
    socket = io(window.location.origin);

    socket.on('connect', () => {
        console.log('Socket conectado');
    });

    socket.on('disconnect', () => {
        console.log('Socket desconectado');
    });
};

const login = (user, authToken) => {
    currentUser = user;
    token = authToken;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', authToken);

    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-container').style.display = 'flex';

    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();

    if (!socket) {
        initSocket();
    }

    navigateTo('dashboard');
};

const logout = () => {
    currentUser = null;
    token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('main-container').style.display = 'none';

    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await api.post('/auth/login', { email, password });
        login(data.user, data.token);
        showToast('Login realizado com sucesso!');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    if (password.length < 7) {
        showToast('A senha deve ter no mínimo 7 caracteres', 'error');
        return;
    }

    if (password !== confirm) {
        showToast('As senhas não coincidem', 'error');
        return;
    }

    try {
        const data = await api.post('/auth/register', { name, email, password });
        login(data.user, data.token);
        showToast('Cadastro realizado com sucesso!');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});

document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    showToast('Logout realizado com sucesso!');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        navigateTo(page);

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

const navigateTo = (page) => {
    const content = document.getElementById('page-content');

    switch (page) {
        case 'dashboard':
            renderDashboard(content);
            break;
        case 'players':
            renderPlayers(content);
            break;
        case 'matches':
            renderMatches(content);
            break;
        case 'profile':
            renderProfile(content);
            break;
        default:
            content.innerHTML = '<h1>Página não encontrada</h1>';
    }
};

const renderDashboard = async (container) => {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Bem-vindo, ${currentUser.name}!</h1>
            <p class="page-description">Aqui está o resumo da sua gestão.</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue">👥</div>
                <div class="stat-info">
                    <div class="stat-label">Total de Jogadores</div>
                    <div class="stat-value" id="total-players">0</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">🏆</div>
                <div class="stat-info">
                    <div class="stat-label">Peladas Realizadas</div>
                    <div class="stat-value" id="total-matches">0</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">📅</div>
                <div class="stat-info">
                    <div class="stat-label">Próxima Pelada</div>
                    <div class="stat-value" style="font-size: 1rem;" id="next-match">Nenhuma</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">⭐</div>
                <div class="stat-info">
                    <div class="stat-label">Média de Nível</div>
                    <div class="stat-value" id="avg-level">0.0</div>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Ações Rápidas</h2>
            </div>
            <div class="flex gap-4">
                <button class="btn btn-primary" onclick="navigateTo('players')">Gerenciar Jogadores</button>
                <button class="btn btn-success" onclick="navigateTo('matches')">Agendar Pelada</button>
            </div>
        </div>
    `;

    try {
        const [players, matches] = await Promise.all([
            api.get('/players'),
            api.get('/matches')
        ]);

        document.getElementById('total-players').textContent = players.length;

        const completedMatches = matches.filter(m => m.status === 'encerrada');
        document.getElementById('total-matches').textContent = completedMatches.length;

        const avgLevel = players.length
            ? (players.reduce((acc, p) => acc + p.level, 0) / players.length).toFixed(1)
            : '0.0';
        document.getElementById('avg-level').textContent = avgLevel;

        const nextMatch = matches
            .filter(m => m.status === 'agendada')
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

        if (nextMatch) {
            const date = new Date(nextMatch.date).toLocaleDateString('pt-BR');
            document.getElementById('next-match').textContent = `${date} ${nextMatch.time}`;
        }
    } catch (error) {
        showToast('Erro ao carregar estatísticas', 'error');
    }
};

const renderPlayers = async (container) => {
    container.innerHTML = `
        <div class="page-header flex justify-between items-center">
            <div>
                <h1 class="page-title">Meus Jogadores</h1>
                <p class="page-description">Gerencie a lista de atletas e seus níveis.</p>
            </div>
            <button class="btn btn-primary" onclick="openAddPlayerModal()">
                ➕ Novo Jogador
            </button>
        </div>
        <div class="card">
            <table class="table">
                <thead>
                    <tr>
                        <th>Jogador</th>
                        <th>Nível</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="players-table-body">
                    <tr><td colspan="4" style="text-align: center;">Carregando...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    loadPlayers();
};

let currentPlayers = [];

const loadPlayers = async () => {
    try {
        currentPlayers = await api.get('/players');
        const tbody = document.getElementById('players-table-body');

        if (currentPlayers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum jogador cadastrado.</td></tr>';
            return;
        }

        tbody.innerHTML = currentPlayers.map(player => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">
                            ${player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600;">${player.name}</div>
                            <div class="text-xs text-gray-500">Cadastrado em ${new Date(player.createdAt).toLocaleDateString('pt-BR')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-yellow">⭐ ${player.level.toFixed(1)}</span>
                </td>
                <td>
                    <span class="badge ${player.active ? 'badge-green' : 'badge-red'}">
                        ${player.active ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-icon" onclick="editPlayer('${player.id}')" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="togglePlayerStatus('${player.id}')" title="${player.active ? 'Desativar' : 'Ativar'}">
                            ${player.active ? '❌' : '✅'}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Erro ao carregar jogadores', 'error');
    }
};

window.openAddPlayerModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'player-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Novo Jogador</h2>
                <button class="btn-icon" onclick="closeModal('player-modal')">✖️</button>
            </div>
            <div class="modal-body">
                <form id="add-player-form">
                    <div class="input-group">
                        <label>Nome do Jogador</label>
                        <input type="text" id="player-name" required placeholder="Ex: João Silva">
                    </div>
                    <div class="input-group">
                        <label>Nível de Estrelas</label>
                        <div class="grid grid-cols-3" style="gap: 0.5rem;">
                            ${[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map(val => `
                                <button type="button" class="btn btn-outline star-btn" data-value="${val}">
                                    ${val.toFixed(1)} ⭐
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="player-level" value="3.0">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="closeModal('player-modal')">Cancelar</button>
                <button class="btn btn-primary" onclick="savePlayer()">Salvar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.star-btn').forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-outline');
            });
            this.classList.remove('btn-outline');
            this.classList.add('btn-primary');
            document.getElementById('player-level').value = this.getAttribute('data-value');
        });
    });

    document.querySelector('.star-btn[data-value="3.0"]').click();
};

window.savePlayer = async () => {
    const name = document.getElementById('player-name').value;
    const level = parseFloat(document.getElementById('player-level').value);

    if (!name) {
        showToast('Preencha o nome do jogador', 'error');
        return;
    }

    try {
        await api.post('/players', {
            name,
            level,
            active: true,
            createdAt: new Date().toISOString()
        });
        showToast('Jogador cadastrado com sucesso!');
        closeModal('player-modal');
        loadPlayers();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

window.togglePlayerStatus = async (playerId) => {
    const player = currentPlayers.find(p => p.id === playerId);
    if (!player) return;

    try {
        await api.put(`/players/${playerId}`, { active: !player.active });
        showToast('Status atualizado!');
        loadPlayers();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
};

const renderMatches = async (container) => {
    container.innerHTML = `
        <div class="page-header flex justify-between items-center">
            <div>
                <h1 class="page-title">Minhas Peladas</h1>
                <p class="page-description">Organize seus jogos e listas de presença.</p>
            </div>
            <button class="btn btn-primary" onclick="openAddMatchModal()">
                ➕ Nova Pelada
            </button>
        </div>
        <div id="matches-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            <div style="text-align: center; padding: 2rem;">Carregando...</div>
        </div>
    `;

    loadMatches();
};

let currentMatches = [];

const loadMatches = async () => {
    try {
        currentMatches = await api.get('/matches');
        const grid = document.getElementById('matches-grid');

        if (currentMatches.length === 0) {
            grid.innerHTML = `
                <div class="card" style="text-align: center; padding: 3rem;">
                    <p class="text-gray-500">Você ainda não agendou nenhuma pelada.</p>
                    <button class="btn btn-primary mt-4" onclick="openAddMatchModal()">Agendar primeira pelada</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = currentMatches.map(match => `
            <div class="card" style="cursor: pointer; transition: all 0.2s;" onclick="viewMatchDetail('${match.id}')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <span class="badge ${
                        match.status === 'agendada' ? 'badge-blue' :
                        match.status === 'em_andamento' ? 'badge-green' : 'badge-gray'
                    }">
                        ${match.status === 'agendada' ? 'Agendada' : match.status === 'em_andamento' ? 'Em andamento' : 'Encerrada'}
                    </span>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #2563eb;">
                    ${match.title}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem; color: #6b7280;">
                    <div>📅 ${new Date(match.date).toLocaleDateString('pt-BR')} às ${match.time}</div>
                    <div>📍 ${match.location}</div>
                    <div>👥 ${match.playersPerTeam} vs ${match.playersPerTeam}</div>
                    <div>⏱️ ${match.duration} minutos</div>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                    <span class="text-blue-600 font-bold text-sm">Ver detalhes e lista →</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast('Erro ao carregar peladas', 'error');
    }
};

window.openAddMatchModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'match-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Agendar Nova Pelada</h2>
                <button class="btn-icon" onclick="closeModal('match-modal')">✖️</button>
            </div>
            <div class="modal-body">
                <form id="add-match-form">
                    <div class="input-group">
                        <label>Título da Pelada</label>
                        <input type="text" id="match-title" required placeholder="Ex: Pelada de Segunda">
                    </div>
                    <div class="grid grid-cols-2">
                        <div class="input-group">
                            <label>Data</label>
                            <input type="date" id="match-date" required>
                        </div>
                        <div class="input-group">
                            <label>Horário</label>
                            <input type="time" id="match-time" required>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Local</label>
                        <input type="text" id="match-location" required placeholder="Ex: Arena Central">
                    </div>
                    <div class="grid grid-cols-3">
                        <div class="input-group">
                            <label>Duração (min)</label>
                            <input type="number" id="match-duration" value="60" required>
                        </div>
                        <div class="input-group">
                            <label>Jogadores/Time</label>
                            <input type="number" id="match-players" value="5" required>
                        </div>
                        <div class="input-group">
                            <label>Times Simult.</label>
                            <input type="number" id="match-teams" value="2" required>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="closeModal('match-modal')">Cancelar</button>
                <button class="btn btn-primary" onclick="saveMatch()">Agendar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.saveMatch = async () => {
    const title = document.getElementById('match-title').value;
    const date = document.getElementById('match-date').value;
    const time = document.getElementById('match-time').value;
    const location = document.getElementById('match-location').value;
    const duration = parseInt(document.getElementById('match-duration').value);
    const playersPerTeam = parseInt(document.getElementById('match-players').value);
    const simultaneousTeams = parseInt(document.getElementById('match-teams').value);

    if (!title || !date || !time || !location) {
        showToast('Preencha todos os campos', 'error');
        return;
    }

    try {
        await api.post('/matches', {
            title,
            date,
            time,
            location,
            duration,
            playersPerTeam,
            simultaneousTeams,
            createdAt: new Date().toISOString()
        });
        showToast('Pelada agendada com sucesso!');
        closeModal('match-modal');
        loadMatches();
    } catch (error) {
        showToast(error.message, 'error');
    }
};

window.viewMatchDetail = (matchId) => {
    window.currentMatchId = matchId;
    navigateTo('match-detail');
};

const renderProfile = async (container) => {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Meu Perfil</h1>
            <p class="page-description">Gerencie suas informações de organizador.</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
            <div class="card" style="text-align: center;">
                <div style="width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2.5rem; font-weight: 700; margin: 0 auto 1rem;">
                    ${currentUser.name.charAt(0).toUpperCase()}
                </div>
                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem;">${currentUser.name}</h2>
                <p class="text-sm text-gray-500">${currentUser.email}</p>
            </div>
            <div class="card">
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem;">Informações Pessoais</h3>
                <form id="profile-form">
                    <div class="grid grid-cols-2">
                        <div class="input-group">
                            <label>Nome</label>
                            <input type="text" id="profile-name" value="${currentUser.name}" required>
                        </div>
                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" id="profile-email" value="${currentUser.email}" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('profile-name').value;
        const email = document.getElementById('profile-email').value;

        try {
            const updatedUser = await api.put('/auth/profile', { name, email });
            currentUser = { ...currentUser, ...updatedUser };
            localStorage.setItem('user', JSON.stringify(currentUser));
            document.getElementById('user-name').textContent = name;
            document.getElementById('user-email').textContent = email;
            showToast('Perfil atualizado com sucesso!');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
};

window.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
        currentUser = JSON.parse(storedUser);
        token = storedToken;

        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-container').style.display = 'flex';

        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-email').textContent = currentUser.email;
        document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

        initSocket();
        navigateTo('dashboard');
    }
});
