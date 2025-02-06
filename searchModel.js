const { Worker } = require('worker_threads');
const path = require('path');
const { getDb } = require('./db');

let activeWorker = null; // Variável global para o worker ativo

async function startSearch(rangeStart, rangeEnd, targetHash, minStep, maxStep, res) {
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
            await getDb().collection('foundKeys').insertOne({ privateKey: message.privateKey, timestamp: new Date() });
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
}

function stopSearch(res) {
    if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
        return res.json({ type: 'stopped', message: 'Search has been stopped.' });
    } else {
        return res.status(400).json({ type: 'error', message: 'No active search to stop.' });
    }
}

module.exports = { startSearch, stopSearch };