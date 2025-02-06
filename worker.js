const { parentPort, workerData } = require('worker_threads');
const elliptic = require('elliptic');
const CryptoJS = require('crypto-js');

const { rangeStart, rangeEnd, targetHash, minStep, maxStep } = workerData;

const EC = elliptic.ec;
const ec = new EC('secp256k1');

const start = BigInt("0x" + rangeStart);
const end = BigInt("0x" + rangeEnd);
const stepMin = BigInt(minStep);
const stepMax = BigInt(maxStep);

let currentStep = start;

function getRandomStep() {
    return BigInt(Math.floor(Math.random() * (Number(stepMax - stepMin) + 1)) + Number(stepMin));
}

while (true) {  
    if (currentStep > end) currentStep = start;

    const privateKeyHex = currentStep.toString(16).padStart(64, '0');
    const privateKeyBigInt = BigInt("0x" + privateKeyHex);

    if (privateKeyBigInt <= 0n || privateKeyBigInt >= ec.curve.n) {
        currentStep += getRandomStep();
        continue;
    }

    try {
        const keyPair = ec.keyFromPrivate(privateKeyHex);
        const publicKey = keyPair.getPublic(true, 'hex');
        const sha256Hash = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(publicKey));
        const ripemd160Hash = CryptoJS.RIPEMD160(sha256Hash).toString();

        // 🔥 Exibe a chave base antes da verificação
        const significantPrivateKeyHex = privateKeyHex.replace(/^0+/, '');
        parentPort.postMessage({
            type: 'update',
            message: `Base Key: ${significantPrivateKeyHex}`,
        });

        // 🔥 Apenas verifica o targetHash se começar com "7", senão apenas continua a busca.
        if (ripemd160Hash.startsWith('7')) {
            if (ripemd160Hash === targetHash) {
                parentPort.postMessage({ type: 'found', privateKey: privateKeyHex });
                break;
            }
        }

        

    } catch (error) {
        parentPort.postMessage({
            type: 'error',
            message: `Error at step ${privateKeyHex}: ${error.message}`,
        });
    }

    currentStep += getRandomStep();
}
