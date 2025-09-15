const fs = require('fs');
const path = require('path');

// Estrutura de pastas para o frontend
const folders = [
  'src',
  'src/components',
  'src/components/common',
  'src/components/forms', 
  'src/components/charts',
  'src/screens',
  'src/screens/auth',
  'src/screens/transactions',
  'src/screens/goals',
  'src/screens/budgets',
  'src/screens/categories',
  'src/screens/reports',
  'src/navigation',
  'src/services',
  'src/hooks',
  'src/utils',
  'src/types',
  'src/constants',
  'src/contexts',
  'assets/images',
  'assets/fonts'
];

console.log('🏗️ Criando estrutura de pastas...');

folders.forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✅ Pasta criada: ${folder}`);
  } else {
    console.log(`⏭️ Pasta já existe: ${folder}`);
  }
});

console.log('');
console.log('🎉 Estrutura criada com sucesso!');
console.log('');
console.log('📁 Estrutura do projeto:');
console.log('');
console.log('financeApp/');
console.log('├── src/');
console.log('│   ├── components/      # Componentes reutilizáveis');
console.log('│   ├── screens/         # Telas do app');
console.log('│   ├── navigation/      # Configuração de rotas');
console.log('│   ├── services/        # Calls para API');
console.log('│   ├── hooks/           # Custom hooks');
console.log('│   ├── utils/           # Funções auxiliares');
console.log('│   ├── types/           # Tipos TypeScript');
console.log('│   ├── constants/       # Constantes e configs');
console.log('│   └── contexts/        # Context API');
console.log('├── assets/              # Imagens, fontes, etc');
console.log('├── App.tsx              # Componente principal');
console.log('└── package.json');
console.log('');
console.log('🚀 Pronto para começar o desenvolvimento!');