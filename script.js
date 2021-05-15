const canvas = document.querySelector(".snake-canvas");
const ctx = canvas.getContext("2d");
const scoreLabel = document.querySelector(".score-label");
const speedSliderLabel = document.querySelector(".speed-slider-label");
const speedSlider = document.querySelector(".speed-slider");
const infoOverlay = document.querySelector(".info-overlay");
const hintText = document.querySelector(".hint-text");
const soundFoodConsume = document.querySelector("#food_consume");
soundFoodConsume.volume = 0.1;
const soundMove = document.querySelector("#move");
soundMove.volume = 0.01;
const soundGameOver = document.querySelector("#game_over");
soundGameOver.volume = 0.1;
const foodImage = new Image();
foodImage.src = "img/food.png";

const SQUARE_SIZE = 50;
const CANVAS_WIDTH = 1050;
const CANVAS_HEIGHT = 650;

let score = 0;
let game;
let gameSpeed;
let gameState = "page_loaded";

// Construct array of available food locations
let availableSquaresForFood = [];

for (let i = 0; i < CANVAS_HEIGHT; i += SQUARE_SIZE) {
    for (let j = 0; j < CANVAS_WIDTH; j += SQUARE_SIZE) {
        availableSquaresForFood.push({x: j, y: i});
    }
}

// Snake Object
const snake = {
    size: SQUARE_SIZE,
    color: "#035949",
    foodConsumed: false,
    direction: [1, 0],
    newDirection: [1, 0],
    elements: [[CANVAS_WIDTH / 2 - SQUARE_SIZE / 2, CANVAS_HEIGHT / 2 - SQUARE_SIZE / 2]],

    update() {
        this.direction = this.newDirection;
        this.elements.unshift([this.elements[0][0] + this.direction[0] * SQUARE_SIZE, this.elements[0][1] + this.direction[1] * SQUARE_SIZE]);
        if (this.foodConsumed) {
            return;
        } else {
            this.elements.pop();
        }
    },

    draw() {
        soundMove.play();
        ctx.fillStyle = this.color;
    
        // Snake just consists of head
        if (this.elements.length < 2) {
            ctx.fillRect(this.elements[0][0] + 1, this.elements[0][1] + 1, SQUARE_SIZE - 2, SQUARE_SIZE - 2);
            return;
        }
    
        for (let i = 0; i < this.elements.length; i++) {
            // Draw small square for all elements
            ctx.fillRect(this.elements[i][0] + 1, this.elements[i][1] + 1, SQUARE_SIZE - 2, SQUARE_SIZE - 2);
    
            // All elements but the tail get checked for connection to next element
            if (i < this.elements.length - 1) {
                // Has connection on left side
                if (this.elements[i][0] - this.elements[i + 1][0] > 0) {
                    ctx.fillRect(this.elements[i][0] - 1, this.elements[i][1] + 1, 2, SQUARE_SIZE - 2);
                // Has connection on right side
                } else if (this.elements[i][0] - this.elements[i + 1][0] < 0) {
                    ctx.fillRect(this.elements[i][0] + SQUARE_SIZE - 1, this.elements[i][1] + 1, 2, SQUARE_SIZE - 2);
                // Has connection on top side
                } else if (this.elements[i][1] - this.elements[i + 1][1] > 0) {
                    ctx.fillRect(this.elements[i][0] + 1, this.elements[i][1] - 1, SQUARE_SIZE - 2, 2);
                // Has connection on bottom side
                } else if (this.elements[i][1] - this.elements[i + 1][1] < 0) {
                    ctx.fillRect(this.elements[i][0] + 1, this.elements[i][1] + SQUARE_SIZE - 1, SQUARE_SIZE - 2, 2);
                }
            }
        }
    },

    wallsCollision() {
        if (this.elements[0][0] >= canvas.width
            || this.elements[0][0] < 0
            || this.elements[0][1] >= canvas.height
            || this.elements[0][1] < 0) {
            return true;
        }
    },

    selfCollision() {
        if (this.elements.length >= 4) {
            for (let i = 1; i < this.elements.length; i++) {
                if (this.elements[0][0] === this.elements[i][0] && this.elements[0][1] === this.elements[i][1]) {
                    return true;
                }
            }
        }
    },

    foodCollision() {
        if (this.elements[0][0] == food.position[0] && this.elements[0][1] == food.position[1]) {
            soundFoodConsume.play();
            return true;
        }
    }
}

// Food Object
const food = {
    position: [CANVAS_WIDTH / 2 - SQUARE_SIZE / 2 + 200, CANVAS_HEIGHT / 2 - SQUARE_SIZE / 2],

    place() {
        if (availableSquaresForFood.length < 1) {
            endCurrentGame();
            return;
        }
        const index = Math.floor(Math.random() * availableSquaresForFood.length);
        const x = availableSquaresForFood[index].x;
        const y = availableSquaresForFood[index].y;
        this.position = [x, y];
    },

    draw() {
        ctx.drawImage(foodImage, this.position[0], this.position[1], SQUARE_SIZE, SQUARE_SIZE);
    }
}

function updateAvailableSquaresForFood() {
    // Remove the square where the head is now
    const removeIndex = availableSquaresForFood.findIndex(element => element.x === snake.elements[0][0] + snake.direction[0] && element.y === snake.elements[0][1] + snake.direction[1]);
    availableSquaresForFood.splice(removeIndex, 1);
    if (!snake.foodConsumed) {
        availableSquaresForFood.push({x: snake.elements[snake.elements.length - 1][0], y: snake.elements[snake.elements.length - 1][1]});
    }
}

function increaseScore() {
    score += 1;
    scoreLabel.textContent = `Score: ${score}`;
}

function updateSpeed() {
    gameSpeed = 1100 - (this.value * 100);
    speedSliderLabel.textContent = `Game Speed: ${this.value}`;
}

function handleKeyInput(e) {
    if (e.keyCode === 39 && snake.direction[0] === 0) {
        snake.newDirection = [1, 0];
    } else if (e.keyCode === 37 && snake.direction[0] === 0) {
        snake.newDirection = [-1, 0];
    } else if (e.keyCode === 40 && snake.direction[1] === 0) {
        snake.newDirection = [0, 1];
    } else if (e.keyCode === 38 && snake.direction[1] === 0) {
        snake.newDirection = [0, -1];
    } else if (e.keyCode === 80 && (gameState === "running" || gameState === "paused")) {
        togglePause();
    } else if (e.keyCode === 13 && (gameState === "page_loaded" || gameState === "game_over")) {
        newGame();
    }
}

function newGame() {
    snake.size = SQUARE_SIZE;
    snake.color = "#035949";
    snake.direction = [1, 0];
    snake.newDirection = [1, 0];
    snake.elements = [[CANVAS_WIDTH / 2 - SQUARE_SIZE / 2, CANVAS_HEIGHT / 2 - SQUARE_SIZE / 2]];

    food.position = [CANVAS_WIDTH / 2 - SQUARE_SIZE / 2 + 200, CANVAS_HEIGHT / 2 - SQUARE_SIZE / 2];

    gameSpeed = 1100 - (speedSlider.value * 100);

    clearInterval(game);
    game = setInterval(updateCanvas, gameSpeed);

    infoOverlay.classList.remove("active");
    gameState = "running";
}

function endCurrentGame() {
    clearInterval(game);
    hintText.textContent = `Game Over! Score: ${score}`;
    infoOverlay.classList.add("active");
    speedSlider.classList.add("active");
    speedSliderLabel.classList.add("active");
    gameState = "game_over";
    soundGameOver.play();
}

function togglePause() {
    if (gameState === "paused") {
        game = setInterval(updateCanvas, gameSpeed);
        infoOverlay.classList.remove("active");
        gameState = "running";
    } else {
        clearInterval(game);
        hintText.textContent = "Game Paused"
        infoOverlay.classList.add("active");
        speedSlider.classList.remove("active");
        speedSliderLabel.classList.remove("active");
        gameState = "paused";
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateCanvas() {
    updateAvailableSquaresForFood();
    snake.update();
    if (snake.wallsCollision() || snake.selfCollision()) {
        endCurrentGame();
        return;
    }
    if (snake.foodCollision()) {
        snake.foodConsumed = true;
        food.place();
        increaseScore();
    } else {
        snake.foodConsumed = false;
    }
    clearCanvas();
    snake.draw();
    food.draw();
}

// Event Listeners
window.addEventListener("keydown", handleKeyInput);
speedSlider.addEventListener("input", updateSpeed);