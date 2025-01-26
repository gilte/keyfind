const { MongoClient } = require('mongodb');

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

function getDb() {
    return db;
}

module.exports = { connectToDatabase, getDb };