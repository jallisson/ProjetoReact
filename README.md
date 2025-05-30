# 🛍️ Sistema de Gerenciamento de Produtos

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</div>

<div align="center">
  <h3>✨ Sistema moderno e responsivo para gerenciamento completo de produtos ✨</h3>
  <p>Interface intuitiva • Edição em tempo real • Busca inteligente • Performance otimizada</p>
</div>

---

## 🎯 **Sobre o Projeto**

O Sistema de Gerenciamento de Produtos é uma aplicação web completa e moderna, desenvolvida para facilitar o controle de estoque e preços em múltiplas lojas. Com uma interface elegante e funcionalidades avançadas, oferece uma experiência fluida para gerenciar grandes volumes de produtos.

### 🌟 **Principais Características**

- **Interface Moderna**: Design responsivo e intuitivo
- **Edição em Tempo Real**: Modificação direta nas células da tabela
- **Busca Inteligente**: Múltiplos filtros e modos de pesquisa
- **Performance Otimizada**: Scroll infinito e carregamento eficiente
- **Multi-loja**: Controle de estoque para até 15 pontos de venda
- **Navegação por Teclado**: Experiência similar a planilhas

---

## 🚀 **Funcionalidades**

### 📊 **Gerenciamento de Produtos**
- ✅ Visualização em tabela com 24 colunas de dados
- ✅ Edição inline com validação em tempo real
- ✅ Controle de estoque para 15 lojas simultaneamente
- ✅ Gestão de preços de venda e custos
- ✅ Status de produtos (Ativo/Inativo)

### 🔍 **Sistema de Busca Avançado**
- ✅ Pesquisa por código, descrição, fornecedor
- ✅ Modo "Moto" para busca por conteúdo
- ✅ Filtros: igual, contém, maior ou igual, começa com
- ✅ Resultados em tempo real

### ⚡ **Performance e UX**
- ✅ Scroll infinito para grandes volumes de dados
- ✅ Navegação por setas do teclado
- ✅ Barra de status com produto selecionado
- ✅ Feedback visual para ações do usuário
- ✅ Carregamento otimizado e paginação

---

## 🛠️ **Stack Tecnológica**

### **Frontend**
- **React 18.2** - Framework principal
- **Vite 6.3** - Build tool e dev server
- **Axios** - Cliente HTTP
- **CSS3** - Estilização customizada

### **Backend**
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL2** - Driver de banco de dados
- **CORS** - Middleware para requisições cross-origin

### **Banco de Dados**
- **MySQL** - Sistema de gerenciamento de banco
- **Pool de Conexões** - Otimização de performance

---

## 📦 **Instalação e Configuração**

### **Pré-requisitos**
- Node.js (versão 16 ou superior)
- MySQL Server
- Git

### **1. Clone o Repositório**
```bash
git clone https://github.com/seu-usuario/sistema-gerenciamento-produtos.git
cd sistema-gerenciamento-produtos
```

### **2. Instale as Dependências**
```bash
# Dependências do frontend
npm install

# Dependências do backend
cd server
npm install
cd ..
```

### **3. Configure o Banco de Dados**
```sql
-- Crie o banco de dados
CREATE DATABASE seu_banco_de_dados;

-- Use a estrutura da tabela 'itens' conforme seu esquema atual
-- Certifique-se de que possui as colunas:
-- item_id, descricao, fornecedor_id, ativo,
-- estoque_pdv1-15, custo_venda, valor_venda1-4
```

### **4. Configure as Variáveis de Ambiente**
Crie um arquivo `.env` na pasta `server`:
```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=seu_banco_de_dados
DB_PORT=3306
PORT=5000
```

### **5. Execute o Projeto**
```bash
# Inicia frontend e backend simultaneamente
npm start

# Ou execute separadamente:
# Backend
npm run server

# Frontend
npm run dev
```

---

## 🎮 **Como Usar**

### **Navegação por Teclado**
- **Setas** ← → ↑ ↓: Navegar entre células
- **Enter**: Entrar em modo de edição
- **Escape**: Cancelar edição
- **Tab**: Próxima célula editável

### **Filtros de Busca**
| Filtro | Descrição | Modo Padrão |
|--------|-----------|-------------|
| 🔢 **Código** | Busca exata por ID | Igual a |
| 📝 **Descrição** | Busca alfabética | Maior ou igual |
| 🏢 **Fornecedor** | Busca por ID do fornecedor | Igual a |
| 🏍️ **Moto** | Busca por conteúdo | Contém |

### **Edição de Dados**
1. **Clique duplo** na célula para editar
2. **Digite** o novo valor
3. **Enter** ou **Tab** para salvar
4. **Escape** para cancelar

---

## 📱 **Design Responsivo**

O sistema foi desenvolvido com design responsivo, adaptando-se perfeitamente a:

- 💻 **Desktop**: Experiência completa com todas as funcionalidades
- 📱 **Tablet**: Layout otimizado para toque
- 📱 **Mobile**: Interface compacta e funcional

---

## 🏗️ **Estrutura do Projeto**

```
projeto01/
├── 📁 public/                 # Arquivos estáticos
├── 📁 server/                 # Backend Node.js
│   ├── 📁 config/            # Configurações de BD
│   ├── 📁 controllers/       # Controladores da API
│   ├── 📁 models/            # Modelos de dados
│   ├── 📁 routes/            # Rotas da API
│   └── 📄 server.js          # Servidor principal
├── 📁 src/                   # Frontend React
│   ├── 📁 components/        # Componentes React
│   ├── 📁 services/          # Serviços de API
│   ├── 📄 App.jsx            # Componente principal
│   └── 📄 main.jsx           # Ponto de entrada
├── 📄 package.json           # Dependências do projeto
├── 📄 vite.config.js         # Configuração do Vite
└── 📄 README.md              # Este arquivo
```

---

## 🔧 **Scripts Disponíveis**

```bash
npm run dev        # Inicia o servidor de desenvolvimento
npm run build      # Gera build de produção
npm run preview    # Visualiza build de produção
npm run server     # Inicia apenas o backend
npm start          # Inicia frontend + backend
npm run lint       # Executa verificações de código
```

---

## 🚀 **Deploy e Produção**

### **Frontend (Netlify/Vercel)**
```bash
npm run build
# Upload da pasta 'dist' para seu provedor
```

### **Backend (Heroku/Railway)**
```bash
# Configure as variáveis de ambiente
# Faça deploy da pasta 'server'
```

### **Banco de Dados**
- Recomendado: **PlanetScale**, **Railway** ou **AWS RDS**
- Configure as variáveis de ambiente conforme seu provedor

---

## 🤝 **Contribuindo**

Contribuições são sempre bem-vindas! Para contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add: AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

---

## 📋 **Roadmap**

- [ ] 🔐 Sistema de autenticação
- [ ] 📊 Dashboard com gráficos
- [ ] 📤 Exportação para Excel/PDF
- [ ] 🔄 Sincronização em tempo real
- [ ] 📱 App mobile nativo
- [ ] 🎨 Temas personalizáveis

---

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 **Autor**

Desenvolvido com ❤️ por **[JALLISSON JALLIS]**

<div align="center">
  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/jallisson-jallis-4b265b8b/)
</div>

---

<div align="center">
  <p>⭐ Não esqueça de dar uma estrela se este projeto te ajudou! ⭐</p>
  <p><strong>Sistema de Gerenciamento de Produtos</strong> - Transformando a gestão de estoque em uma experiência moderna e eficiente.</p>
</div>