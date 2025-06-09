// server/debug-env.js - Arquivo para debug das variáveis de ambiente

console.log('🔍 DEBUG DAS VARIÁVEIS DE AMBIENTE');
console.log('='.repeat(60));

console.log('📊 Variáveis de ambiente brutas:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*'.repeat(process.env.DB_PASSWORD.length) : 'UNDEFINED');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);

console.log('\n🌐 Todas as variáveis que começam com DB_:');
Object.keys(process.env)
  .filter(key => key.startsWith('DB_'))
  .forEach(key => {
    const value = process.env[key];
    const displayValue = key.includes('PASSWORD') ? 
      (value ? '*'.repeat(value.length) : 'UNDEFINED') : 
      value;
    console.log(`${key}: ${displayValue}`);
  });

console.log('\n🚂 Variáveis do Railway:');
Object.keys(process.env)
  .filter(key => key.startsWith('RAILWAY_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });

console.log('='.repeat(60));