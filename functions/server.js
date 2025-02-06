const express = require('express'); // Importa o módulo Express
const path = require('path'); // Importa path para lidar com caminhos de arquivos
const { connectToDatabase } = require('./db');
const { handleStartSearch, handleStopSearch } = require('./controller');

const app = express(); // Inicializa o aplicativo Express
const PORT = 3000; // Define a porta do servidor

// Middleware para interpretar JSON no corpo das requisiçõe
app.use(express.json());

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Rota para iniciar a busca
app.post('/start-search', handleStartSearch);

// Rota para parar a busca
app.post('/stop-search', handleStopSearch);

// Conecta ao MongoDB e inicia o servidor
connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
});