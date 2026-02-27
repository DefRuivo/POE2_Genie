
# POE2 Genie ⚔️
**Planeje builds melhores para sua party no hideout.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blueviolet)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5-orange)

**POE2 Genie** é um assistente inteligente para Path of Exile, criado para planejar builds melhores. Ele combina party do hideout, controle de stash, build items e um estrategista IA para transformar seus recursos em builds personalizadas e práticas.

---

## ✨ Funcionalidades

### 🧠 Estrategista IA de Builds
*   **Craft Inteligente**: Cria builds práticas com base no que você *realmente* tem no stash.
*   **Foco na Party**: Respeita restrições da party, archetypes e tempo de setup.
*   **Modo Theorycrafter**: Suporte a planejamento avançado e técnico de builds.
*   **Tradução Global**: Traduza instantaneamente qualquer build para seu idioma (Português/Inglês).

### 🏠 Hideouts Conectados
*   **Sincronia da Party**: Convide amigos para o hideout e compartilhe o contexto.
*   **Gestão Compartilhada**: Todos veem o mesmo stash e Build Items em tempo real.
*   **Controle de Acesso**: Gerencie permissões com funções de Party Leader e Party Member.

### 🛒 Fluxo de Build Items
*   **Fluxo Contínuo**: Adicione gear/gems faltantes das builds direto em Build Items.
*   **Organização Esperta**: Filtre itens manuais ou vinculados a builds.
*   **Compartilhamento Fácil**: Copie a lista filtrada para compartilhar no WhatsApp.

### 📦 Controle de Stash
*   **Inventário na Mão**: Mantenha visibilidade completa do que já existe no stash.
*   **Sugestões Inteligentes**: A IA prioriza o que você já possui antes de sugerir novos itens.

---

## 🛠️ Stack Tecnológica

Construído com tecnologias web modernas para performance e escala:

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
*   **Banco de Dados**: [MariaDB](https://mariadb.org/) & [Prisma ORM](https://www.prisma.io/)
*   **Motor de IA**: [Google Gemini 1.5](https://deepmind.google/technologies/gemini/) (Pro & Flash)
*   **Estilização**: [TailwindCSS](https://tailwindcss.com/)
*   **Autenticação**: JWT próprio com fluxo seguro de recuperação de senha.
*   **Infraestrutura**: Pronto para Docker & Docker Compose.

---

## 🚀 Como Começar (Getting Started)

### Pré-requisitos
*   Node.js 18+
*   Docker & Docker Compose (para o banco de dados)
*   Chave de API do Google Gemini

### Início Rápido (Desenvolvimento)

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/DefRuivo/POE2_Genie.git
    cd POE2_Genie
    ```

2.  **Configure o ambiente**:
    ```bash
    cp .env.example .env
    # Edite o .env com sua GEMINI_API_KEY e credenciais do banco
    ```

3.  **Inicie o banco de dados**:
    ```bash
    docker compose up -d
    ```

4.  **Instale dependências e envie o schema**:
    ```bash
    pnpm install
    pnpm db:push
    ```

5.  **Rode a aplicação**:
    ```bash
    pnpm dev
    ```

Acesse `http://localhost:3000` e comece a craftar builds.

---

## 🤝 Contribuição

Contribuições são bem-vindas. Seja corrigindo um bug ou adicionando uma nova funcionalidade de planejamento de builds, sinta-se à vontade para abrir um Pull Request.

## 📄 Licença

Este projeto é open source e está disponível sob a [Licença MIT](LICENSE).
