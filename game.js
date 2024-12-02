// Ball launch state variables 球的发射状态变量
let ballLaunched = false;

// Ball 类
class Ball {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.speed = createVector(0, 0); // initial speed = 0
        this.radius = 10;
    }

    move() {
        this.position.add(this.speed);

        // Boundary collision detection
        if (this.position.x < 0 || this.position.x > width) {
            this.speed.x *= -1; // Horizontal rebound 水平方向反弹
        }
    }

    checkOutOfBounds() {
        return this.position.y < 0 || this.position.y > height;
    }

    reset(x, y) {
        this.position.set(x, y);
        this.speed.set(0, 0); // Reset speed = 0
    }

    launch(targetX, targetY) {
        // Calculate the velocity vector towards the mouse position and normalize 计算朝向鼠标位置的速度向量并归一化
        let direction = createVector(targetX - this.position.x, targetY - this.position.y);
        direction.normalize();
        this.speed.set(direction.mult(6)); // Set the speed
    }

    // Draw the football
    draw() {
        fill(255, 255, 0);
        ellipse(this.position.x, this.position.y, this.radius * 2);
    }

// The collision between football and shooter
    checkCollisionWithShooter(shooter) {
        let topEdge = shooter.position.y - shooter.height / 2;
        let leftEdge = shooter.position.x - shooter.width / 2;
        let rightEdge = shooter.position.x + shooter.width / 2;

        return (
            this.position.y + this.radius >= topEdge &&
            this.position.x >= leftEdge &&
            this.position.x <= rightEdge &&
            this.speed.y > 0 // Make sure the ball collides when it falls from above 确保球是从上方落下时碰撞
        );
    }

    checkCollisionWithObstacle(obstacle) {
        let d = dist(this.position.x, this.position.y, obstacle.position.x, obstacle.position.y);
        return d < this.radius + obstacle.radius;
    }
}

// Obstacle 类（small green ball 绿色小球）
class Obstacle {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.radius = 13; // Reduce the ball radius 缩小小球半径
    }

    draw() {
        fill(5, 255, 0); // green
        ellipse(this.position.x, this.position.y, this.radius * 2);
    }
}

// The Goalkeeper
class Goalkeeper {  // Goalkeeper's movement
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
            this.direction *= -1; // Reverse Direction 反转方向
        }
    }

    // Draw the Goalkeeper
    draw() { 
        fill(242,200,103);
        rect(this.position.x, this.position.y,this.radius * 2,10,10);
        rect(this.position.x, this.position.y,this.radius * -2,10,10);

        fill(0,0,0);
        ellipse(this.position.x, this.position.y, this.radius * 2);
    }
}

// Shooter（ shoot platform 射门平台）
// Shooter（射门平台，替换为球员模型）
class Shooter {
    constructor() {
        this.position = createVector(width / 2, height - 30); // 初始位置
        this.width = 80; // 球员宽度（与守门员一致）
        this.height = 10; // 球员高度
        this.speed = 5; // 球员移动速度
        this.kick = false; // 踢球状态
        this.kickFrame = 0; // 踢球动画帧数
    }

    move(direction) {
        this.position.x += direction * this.speed;
        this.position.x = constrain(this.position.x, this.width / 2, width - this.width / 2);
    }

    draw() {
        push();
        translate(this.position.x, this.position.y);

        // 绘制蓝白条纹衣服
        for (let i = -20; i < 20; i += 10) {
            fill(i % 20 === 0 ? 0 : 255, 255, i % 20 === 0 ? 255 : 255); // 蓝白相间
            rect(i, -40, 10, 40); // 每条宽10，高40
        }

        // 头部
        fill(0, 0, 0);
        ellipse(0, -60, 30, 30);

        // 腿部
        fill(0, 0, 0);
        if (this.kick) {
            // 踢球动作
            if (this.kickFrame < 10) {
                rect(-15, 0, 10, 30); // 静止腿
                rect(5, 10 - this.kickFrame, 10, 30); // 摆动腿
            } else {
                this.kick = false; // 动作完成，复位
                this.kickFrame = 0;
            }
            this.kickFrame++;
        } else {
            rect(-15, 0, 10, 30); // 左腿
            rect(5, 0, 10, 30); // 右腿
        }
        pop();
    }

    kickBall() {
        this.kick = true;
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
        this.shooter = new Shooter(); // shoot platfrom 
        this.obstacles = this.createObstacles(); // Randomly generate green balls 随机生成绿色小球
    }

    createObstacles() {
        let obstacles = [];
        while (obstacles.length < 10) {
            let x = random(50, width - 50);
            let y = random(150, 350); // 限制 Y 坐标在 150-350 范围
            let valid = true;

            // Check if it is too close to other obstacles 检查是否太靠近其他障碍物
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
            this.showGameOver(); // Game over prompt
        }
    }

    showGameOver() {
        noLoop(); // stop the loop of the game
        fill(255, 100, 0);
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

    handleOutOfBounds() {  // Avoid out of bounds
        if (this.ball.checkOutOfBounds()) {
            this.lives--;
            this.resetBall();
        }
    }

    handleCollisions() {
        // 检测与球员的碰撞
        if (this.ball.checkCollisionWithShooter(this.shooter)) {
            this.ball.speed.y *= -1; // 球反弹
            this.ball.position.y = this.shooter.position.y - this.shooter.height / 2 - this.ball.radius; // 调整球的位置
            this.shooter.kickBall(); // 触发球员踢球动作
        }
    
        // 检测与绿色小球（障碍物）的碰撞
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obstacle = this.obstacles[i];
            if (this.ball.checkCollisionWithObstacle(obstacle)) {
                this.ball.speed.x *= -1; // 折射
                this.ball.speed.y *= -1;
                this.obstacles.splice(i, 1); // 移除障碍物
            }
        }
    }
   

    resetBall() {
        this.ball.reset(this.shooter.position.x, this.shooter.position.y - 15);
        ballLaunched = false; // Reset the shoot state
    }

    displayScoreAndLives() {  // Display the score and lives
        fill(255);
        textSize(20);
        text(`Score: ${this.score}`, 10, 30);
        text(`Lives: ${this.lives}`, width -100, 30);
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
    background(0, 120, 60); // green background
    drawField();

    if (game.gameState === "playing") {
        // check button status
        if (keyIsDown(37)) {
            // press 'left arrow' 
            game.shooter.move(-1);
        }
        if (keyIsDown(39)) {
            // press 'right arrow' 
            game.shooter.move(1);
        }

        if (!ballLaunched) {
            game.ball.reset(game.shooter.position.x, game.shooter.position.y - 15); // the yellow ball follows the red platform
        }
        game.goalkeeper.move();
        game.goalkeeper.draw();
        game.shooter.draw();
        game.displayScoreAndLives();
        game.drawObstacles(); // Draw small green balls
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
    fill(201,147,121);
    noStroke();
    rect(220,10,150, 20); // up door rectangle
    rect(230,670,150, 20); // bottom door rectangle
}

function mousePressed() {
    if (!ballLaunched && game.gameState === "playing") {
        ballLaunched = true;
        game.ball.launch(mouseX, mouseY); // 发射球
        game.shooter.kickBall(); // 触发踢球动作
    }
}


function keyPressed() {
    if (game.gameState === "gameOver" && key.toLowerCase() === "r") {
        game = new GameManager();
        loop();
    }
}
