// server/config/env-loader-render.js
// Versão otimizada para Render que usa variáveis de ambiente do sistema

const fs = require('fs');
const path = require('path');

class RenderEnvLoader {
  constructor() {
    this.loaded = false;
    this.config = {};
  }

  forceLoad() {
    if (this.loaded) {
      return this.config;
    }

    console.log('🔄 Carregando configurações de ambiente...');
    console.log('🌍 Ambiente detectado:', process.env.NODE_ENV || 'development');
    console.log('🏠 Render Environment:', process.env.RENDER ? 'SIM' : 'NÃO');

    // No Render, usar variáveis de ambiente do sistema
    if (process.env.RENDER) {
      console.log('🚀 Executando no Render - usando variáveis de ambiente do sistema');
      this.config = this.loadFromSystemEnv();
    } else {
      // Desenvolvimento local - tentar carregar .env
      console.log('💻 Executando localmente - procurando arquivo .env');
      this.clearDbEnvVars();
      const envPath = this.findEnvFile();
      
      if (envPath) {
        this.config = this.parseEnvFile(envPath);
      } else {
        console.log('⚠️ Arquivo .env não encontrado, tentando variáveis de ambiente do sistema');
        this.config = this.loadFromSystemEnv();
      }
    }

    // Definir as variáveis no process.env
    this.setProcessEnv(this.config);

    // Validar configuração
    this.validateConfig();

    this.loaded = true;
    return this.config;
  }

  // Carregar do sistema de variáveis de ambiente (Render)
  loadFromSystemEnv() {
    const config = {
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_USER: process.env.DB_USER || 'root',
      DB_PASSWORD: process.env.DB_PASSWORD || '',
      DB_NAME: process.env.DB_NAME || 'gerenciamento_produtos',
      DB_PORT: process.env.DB_PORT || '3306',
      PORT: process.env.PORT || '5000'
    };

    console.log('📊 Variáveis de ambiente do sistema:');
    Object.keys(config).forEach(key => {
      const value = config[key];
      const displayValue = key.includes('PASSWORD') ? 
        (value ? '*'.repeat(value.length) : 'VAZIO') : 
        value;
      console.log(`   ${key}: ${displayValue} ${process.env[key] ? '✅' : '❌'}`);
    });

    return config;
  }

  // Limpar variáveis de ambiente relacionadas ao DB
  clearDbEnvVars() {
    const dbVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 'PORT'];
    dbVars.forEach(varName => {
      delete process.env[varName];
    });
    console.log('🧹 Variáveis de ambiente DB limpas');
  }

  // Encontra o arquivo .env correto (desenvolvimento)
  findEnvFile() {
    const possiblePaths = [
      path.join(__dirname, '..', '.env'),
      path.join(__dirname, '..', '..', '.env'),
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), 'server', '.env')
    ];

    console.log('🔍 Procurando arquivo .env em:');
    
    for (const envPath of possiblePaths) {
      console.log(`   Tentando: ${envPath}`);
      
      if (fs.existsSync(envPath)) {
        console.log(`✅ Arquivo .env encontrado: ${envPath}`);
        return envPath;
      }
    }

    console.log('❌ Arquivo .env não encontrado!');
    return null;
  }

  // Parse manual do arquivo .env
  parseEnvFile(envPath) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const config = {};

      console.log('📄 Conteúdo do arquivo .env:');
      
      content.split('\n').forEach((line, index) => {
        line = line.trim();
        
        if (!line || line.startsWith('#')) {
          if (line.startsWith('#')) {
            console.log(`   ${index + 1}: ${line} (comentário)`);
          }
          return;
        }

        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) {
          console.log(`   ${index + 1}: ${line} (formato inválido)`);
          return;
        }

        const key = line.substring(0, equalIndex).trim();
        const value = line.substring(equalIndex + 1).trim();
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        config[key] = cleanValue;
        console.log(`   ${index + 1}: ${key}=${key.includes('PASSWORD') ? '*'.repeat(cleanValue.length) : cleanValue} ✅`);
      });

      return config;
    } catch (error) {
      console.error(`❌ Erro ao ler arquivo .env: ${error.message}`);
      return this.loadFromSystemEnv();
    }
  }

  // Define as variáveis no process.env
  setProcessEnv(config) {
    Object.keys(config).forEach(key => {
      process.env[key] = config[key];
      console.log(`🔧 ${key} definido no process.env`);
    });
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
    console.log(`   Port: ${process.env.PORT}`);
  }

  // Método para testar conectividade básica
  async testConnectivity() {
    const net = require('net');
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT) || 3306;

    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 10000; // 10 segundos para produção

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

  reload() {
    this.loaded = false;
    this.config = {};
    return this.forceLoad();
  }

  getConfig() {
    if (!this.loaded) {
      return this.forceLoad();
    }
    return this.config;
  }
}

// Instância singleton
const envLoader = new RenderEnvLoader();

// Carregar imediatamente
envLoader.forceLoad();

module.exports = envLoader;