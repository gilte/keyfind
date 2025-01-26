const express = require('express'); // Importa o módulo Express
const { Worker } = require('worker_threads'); // Importa Worker Threads para multithreading
const path = require('path'); // Importa path para lidar com caminhos de arquivos
const { MongoClient } = require('mongodb'); // Importa o MongoDB client

const app = express(); // Inicializa o aplicativo Express
const PORT = 3008; // Define a porta do servidor

// Middleware para interpretar JSON no corpo das requisiçõe
app.use(express.json());

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, 'public')));

let activeWorker = null; // Variável global para o worker ativo

// Configuração do MongoDB
const uri = 'mongodb://localhost:27017'; // URL de conexão com o MongoDB
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db('bitcoinSearch'); // Nome do banco de dados
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
}

// Função para iniciar a busca
async function startSearch(req, res) {
    const { rangeStart, rangeEnd, targetHash, minStep, maxStep } = req.body;

    // Verificação de parâmetros
    if (!rangeStart || !rangeEnd || !targetHash || !minStep || !maxStep) {
        return res.status(400).json({ type: 'error', message: 'Missing required parameters.' });
    }

    // Verificação de formato de hash
    if (!/^[0-9a-fA-F]{40}$/.test(targetHash)) {
        return res.status(400).json({ type: 'error', message: 'Invalid target hash format.' });
    }

    try {
        // Criação de um Worker para processar a busca
        const worker = new Worker(path.join(__dirname, 'worker.js'), {
            workerData: { rangeStart, rangeEnd, targetHash, minStep, maxStep }
        });

        activeWorker = worker; 

        // Recebe mensagens do Worker
        worker.on('message', async (message) => {
            if (message.type === 'update') {
                // Apenas exibe a mensagem no terminal
                process.stdout.write(`${message.message}\r`);
            } else if (message.type === 'found') {
                console.log('Private Key found: ', message.privateKey);
                // Salva a chave privada encontrada no MongoDB
                await db.collection('foundKeys').insertOne({ privateKey: message.privateKey, timestamp: new Date() });
                // Envia a resposta HTTP e encerra o worker
                res.json({ type: 'found', privateKey: message.privateKey });
                worker.terminate();
                activeWorker = null;
            } else if (message.type === 'finished') {
                // Envia a resposta de finalização da busca
                res.json({ type: 'finished', message: 'Search completed. No match found.' });
                worker.terminate();
                activeWorker = null;
            }
        });

        worker.on('error', (err) => {
            res.status(500).json({ type: 'error', message: err.message });
            activeWorker = null;
        });

        // Loga quando o Worker finaliza
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            }
            activeWorker = null;
        });

    } catch (error) {
        res.status(500).json({ type: 'error', message: 'An error occurred while processing the request.' });
        activeWorker = null;
    }
}

// Função para parar a busca
function stopSearch(req, res) {
    if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
        return res.json({ type: 'stopped', message: 'Search has been stopped.' });
    } else {
        return res.status(400).json({ type: 'error', message: 'No active search to stop.' });
    }
}

// Rota para iniciar a busca
app.post('/start-search', startSearch);

// Rota para parar a busca
app.post('/stop-search', stopSearch);

// Conecta ao MongoDB e inicia o servidor
connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
});