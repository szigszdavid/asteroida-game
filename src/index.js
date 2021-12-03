import * as Y from "yjs";
import { proxy, subscribe } from 'valtio';
import { bindProxyAndYMap } from "valtio-yjs";
import { WebsocketProvider } from 'y-websocket'

// Application (game) state and its functions
const ydoc = new Y.Doc();
const ymap = ydoc.getMap("asteroidagame");
const wsProvider = new WebsocketProvider('ws://localhost:1234', 'asteroidagame-1', ydoc)
console.log(wsProvider);
wsProvider.on('status', event => {
  console.log(event.status) // logs "connected" or "disconnected"
})

const state = proxy({});
subscribe(state, () => {
    
    if (!state.players.includes(ydoc.clientID)) {
        state.players.push(ydoc.clientID)
        gameLoop()
    }
    console.log("Játékosok: " + state.players);
    console.log("My ship: " + state.players.indexOf(ydoc.clientID) + " " + starships[state.players.indexOf(ydoc.clientID)].name);
    draw()
});


const canvas = document.querySelector("canvas");
const context = canvas.getContext('2d')
const startGameButton = document.querySelector("#startGameButton");

//Állapottér
let starships = [
    {
        name: "red",
        x: (canvas.width- 30) / 4,
        y: canvas.height - 60,
        width : 30,
        height : 60,
        vx: 100,
        dir: 0,
    },
    {
        name: "blue",
        x: ((canvas.width- 30) / 4) * 2,
        y: canvas.height - 60,
        width : 30,
        height : 60,
        vx: 100,
        dir: 0,
    },
]

let asteroids = [] // KELL
let gameState = 'INGAME' // END // KELL
let counter = 0

state.players = []
asteroids = []

bindProxyAndYMap(state, ymap);

//hangmanMap.set("playerNumber", state.playerNumber.value)

//-----------------------------------------------------------------------------------------

startGameButton.addEventListener('click', startGame)
function startGame()
{
    state.players = []
    asteroids = []
    state.starships = starships
    state.gameState = gameState
    if (!state.players.includes(ydoc.clientID)) {
        state.players.push(ydoc.clientID)
    }
    
    gameLoop()

}

//Helper function
function random(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a
}

function isCollision(r1, r2) {
    return !(r2.y + r2.height < r1.y ||
    r2.x > r1.x + r1.width ||
    r2.y > r1.y + r1.height ||
    r2.x + r2.width < r1.x)
}

//Game loop
let lastTime = performance.now()
function gameLoop(now = performance.now()) {
    const dt = (now - lastTime) / 1000
    lastTime = now
    //hangmanMap.set("state", state)
    update(dt)
    draw()

    window.requestAnimationFrame(gameLoop)
}
function update(dt) {
    //Starships
    state.starships[state.players.indexOf(ydoc.clientID)].x += state.starships[state.players.indexOf(ydoc.clientID)].dir * state.starships[state.players.indexOf(ydoc.clientID)].vx * dt

    /*
    starships.forEach(starship => {
        starship.x += starship.dir * starship.vx * dt
    })
    */

    //New asteroid
    if (Math.random() < 0.03) {
        asteroids.push(
            {
                x: random(0, canvas.width),
                y: -50,
                width: random(30, 50),
                height: random(30, 50),
                vx: random(-20, 20),
                vy: random(50, 120)
            }
        )
    }

    //Move asteroids
    asteroids.forEach(asteroid => {
        asteroid.x += asteroid.vx * dt
        asteroid.y += asteroid.vy * dt
        
        /*
        starships.forEach(starship => {
            if (isCollision(starship[playerNumber], asteroid)) {
                gameState = 'END'
            }
        })*/

        if (isCollision(state.starships[state.players.indexOf(ydoc.clientID)], asteroid)) {
            gameState = 'END'
        }
        
    })


    //Delete asteroids
    const  before = asteroids.length
    asteroids = asteroids.filter(asteroid => asteroid.y < canvas.height)
    const after = asteroids.length
    if (gameState != 'END') {
        counter += before - after
    }
}
function draw()
{
    //Background
    context.clearRect(0,0,canvas.width, canvas.height)

    //Starship
    
    state.starships.forEach(starship => {
        context.fillStyle = 'orange'
        context.fillRect(starship.x, starship.y, starship.width, starship.height)    
    })

    //Asteroid
    asteroids.forEach(asteroid => {
        context.fillStyle = 'brown'
        context.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height)
    });

    //Counter

    context.fillStyle = 'white'
    context.font = '100px Courier New'
    context.fillText(`Points: ${counter}`, 10, 30)


    //The End
    if(gameState == 'END')
    {
        context.fillStyle = 'white'
        context.font = '100px Courier New'
        context.fillText("The End", 75, 200)
    }

}

//event listeners
document.addEventListener('keydown', onKeyDown)
document.addEventListener('keyup', onKeyUp)

function onKeyDown(e) {
    if (e.key == 'ArrowLeft') {
        console.log("Lenyomva balra");
        state.starships[state.players.indexOf(ydoc.clientID)].dir = -1
        //state.starships = starships
    }
    else if (e.key == 'ArrowRight') {
        console.log("Lenyomva jobbra");
        state.starships[state.players.indexOf(ydoc.clientID)].dir = 1
        //state.starships = starships
    }
}

function onKeyUp(e) {
    
    state.starships[state.players.indexOf(ydoc.clientID)].dir = 0
    //state.starships = starships
}