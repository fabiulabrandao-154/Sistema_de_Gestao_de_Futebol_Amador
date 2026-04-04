# ⚽ FutGestão - Sistema de Gerenciamento de Peladas

Sistema completo para organização e gestão de peladas de futebol, desenvolvido com arquitetura frontend/backend separados.

## 👥 Equipe de Desenvolvimento

### Frontend
- **Fabíula de Araujo Brandão** - Desenvolvedor Frontend
  - Responsável por: Interface HTML/CSS/JS, experiência do usuário, design responsivo

### Backend
- **Laura Carolina** - Desenvolvedor Backend Lead
  - Responsável por: Arquitetura do servidor, APIs REST, autenticação JWT

- **Vinícius Abreu Vasconcelos dos Santos** - Desenvolvedor Backend
  - Responsável por: Socket.IO, gerenciamento de dados, lógica de negócios

---

## 📋 Sobre o Projeto

O FutGestão é uma solução moderna e completa para organizadores de peladas que precisam:
- Cadastrar e gerenciar jogadores com níveis de habilidade
- Agendar e organizar partidas
- Controlar listas de presença em tempo real
- Confirmar participação e pagamentos
- Visualizar estatísticas e histórico

### 🎨 Características Principais

✅ **Frontend Puro** - HTML5, CSS3 e JavaScript vanilla (sem frameworks)
✅ **Backend Express** - API REST robusta com autenticação JWT
✅ **Socket.IO** - Atualizações em tempo real nas listas de jogadores
✅ **LocalStorage** - Persistência de dados local (desenvolvimento)
✅ **Design Responsivo** - Interface adaptável para desktop e mobile
✅ **Autenticação Segura** - Sistema de login com bcrypt e JWT

---

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm (geralmente vem com Node.js)

### Passo 1: Clone ou baixe o projeto

```bash
# Se estiver usando git
git clone <url-do-repositorio>
cd futgestao

# Ou baixe e extraia o arquivo ZIP
```

### Passo 2: Instale as dependências do Backend

```bash
cd backend
npm install
```

### Passo 3: Inicie o servidor

```bash
npm start
```

O servidor será iniciado na porta **3000** e você verá:

```
╔═══════════════════════════════════════════════════════╗
║           🎯 FutGestão Backend Iniciado               ║
╠═══════════════════════════════════════════════════════╣
║  Servidor rodando em: http://localhost:3000           ║
║  Status: ✅ Operacional                               ║
║  Socket.IO: ✅ Ativo                                  ║
╚═══════════════════════════════════════════════════════╝
```

### Passo 4: Acesse o sistema

Abra seu navegador e acesse:

```
http://localhost:3000
```

**Pronto!** O sistema está funcionando. 🎉

---

## 📁 Estrutura do Projeto

```
futgestao/
│
├── backend/                 # Servidor Node.js
│   ├── server.js           # Servidor Express + Socket.IO
│   ├── package.json        # Dependências do backend
│   └── node_modules/       # Módulos instalados (gerado após npm install)
│
├── frontend/               # Cliente Web
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos CSS
│   └── app.js             # Lógica JavaScript
│
└── README.md              # Este arquivo
```

---

## 🔧 Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| Node.js | 16+ | Runtime JavaScript |
| Express | 4.21.2 | Framework web |
| Socket.IO | 4.8.3 | Comunicação em tempo real |
| JWT | 9.0.3 | Autenticação segura |
| Bcrypt | 3.0.3 | Criptografia de senhas |
| CORS | 2.8.6 | Controle de acesso |

### Frontend
| Tecnologia | Função |
|-----------|--------|
| HTML5 | Estrutura |
| CSS3 | Estilização |
| JavaScript | Lógica de interface |
| Socket.IO Client | Conexão websocket |
| Fetch API | Requisições HTTP |

---

## 🎮 Como Usar o Sistema

### 1️⃣ Primeiro Acesso

1. Ao acessar `http://localhost:3000`, você verá a tela de login
2. Clique em **"Cadastre-se"** para criar sua conta
3. Preencha: Nome, Email, Senha (mínimo 7 caracteres)
4. Clique em **"Cadastrar"**

### 2️⃣ Gerenciar Jogadores

1. No menu lateral, clique em **"Jogadores"**
2. Clique no botão **"➕ Novo Jogador"**
3. Informe o nome e selecione o nível de estrelas (0.5 a 5.0)
4. Clique em **"Salvar"**
5. Você pode editar níveis ou ativar/desativar jogadores

### 3️⃣ Agendar Pelada

1. No menu lateral, clique em **"Peladas"**
2. Clique no botão **"➕ Nova Pelada"**
3. Preencha os dados:
   - Título (ex: "Pelada de Sexta")
   - Data e horário
   - Local
   - Duração em minutos
   - Número de jogadores por time
   - Quantidade de times simultâneos
4. Clique em **"Agendar"**

### 4️⃣ Gerenciar Lista de Presença

1. Na tela de **"Peladas"**, clique em uma pelada
2. Você verá os detalhes e a lista de inscritos
3. Clique em **"Adicionar Jogador"** para incluir participantes
4. Use os botões para:
   - ✅ Confirmar presença
   - ⬆️⬇️ Reordenar lista
   - ❌ Remover da lista
5. Quando houver jogadores suficientes, clique em **"▶️ Iniciar Pelada"**

### 5️⃣ Dashboard

O Dashboard mostra:
- Total de jogadores cadastrados
- Número de peladas realizadas
- Próxima pelada agendada
- Média de nível dos jogadores

### 6️⃣ Perfil

No menu **"Perfil"** você pode:
- Editar seu nome e email
- Ver informações da conta

---

## 🌐 Endpoints da API

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Cadastrar novo usuário |
| POST | `/api/auth/login` | Fazer login |
| PUT | `/api/auth/profile` | Atualizar perfil |
| PUT | `/api/auth/password` | Alterar senha |

### Jogadores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/players` | Listar jogadores |
| POST | `/api/players` | Criar jogador |
| PUT | `/api/players/:id` | Atualizar jogador |

### Peladas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/matches` | Listar peladas |
| GET | `/api/matches/:id` | Obter detalhes |
| POST | `/api/matches` | Criar pelada |
| PUT | `/api/matches/:id` | Atualizar pelada |
| GET | `/api/matches/:id/players` | Listar inscritos |
| POST | `/api/matches/:id/players` | Adicionar jogador |
| PUT | `/api/matches/:id/players` | Atualizar lista |

### Socket.IO Events

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `join-match` | Cliente → Servidor | Entrar em sala da pelada |
| `update-list` | Cliente → Servidor | Notificar mudança na lista |
| `list-updated` | Servidor → Cliente | Lista foi atualizada |

---

## 🔒 Segurança

### Autenticação JWT
- Todas as rotas protegidas requerem token JWT
- Token é enviado no header `Authorization: Bearer <token>`
- Expira após período configurado

### Senhas
- Criptografadas com bcrypt (10 rounds)
- Mínimo de 7 caracteres
- Nunca armazenadas em texto puro

### CORS
- Configurado para aceitar requisições do frontend
- Pode ser restrito em produção

---

## 🐛 Troubleshooting

### Porta 3000 já está em uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Erro ao instalar dependências

```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Frontend não carrega

- Verifique se o servidor está rodando
- Limpe o cache do navegador (Ctrl + Shift + Delete)
- Verifique o console do navegador (F12) para erros

### Socket.IO não conecta

- Verifique se o servidor está acessível
- Confirme que a porta 3000 não está bloqueada
- Veja os logs do servidor no terminal

---

## 📦 Build para Produção

### Backend

Para produção, considere:

1. Usar banco de dados real (MongoDB, PostgreSQL, etc.)
2. Configurar variáveis de ambiente
3. Usar PM2 para gerenciar o processo
4. Configurar HTTPS
5. Implementar rate limiting

```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
cd backend
pm2 start server.js --name futgestao

# Ver logs
pm2 logs futgestao

# Reiniciar
pm2 restart futgestao
```

### Frontend

Para deploy:

1. Hospede os arquivos HTML/CSS/JS em servidor web
2. Configure CORS no backend para aceitar o domínio
3. Use CDN para assets estáticos
4. Minifique CSS e JS

---

## 🔄 Próximas Funcionalidades

- [ ] Integração com banco de dados real (PostgreSQL/MongoDB)
- [ ] Sistema de pagamento
- [ ] Geração automática de times balanceados
- [ ] Notificações por email/SMS
- [ ] Estatísticas avançadas por jogador
- [ ] Modo escuro
- [ ] PWA (Progressive Web App)
- [ ] Chat em tempo real
- [ ] Histórico de confrontos

---

## 📄 Licença

Este projeto é de uso educacional e pode ser modificado e distribuído livremente.

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a seção de Troubleshooting acima
2. Revise os logs do servidor no terminal
3. Inspecione o console do navegador (F12)
4. Entre em contato com a equipe de desenvolvimento

---

## 🎓 Aprendizados do Projeto

Este projeto demonstra:

- ✅ Arquitetura cliente-servidor separada
- ✅ API RESTful bem estruturada
- ✅ Autenticação e autorização
- ✅ Comunicação em tempo real com WebSockets
- ✅ Frontend responsivo sem frameworks
- ✅ Boas práticas de organização de código
- ✅ Manipulação de estado no cliente
- ✅ Integração frontend-backend

---

**Desenvolvido com ❤️ pela Equipe FutGestão**

*Versão 1.0.0 - Abril 2026*
