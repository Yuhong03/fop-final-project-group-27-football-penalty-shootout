// 球的发射状态变量
let ballLaunched = false;

// Ball 类
class Ball {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.speed = createVector(0, 0); // 初始速度为 0
        this.radius = 10;
    }

    move() {
        this.position.add(this.speed);

        // Boundary collision detection
        if (this.position.x < 0 || this.position.x > width) {
            this.speed.x *= -1; // 水平方向反弹
        }
    }

    checkOutOfBounds() {
        return this.position.y < 0 || this.position.y > height;
    }

    reset(x, y) {
        this.position.set(x, y);
        this.speed.set(0, 0); // 重置速度为 0
    }

    launch(targetX, targetY) {
        // 计算朝向鼠标位置的速度向量并归一化
        let direction = createVector(targetX - this.position.x, targetY - this.position.y);
        direction.normalize();
        this.speed.set(direction.mult(6)); // 设置速度大小
    }

    draw() {
        fill(255, 255, 0);
        ellipse(this.position.x, this.position.y, this.radius * 2);
    }

    checkCollisionWithShooter(shooter) {
        let topEdge = shooter.position.y - shooter.height / 2;
        let leftEdge = shooter.position.x - shooter.width / 2;
        let rightEdge = shooter.position.x + shooter.width / 2;

        return (
            this.position.y + this.radius >= topEdge &&
            this.position.x >= leftEdge &&
            this.position.x <= rightEdge &&
            this.speed.y > 0 // 确保球是从上方落下时碰撞
        );
    }

    checkCollisionWithObstacle(obstacle) {
        let d = dist(this.position.x, this.position.y, obstacle.position.x, obstacle.position.y);
        return d < this.radius + obstacle.radius;
    }
}

// Obstacle 类（绿色小球）
class Obstacle {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.radius = 13; // 缩小小球半径
    }

    draw() {
        fill(5, 255, 0); // 绿色
        ellipse(this.position.x, this.position.y, this.radius * 2);
    }
}

// Goalkeeper 类
class Goalkeeper {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.speed = 2; // Goalkeeper's speed
        this.radius = 15;
        this.direction = 1; // Direction: 1 for right, -1 for left
    }

    move() {
        this.position.x += this.speed * this.direction;

        // 限制守门员的移动范围在大禁区（罚球区）
        if (this.position.x < 150 + this.radius || this.position.x > 450 - this.radius) {
            this.direction *= -1; // 反转方向
        }
    }

    draw() {
        fill(0, 255, 0);
        ellipse(this.position.x, this.position.y, this.radius * 2);
    }
}

// Shooter 类（射门平台）
class Shooter {
    constructor() {
        this.position = createVector(width / 2, height - 30); // 初始位置
        this.width = 80; // 平台宽度
        this.height = 10; // 平台高度
        this.speed = 5; // 平台移动速度
    }

    move(direction) {
        this.position.x += direction * this.speed;

        // 限制平台不超出边界
        this.position.x = constrain(this.position.x, this.width / 2, width - this.width / 2);
    }

    draw() {
        fill(255, 0, 0); // 红色平台
        rect(this.position.x - this.width / 2, this.position.y - this.height / 2, this.width, this.height);
    }
}

// GameManager 类
class GameManager {
    constructor() {
        this.lives = 3;
        this.score = 0;
        this.gameState = "playing";
        this.ball = new Ball(width / 2, height - 40);
        this.goalkeeper = new Goalkeeper(width / 2, 60);
        this.shooter = new Shooter(); // 射门平台
        this.obstacles = this.createObstacles(); // 随机生成绿色小球
    }

    createObstacles() {
        let obstacles = [];
        while (obstacles.length < 10) {
            let x = random(50, width - 50);
            let y = random(150, 350); // 限制 Y 坐标在 150-350 范围
            let valid = true;

            // 检查是否太靠近其他障碍物
            for (let obstacle of obstacles) {
                let d = dist(x, y, obstacle.position.x, obstacle.position.y);
                if (d < 18) { // 间隔为绿色小球的直径（8*2 + 间隔10）
                    valid = false;
                    break;
                }
            }

            if (valid) {
                obstacles.push(new Obstacle(x, y));
            }
        }
        return obstacles;
    }

    updateGameState() {
        if (this.lives <= 0) {
            this.gameState = "gameOver";
            this.showGameOver(); // 游戏结束提示
        }
    }

    showGameOver() {
        noLoop(); // 停止游戏循环
        fill(255, 0, 0);
        textSize(40);
        textAlign(CENTER, CENTER);
        text("Game Over", width / 2, height / 2);
        textSize(20);
        text("Press 'R' to Restart", width / 2, height / 2 + 50);
    }

    checkGoal() {
        if (
            this.ball.position.y < 60 &&
            this.ball.position.x > width / 4 &&
            this.ball.position.x < width / 4 + width / 2
        ) {
            this.score++;
            this.resetBall();
        }
    }

    handleOutOfBounds() {
        if (this.ball.checkOutOfBounds()) {
            this.lives--;
            this.resetBall();
        }
    }

    handleCollisions() {
        // 与射门平台碰撞
        if (this.ball.checkCollisionWithShooter(this.shooter)) {
            this.ball.speed.y *= -1; // 球反弹
            this.ball.position.y = this.shooter.position.y - this.shooter.height / 2 - this.ball.radius; // 调整位置
        }

        // 与绿色小球碰撞
        for (let obstacle of this.obstacles) {
            if (this.ball.checkCollisionWithObstacle(obstacle)) {
                this.ball.speed.x *= -1; // 折射
                this.ball.speed.y *= -1;
            }
        }
    }

    resetBall() {
        this.ball.reset(this.shooter.position.x, this.shooter.position.y - 15);
        ballLaunched = false; // 重置发射状态
    }

    displayScoreAndLives() {
        fill(255);
        textSize(20);
        text(`Score: ${this.score}`, 10, 30);
        text(`Lives: ${this.lives}`, width - 180, 30);
    }

    drawObstacles() {
        for (let obstacle of this.obstacles) {
            obstacle.draw();
        }
    }
}

let game;

function setup() {
    createCanvas(600, 700);
    game = new GameManager();
    textFont('Arial');
    textSize(20);
}

function draw() {
    background(0, 120, 60); // 绿色背景
    drawField();

    if (game.gameState === "playing") {
        // 检查按键状态
        if (keyIsDown(37)) {
            // 按下 'left arrow' 键
            game.shooter.move(-1);
        }
        if (keyIsDown(39)) {
            // 按下 'right arrow' 键
            game.shooter.move(1);
        }

        if (!ballLaunched) {
            game.ball.reset(game.shooter.position.x, game.shooter.position.y - 15); // 黄色小球跟随红色平台
        }
        game.goalkeeper.move();
        game.goalkeeper.draw();
        game.shooter.draw();
        game.displayScoreAndLives();
        game.drawObstacles(); // 绘制绿色小球
        if (ballLaunched) {
            game.ball.move();
        }
        game.ball.draw();
        game.handleCollisions();
        game.checkGoal();
        game.handleOutOfBounds();
        game.updateGameState();
    }
}

function drawField() {
    background(0, 120, 60); // Green grass
      
    // Draw the football field
    push();
    fill(0,100,50);
    noStroke();
    rect(0,0,600,80);
    rect(0,160,600,80);
    rect(0,320,600,80);
    rect(0,480,600,80);
    rect(0,620,600,80);
    pop();
  
    // Draw the line
    fill(0,100,50);
    stroke(255);
    strokeWeight(5);
    ellipse(300,350,140,140);
  
    // Draw the field spot
    fill(255);
    ellipse(300,600,5,5);
    ellipse(300,100,5,5);
    ellipse(300,350,5,5);
    
    // Draw the penalty area
    fill(255);
    rect(0,350,600,0);
    rect(150,560,300,0);
    rect(150,560,0,140);
    rect(450,560,0,140);
    rect(150,0,0,140);
    rect(450,0,0,140);
    rect(150,140,300,0);
    
    // Draw the door
    fill(225);
    noStroke();
    rect(220,10,150, 20); // up door rectangle
    rect(230,670,150, 20); // bottom door rectangle
}

function mousePressed() { 
    if (!ballLaunched && game.gameState === "playing") {
        ballLaunched = true;
        game.ball.launch(mouseX, mouseY); // 朝鼠标方向发射球
    }
}

function keyPressed() {
    if (game.gameState === "gameOver" && key.toLowerCase() === "r") {
        game = new GameManager();
        loop();
    }
}
