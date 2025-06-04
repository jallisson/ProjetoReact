// server/config/env-loader.js
// Carregador de ambiente robusto que força o carregamento correto

const fs = require('fs');
const path = require('path');

class EnvLoader {
  constructor() {
    this.loaded = false;
    this.config = {};
  }

  // Força o carregamento limpo das variáveis
  forceLoad() {
    if (this.loaded) {
      return this.config;
    }

    console.log('🔄 Carregando configurações de ambiente...');

    // 1. Limpar variáveis de ambiente relacionadas ao DB
    this.clearDbEnvVars();

    // 2. Encontrar e ler o arquivo .env correto
    const envPath = this.findEnvFile();
    
    if (!envPath) {
      console.error('❌ Arquivo .env não encontrado!');
      return this.getDefaultConfig();
    }

    // 3. Carregar e parsear o arquivo .env manualmente
    this.config = this.parseEnvFile(envPath);

    // 4. Definir as variáveis no process.env (sobrescrevendo qualquer cache)
    this.setProcessEnv(this.config);

    // 5. Validar configuração
    this.validateConfig();

    this.loaded = true;
    return this.config;
  }

  // Limpa variáveis de ambiente relacionadas ao banco
  clearDbEnvVars() {
    const dbVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 'PORT'];
    dbVars.forEach(varName => {
      delete process.env[varName];
    });
    console.log('🧹 Variáveis de ambiente DB limpas');
  }

  // Encontra o arquivo .env correto
  findEnvFile() {
    const possiblePaths = [
      path.join(__dirname, '..', '.env'),           // server/.env
      path.join(__dirname, '..', '..', '.env'),     // projeto/.env
      path.join(process.cwd(), '.env'),             // current directory
      path.join(process.cwd(), 'server', '.env')    // current/server/.env
    ];

    console.log('🔍 Procurando arquivo .env em:');
    
    for (const envPath of possiblePaths) {
      console.log(`   Tentando: ${envPath}`);
      
      if (fs.existsSync(envPath)) {
        console.log(`✅ Arquivo .env encontrado: ${envPath}`);
        return envPath;
      }
    }

    return null;
  }

  // Parse manual do arquivo .env (mais confiável que dotenv)
  parseEnvFile(envPath) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const config = {};

      console.log('📄 Conteúdo do arquivo .env:');
      
      content.split('\n').forEach((line, index) => {
        line = line.trim();
        
        // Ignorar linhas vazias e comentários
        if (!line || line.startsWith('#')) {
          if (line.startsWith('#')) {
            console.log(`   ${index + 1}: ${line} (comentário)`);
          }
          return;
        }

        // Parse da linha KEY=VALUE
        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) {
          console.log(`   ${index + 1}: ${line} (formato inválido)`);
          return;
        }

        const key = line.substring(0, equalIndex).trim();
        const value = line.substring(equalIndex + 1).trim();

        // Remover aspas se existirem
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        config[key] = cleanValue;
        console.log(`   ${index + 1}: ${key}=${key.includes('PASSWORD') ? '*'.repeat(cleanValue.length) : cleanValue} ✅`);
      });

      return config;
    } catch (error) {
      console.error(`❌ Erro ao ler arquivo .env: ${error.message}`);
      return this.getDefaultConfig();
    }
  }

  // Define as variáveis no process.env
  setProcessEnv(config) {
    Object.keys(config).forEach(key => {
      process.env[key] = config[key];
      console.log(`🔧 ${key} definido no process.env`);
    });
  }

  // Configuração padrão como fallback
  getDefaultConfig() {
    console.log('⚠️  Usando configuração padrão (localhost)');
    return {
      DB_HOST: 'localhost',
      DB_USER: 'root',
      DB_PASSWORD: '',
      DB_NAME: 'gerenciamento_produtos',
      DB_PORT: '3306',
      PORT: '5000'
    };
  }

  // Valida se a configuração está completa
  validateConfig() {
    const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PORT'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error(`❌ Variáveis obrigatórias ausentes: ${missing.join(', ')}`);
      throw new Error(`Configuração incompleta: ${missing.join(', ')}`);
    }

    console.log('✅ Configuração validada com sucesso');
    console.log('📊 Configuração final:');
    console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Password: ${process.env.DB_PASSWORD ? '*'.repeat(process.env.DB_PASSWORD.length) : 'VAZIO'}`);
  }

  // Método para recarregar configuração (útil para desenvolvimento)
  reload() {
    this.loaded = false;
    this.config = {};
    return this.forceLoad();
  }

  // Getter para a configuração atual
  getConfig() {
    if (!this.loaded) {
      return this.forceLoad();
    }
    return this.config;
  }

  // Método para testar conectividade básica
  async testConnectivity() {
    const net = require('net');
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT) || 3306;

    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 5000;

      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        console.log(`✅ Conectividade TCP para ${host}:${port} OK`);
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        console.log(`⏰ Timeout ao conectar em ${host}:${port}`);
        socket.destroy();
        resolve(false);
      });

      socket.on('error', (error) => {
        console.log(`❌ Erro de conectividade para ${host}:${port}: ${error.message}`);
        resolve(false);
      });

      console.log(`🔌 Testando conectividade TCP para ${host}:${port}...`);
      socket.connect(port, host);
    });
  }
}

// Instância singleton
const envLoader = new EnvLoader();

// Carregar imediatamente
envLoader.forceLoad();

module.exports = envLoader;