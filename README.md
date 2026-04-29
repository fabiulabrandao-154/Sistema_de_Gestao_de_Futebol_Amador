# FutGestao - Sistema de Gerenciamento de Peladas

Sistema completo para organização e gestão de peladas de futebol, desenvolvido com React + TypeScript no frontend e Node.js + Express no backend, utilizando MongoDB como banco de dados.

## Deploy no Vercel

Acesse a aplicação: [https://sistema-de-gestao-de-futebol-amador.vercel.app](https://sistema-de-gestao-de-futebol-amador.vercel.app)

## Equipe de Desenvolvimento

### Frontend
- **Fabíula de Araújo Brandão** - Desenvolvedora Frontend
  - Responsável por: Interface React/TypeScript, experiência do usuário, design responsivo

### Backend
- **Laura Carolina** - Desenvolvedora Backend Lead
  - Responsável por: Arquitetura Node.js, APIs REST, autenticação JWT

- **Vinícius Abreu Vasconcelos dos Santos** - Desenvolvedor Backend
  - Responsável por: Modelos de dados, lógica de negócios, integração MongoDB

---

## Sobre o Projeto

O FutGestao é uma solução moderna e completa para organizadores de peladas que precisam:
- Cadastrar e gerenciar jogadores com níveis de habilidade
- Agendar e organizar partidas
- Controlar listas de presença em tempo real
- Confirmar participação e pagamentos
- Visualizar estatísticas e histórico
- Gerenciar times e campeonatos

### Características Principais

- **Frontend React** - React 19 + TypeScript + Tailwind CSS
- **Backend Node.js** - Express + MongoDB com autenticação JWT
- **Design Responsivo** - Interface adaptável para desktop e mobile
- **Autenticação Segura** - Sistema de login com JWT
- **Deploy Automático** - Configurado para Vercel
- **Banco MongoDB** - MongoDB Atlas para produção
- **Real-time** - Socket.IO para atualizações em tempo real

---

## Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| React | 19.0.0 | Framework JavaScript |
| TypeScript | 5.8.2 | Tipagem estática |
| Tailwind CSS | 4.1.14 | Framework CSS |
| React Router | 7.14.0 | Roteamento |
| Axios | 1.14.0 | Cliente HTTP |
| React Hot Toast | 2.6.0 | Notificações |
| Lucide React | 0.546.0 | Ícones |

### Backend
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.21.2 | Framework web |
| MongoDB | 7.2.0 | Banco de dados NoSQL |
| JWT | 9.0.3 | Autenticação |
| Socket.IO | 4.8.3 | Comunicação real-time |
| bcryptjs | 3.0.3 | Hash de senhas |
| CORS | 2.8.6 | Controle de CORS |

---

## Instalação e Execução Local

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no MongoDB Atlas (ou MongoDB local)

### Passo 1: Clone o projeto

```bash
git clone <url-do-repositorio>
cd futgestao
```

### Passo 2: Instale as dependências

```bash
npm install
```

### Passo 3: Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# MongoDB
MONGODB_URI=mongodb+srv://fabiulabrandao15_db_user:hGT5wxGilTYu6D9l@cluster0.cislst7.mongodb.net/
MONGODB_NAME=futgestao

# Django
SECRET_KEY=sk-django-futgestao-2026-a7b3c9d4e5f6g8h1i2j3k4l5m6n7o8p9
DEBUG=False

# JWT
JWT_SECRET=jwt-futgestao-2026-x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

### Passo 4: Inicie o servidor

```bash
npm run dev
```

O sistema estará rodando em `http://localhost:3000`

### Passo 5: Acesse o sistema

Abra seu navegador e acesse:

```
http://localhost:3000
```

---

## Estrutura do Projeto

```
futgestao/
|
+-- src/                    # Frontend React
|   +-- components/         # Componentes reutilizáveis
|   |   +-- Layout.tsx      # Layout principal
|   +-- pages/              # Páginas da aplicação
|   |   +-- Login.tsx       # Página de login
|   |   +-- Register.tsx    # Página de cadastro
|   |   +-- Dashboard.tsx   # Dashboard principal
|   |   +-- Players.tsx     # Gestão de jogadores
|   |   +-- Peladas.tsx     # Gestão de peladas
|   |   +-- PeladaDetail.tsx # Detalhes da pelada
|   |   +-- PeladaSorteio.tsx # Sorteio de times
|   |   +-- PeladaLive.tsx  # Jogo ao vivo
|   |   +-- PlayerProfile.tsx # Perfil do jogador
|   |   +-- Teams.tsx       # Gestão de times
|   |   +-- Championships.tsx # Campeonatos
|   |   +-- ChampionshipDetail.tsx # Detalhes do campeonato
|   |   +-- Profile.tsx     # Perfil do usuário
|   +-- context/            # Context API (Auth)
|   |   +-- AuthContext.tsx # Contexto de autenticação
|   +-- services/           # Serviços (API)
|   |   +-- api.ts          # Cliente HTTP
|   |   +-- socket.ts       # Socket.IO client
|   +-- lib/                # Utilitários
|       +-- utils.ts        # Funções utilitárias
|
+-- server.ts               # Servidor Express + Vite
+-- vercel.json             # Configuração Vercel
+-- package.json            # Dependências Node.js
+-- .env                    # Variáveis de ambiente
+-- README.md               # Este arquivo
```

---

## Deploy no Vercel

### Configuração Automática

O projeto está configurado para deploy automático no Vercel:

1. **Frontend**: Build estático com Vite
2. **Backend**: Serverless functions com Express
3. **Banco**: MongoDB Atlas

### Variáveis de Ambiente no Vercel

Configure no painel do Vercel:

```env
# MongoDB
MONGODB_URI=mongodb+srv://fabiulabrandao15_db_user:hGT5wxGilTYu6D9l@cluster0.cislst7.mongodb.net/
MONGODB_NAME=futgestao

# Django
SECRET_KEY=sk-django-futgestao-2026-a7b3c9d4e5f6g8h1i2j3k4l5m6n7o8p9
DEBUG=False

# JWT
JWT_SECRET=jwt-futgestao-2026-x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

### Deploy Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## Como Usar o Sistema

### 1. Primeiro Acesso

1. Acesse a aplicação
2. Clique em **"Cadastre-se"** para criar sua conta
3. Preencha: Nome, Email, Senha
4. Clique em **"Cadastrar"**

### 2. Gerenciar Jogadores

1. No menu lateral, clique em **"Meus Jogadores"**
2. Clique no botão **"Novo Jogador"**
3. Informe o nome e selecione o nível de estrelas (0.5 a 5.0)
4. Clique em **"Salvar Jogador"**

### 3. Agendar Pelada

1. No menu lateral, clique em **"Minhas Peladas"**
2. Clique no botão **"Nova Pelada"**
3. Preencha os dados:
   - Título (ex: "Pelada de Sexta")
   - Data e horário
   - Local
   - Jogadores por time
4. Clique em **"Criar Pelada"**

### 4. Gerenciar Lista de Presença

1. Na tela de **"Minhas Peladas"**, clique em uma pelada
2. Você verá os detalhes e a lista de inscritos
3. Clique em **"Adicionar à Lista"** para incluir participantes
4. Use os botões para:
   - Confirmar presença (clique no ícone de check)
   - Confirmar pagamento (clique no ícone de dólar)
   - Reordenar lista (setas para cima/baixo)
   - Remover da lista (ícone de lixeira)

### 5. Sorteio de Times

1. Na tela de detalhes da pelada, clique em **"Sorteio de Times"**
2. Escolha entre sorteio aleatório ou balanceado
3. Arraste jogadores entre times para ajustar
4. Clique em **"Confirmar Times"** para iniciar o jogo

### 6. Jogo ao Vivo

1. Após confirmar os times, você será redirecionado para a tela ao vivo
2. Controle o cronômetro e o placar
3. Registre eventos (gols, assistências, cartões)
4. Gire os times (próximos entram no lugar dos atuais)

### 7. Gerenciar Times

1. No menu lateral, clique em **"Gestão de Times"**
2. Clique em **"Novo Time"** para criar um time
3. Preencha nome e cidade
4. Gerencie seus times cadastrados

### 8. Campeonatos

1. No menu lateral, clique em **"Campeonatos"**
2. Crie um novo campeonato com formato e datas
3. Adicione times participantes
4. Gere a tabela de jogos automaticamente

### 9. Dashboard

O Dashboard mostra:
- Total de jogadores cadastrados
- Jogadores ativos
- Total de peladas
- Nível médio dos jogadores

---

## API Endpoints

### Base URL
- **Local**: `http://localhost:3000/api/`
- **Produção**: `https://futgestao.vercel.app/api/`

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/register` | Cadastrar novo usuário |
| POST | `/token` | Fazer login |
| GET | `/me` | Obter dados do usuário |

### Jogadores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/jogadores` | Listar jogadores |
| POST | `/jogadores` | Criar jogador |
| PUT | `/jogadores/{id}` | Atualizar jogador |
| DELETE | `/jogadores/{id}` | Desativar jogador |

### Peladas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/peladas` | Listar peladas |
| GET | `/peladas/{id}` | Obter detalhes |
| POST | `/peladas` | Criar pelada |
| PUT | `/peladas/{id}` | Atualizar pelada |
| POST | `/peladas/{id}/sortear` | Sortear times |
| GET | `/peladas/{id}/times` | Listar times da pelada |
| POST | `/peladas/{id}/encerrar` | Encerrar pelada |

### Gestão de Listas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/peladas/{id}/jogadores` | Adicionar jogador |
| DELETE | `/peladas/{id}/jogadores/{jogador_id}` | Remover jogador |
| PUT | `/peladas/{id}/jogadores/reordenar` | Reordenar lista |
| PUT | `/peladas/{id}/jogadores/confirmar-presenca` | Confirmar presença |
| PUT | `/peladas/{id}/jogadores/confirmar-pagamento` | Confirmar pagamento |
| PATCH | `/pelada-jogadores/{id}` | Atualizar inscrição (presença/pagamento) |
| DELETE | `/pelada-jogadores/{id}` | Remover inscrição |

### Times

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/times` | Listar times |
| POST | `/times` | Criar time |
| PUT | `/times/{id}` | Atualizar time |
| DELETE | `/times/{id}` | Excluir time |

### Campeonatos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/campeonatos` | Listar campeonatos |
| POST | `/campeonatos` | Criar campeonato |
| GET | `/campeonatos/{id}` | Detalhes do campeonato |
| POST | `/campeonatos/{id}/gerar_tabela` | Gerar tabela de jogos |

---

## Segurança

### Autenticação JWT
- Todas as rotas protegidas requerem token JWT
- Token é enviado no header `Authorization: Bearer <token>`
- Tokens têm expiração configurável

### Senhas
- Hash seguro com bcryptjs
- Validação de força de senha no frontend

### CORS
- Configurado para aceitar requisições do frontend
- Restrito em produção para domínios específicos

### MongoDB
- Conexão segura via MongoDB Atlas
- Validação de dados no servidor
- Fallback para armazenamento em memória em caso de falha

---

## Troubleshooting

### Erro de Conexão MongoDB

- Verifique se a URL do MongoDB está correta no .env
- Verifique se o IP está liberado no MongoDB Atlas
- Teste a conexão diretamente

### Erro de CORS

- Verifique se o CORS está configurado corretamente no server.ts
- Em desenvolvimento, deve aceitar localhost:3000

### Erro de Build no Vercel

- Verifique se todas as dependências estão no package.json
- Verifique se as variáveis de ambiente estão configuradas no Vercel
- Verifique os logs de build no painel do Vercel

### Frontend não conecta com API

- Verifique se a URL da API está correta em src/services/api.ts
- Em desenvolvimento: http://localhost:3000/api/
- Em produção: https://seu-dominio.vercel.app/api/

### Presença/Pagamento não marca

- Certifique-se de que o endpoint PATCH `/pelada-jogadores/{id}` está acessível
- Verifique o console do navegador para erros de rede
- O toggle de presença e pagamento usa o endpoint PATCH sem barra final

---

## Build para Produção

### Build Local

```bash
# Build otimizado
npm run build

# Preview local
npm run preview
```

### Verificação de Tipos

```bash
# Verificar tipos TypeScript
npm run lint
```

---

## Próximas Funcionalidades

- [ ] Sistema de notificações push
- [ ] Geração automática de times balanceados
- [ ] Integração com pagamento (PIX/Cartão)
- [ ] Chat em tempo real
- [ ] Estatísticas avançadas por jogador
- [ ] Modo escuro
- [ ] PWA (Progressive Web App)
- [ ] Exportação de relatórios
- [ ] Sistema de ranking
- [ ] Integração com calendário
- [ ] Histórico de partidas
- [ ] Sistema de pontuação

---

## Licença

Este projeto é de uso educacional e pode ser modificado e distribuído livremente.

---

## Suporte

Para dúvidas ou problemas:

1. Verifique a seção de Troubleshooting acima
2. Revise os logs do Vercel
3. Inspecione o console do navegador (F12)
4. Verifique a conexão com MongoDB Atlas
5. Entre em contato com a equipe de desenvolvimento

---

## Changelog

### v3.1.0 (Abril 2026)
- Correção do toggle de presença e pagamento na lista de inscritos
- Adição do endpoint de confirmação de pagamento no backend
- Correção de rotas com barra final inconsistente
- Atualização do README com documentação completa de endpoints
- Configuração das variáveis de ambiente para produção

### v3.0.0 (Abril 2026)
- Migração para Node.js + Express + MongoDB
- Implementação de Socket.IO para real-time
- Melhoria na arquitetura do backend
- Otimização para deploy no Vercel
- Correção de todos os bugs conhecidos
- Atualização das dependências

### v2.0.0 (Abril 2026)
- Sistema completo Django + React
- Autenticação JWT
- Gestão de peladas e jogadores

### v1.0.0 (Março 2026)
- Versão inicial do projeto

---

## Documentação Adicional

### Manual do Organizador
O organizador tem controle total sobre os jogadores e as partidas. Ele pode criar peladas, gerenciar a lista de inscritos, realizar sorteios e controlar o placar em tempo real.

### Manual do Visitante
Visitantes podem acessar links públicos de peladas para acompanhar o placar ao vivo e visualizar a artilharia e classificação do campeonato.

### Entregáveis Finais
- Campeonato completo funcionando
- Classificação e artilharia em tempo real
- Controle de cartões e suspensões
- Sistema publicado em produção
- Documentação completa

### Divisão de Tarefas Sugerida (Equipe de 4-5)
- **Dev 1**: Backend (APIs, modelos, autenticação, sorteio, estatísticas)
- **Dev 2**: Backend (WebSocket, tempo real, eventos, campeonato)
- **Dev 3**: Frontend (peladas, sorteio, lista de próximas, rateio)
- **Dev 4**: Frontend (jogo ao vivo, tempo real, campeonato, classificação)
- **Dev 5**: Testes, documentação, deploy, integração

### Checklist de Validação
- Cadastro de organizador e login funcionando?
- Cadastro de jogadores e criação de pelada funcionando?
- Sorteio balanceado e lista de próximas funcionando?
- Cronômetro sincronizado e registro de gols/cartões funcionando?
- Estatísticas, rateio e pagamentos funcionando?
- Campeonato e classificação funcionando?
