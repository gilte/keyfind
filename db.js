const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://elielgil18:pRtT6Zsd5okydIFx@users.rzq07.mongodb.net/'; // String de conexão do MongoDB Atlas
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
