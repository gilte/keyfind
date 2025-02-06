const { startSearch, stopSearch } = require('./searchModel');

async function handleStartSearch(req, res) {
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
        await startSearch(rangeStart, rangeEnd, targetHash, minStep, maxStep, res);
    } catch (error) {
        res.status(500).json({ type: 'error', message: 'An error occurred while processing the request.' });
    }
}

function handleStopSearch(req, res) {
    stopSearch(res);
}

module.exports = { handleStartSearch, handleStopSearch };