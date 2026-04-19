const express = require('express');
const http = require('http');
const cors = require('cors');
const {Server} = require('socket.io');
const { disconnect } = require('cluster');
const {createClient} = require('redis')

const app = express();

app.use(cors({
    origin: '*',
    methods : ['GET','POST']
}));

app.use(express.json());

const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin:'*',
        methods:['GET','POST']
    }
})

const redisClient = createClient({
    url : 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.error('🔴 Redis Client Error:', err))
redisClient.on('ready', ()=> console.log('🟢 Redis is ready to accept commands'))

app.get('/health',(req,res)=>{
    res.status(200).json({status:'Proximity Engine is runnign fine!'})
})

io.on('connection',(socket)=>{
    console.log(`New client connected with Socket ID : ${socket.id}`)

    socket.on('disconnect',()=>{
        console.log(`Client disconnected: ${$socket.id}`)
    });
});

async function startServer(){
    try{
        await redisClient.connect();
        console.log('Connected to local red');
        const PORT = 3001;
        server.listen(PORT,()=>{
            console.log('Proximity server running')
        });

    }catch(error){
        onsole.error('❌ Failed to start the server:', error);
        process.exit(1); // Exit the process if we can't connect to the database
    }
}

startServer();