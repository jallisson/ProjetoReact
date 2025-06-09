// server/config/env-loader.js
// Versão corrigida que funciona tanto local quanto Railway

const fs = require('fs');
const path = require('path');

class EnvLoader {
  constructor() {
    this.loaded = false;
    this.config = {};
  }

  forceLoad() {
    if (this.loaded) {
      return this.config;
    }

    console.log('🔄 Carregando configurações de ambiente...');
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('🚂 RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT ? 'SIM' : 'NÃO');

    // SEMPRE carregar do sistema primeiro
    this.config = this.loadFromSystemEnv();

    // Se alguma variável crítica estiver faltando e não for Railway, tentar .env
    const missingCritical = this.checkMissingCritical();
    if (missingCritical.length > 0 && !process.env.RAILWAY_ENVIRONMENT) {
      console.log('⚠️ Variáveis críticas ausentes, tentando arquivo .env...');
      const envPath = this.findEnvFile();
      if (envPath) {
        const envConfig = this.parseEnvFile(envPath);
        // Mesclar as variáveis do .env
        Object.keys(envConfig).forEach(key => {
          if (envConfig[key] && !this.config[key]) {
            this.config[key] = envConfig[key];
          }
        });
      }
    }

    // Definir as variáveis no process.env
    this.setProcessEnv(this.config);

    // Validar configuração final
    this.validateConfig();

    this.loaded = true;
    return this.config;
  }

  // Carregar do sistema de variáveis de ambiente
  loadFromSystemEnv() {
    console.log('📊 Carregando variáveis de ambiente do sistema...');
    
    const config = {
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_NAME: process.env.DB_NAME,
      DB_PORT: process.env.DB_PORT,
      PORT: process.env.PORT
    };

    console.log('📋 Variáveis encontradas no sistema:');
    Object.keys(config).forEach(key => {
      const value = config[key];
      const displayValue = key.includes('PASSWORD') ? 
        (value ? '*'.repeat(value.length) : 'AUSENTE') : 
        (value || 'AUSENTE');
      console.log(`   ${key}: ${displayValue} ${value ? '✅' : '❌'}`);
    });

    return config;
  }

  // Verificar variáveis críticas ausentes
  checkMissingCritical() {
    const critical = ['DB_HOST', 'DB_USER', 'DB_NAME'];
    return critical.filter(key => !process.env[key] && !this.config[key]);
  }

  // Encontra o arquivo .env correto
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

      console.log('📄 Lendo arquivo .env...');
      
      content.split('\n').forEach((line, index) => {
        line = line.trim();
        
        if (!line || line.startsWith('#')) {
          return;
        }

        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) {
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
      return {};
    }
  }

  // Define as variáveis no process.env (CORRIGIDO)
  setProcessEnv(config) {
    Object.keys(config).forEach(key => {
      const value = config[key];
      if (value !== undefined && value !== null && !process.env[key]) {
        process.env[key] = String(value); // Garantir que seja string
        console.log(`🔧 ${key} definido no process.env`);
      } else if (process.env[key]) {
        console.log(`⚠️ ${key} já existe no process.env, mantendo valor do sistema`);
      }
    });
  }

  // Aplicar valores padrão apenas se absolutamente necessário
  applyDefaults() {
    const defaults = {
      DB_HOST: 'localhost',
      DB_USER: 'root',
      DB_PASSWORD: '',
      DB_NAME: 'gerenciamento_produtos',
      DB_PORT: '3306',
      PORT: '5000'
    };

    console.log('⚠️ Aplicando valores padrão para variáveis ausentes...');
    
    Object.keys(defaults).forEach(key => {
      if (!process.env[key]) {
        process.env[key] = defaults[key];
        console.log(`🔧 ${key} definido com valor padrão: ${defaults[key]}`);
      }
    });
  }

  // Valida se a configuração está completa
  validateConfig() {
    console.log('🔍 Validando configuração final...');
    
    const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PORT'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error(`❌ Variáveis obrigatórias ausentes: ${missing.join(', ')}`);
      
      // No Railway, aplicar defaults se necessário
      if (process.env.RAILWAY_ENVIRONMENT) {
        console.log('🚂 Railway detectado, aplicando configuração de emergência...');
        this.applyDefaults();
      } else {
        // Em desenvolvimento, mostrar as variáveis que temos
        console.log('🔍 DEBUG - Variáveis atuais no process.env:');
        required.forEach(key => {
          console.log(`   ${key}: ${process.env[key] || 'UNDEFINED'}`);
        });
        
        // Ainda assim aplicar defaults para não quebrar
        console.log('🔧 Aplicando defaults mesmo em desenvolvimento...');
        this.applyDefaults();
        
        // Verificar novamente
        const stillMissing = required.filter(key => !process.env[key]);
        if (stillMissing.length > 0) {
          throw new Error(`Configuração incompleta: ${stillMissing.join(', ')}`);
        }
      }
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
      const timeout = 10000;

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
const envLoader = new EnvLoader();

// Carregar imediatamente
envLoader.forceLoad();

module.exports = envLoader;