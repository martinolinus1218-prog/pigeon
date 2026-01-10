// 赛鸽飞行模拟游戏 JavaScript 代码

// 游戏状态常量
const GAME_STATE = {
    READY: 'ready',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

// 游戏配置
const config = {
    gravity: 0.3, // 减小重力加速度，让赛鸽下落更慢
    jumpForce: -8, // 减小跳跃力度的负值，让赛鸽上升更平缓
    pipeSpeed: 3, // 减慢管道移动速度
    pipeInterval: 2000, // 增加管道生成间隔，毫秒
    pipeGap: 200, // 增大管道间隙高度
    groundHeight: 60, // 地面高度
    pigeonRadius: 20, // 赛鸽半径
    scoreIncrement: 1 // 每穿过一组管道得分
};

// 游戏变量
let canvas, ctx;
let gameState = GAME_STATE.READY;
let score = 0;
let highScore = localStorage.getItem('pigeonHighScore') || 0;

// 赛鸽对象
const pigeon = {
    x: 100,
    y: 0,
    velocity: 0,
    angle: 0,
    flapping: false,
    flapTime: 0
};

// 管道数组
let pipes = [];

// 游戏计时器
let gameLoopId = null;
let pipeGeneratorId = null;

// 初始化游戏
function initGame() {
    // 获取Canvas元素和上下文
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置Canvas尺寸
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化赛鸽位置
    resetPigeon();
    
    // 初始化管道
    pipes = [];
    
    // 初始化得分
    score = 0;
    document.getElementById('currentScore').textContent = score;
    
    // 添加事件监听器
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);
    
    // 键盘控制
    document.addEventListener('keydown', handleKeyDown);
    
    // 鼠标/触摸控制
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    
    // 绘制初始画面
    drawGame();
}

// 调整Canvas尺寸
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // 重新绘制游戏
    if (gameState === GAME_STATE.READY) {
        drawGame();
    }
}

// 重置赛鸽位置和状态
function resetPigeon() {
    pigeon.x = 100;
    pigeon.y = canvas.height / 2;
    pigeon.velocity = 0;
    pigeon.angle = 0;
    pigeon.flapping = false;
    pigeon.flapTime = 0;
}

// 开始游戏
function startGame() {
    // 隐藏开始界面
    document.getElementById('startScreen').classList.add('hidden');
    
    // 设置游戏状态为进行中
    gameState = GAME_STATE.PLAYING;
    
    // 重置游戏元素
    resetPigeon();
    pipes = [];
    score = 0;
    document.getElementById('currentScore').textContent = score;
    
    // 启动游戏循环
    gameLoopId = requestAnimationFrame(gameLoop);
    
    // 启动管道生成器
    pipeGeneratorId = setInterval(generatePipe, config.pipeInterval);
}

// 重新开始游戏
function restartGame() {
    // 隐藏结束界面
    document.getElementById('endScreen').classList.add('hidden');
    
    // 停止所有计时器
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    if (pipeGeneratorId) {
        clearInterval(pipeGeneratorId);
    }
    
    // 开始新游戏
    startGame();
}

// 游戏结束
function gameOver() {
    // 设置游戏状态为结束
    gameState = GAME_STATE.GAME_OVER;
    
    // 停止所有计时器
    cancelAnimationFrame(gameLoopId);
    clearInterval(pipeGeneratorId);
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pigeonHighScore', highScore);
    }
    
    // 显示结束界面
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('endScreen').classList.remove('hidden');
}

// 处理键盘按下事件
function handleKeyDown(e) {
    if (e.code === 'Space' && gameState === GAME_STATE.PLAYING) {
        e.preventDefault();
        jump();
    }
}

// 处理鼠标点击事件
function handleClick() {
    if (gameState === GAME_STATE.PLAYING) {
        jump();
    }
}

// 处理触摸事件
function handleTouch(e) {
    if (gameState === GAME_STATE.PLAYING) {
        e.preventDefault();
        jump();
    }
}

// 赛鸽跳跃
function jump() {
    pigeon.velocity = config.jumpForce;
    pigeon.flapping = true;
    pigeon.flapTime = 10;
}

// 生成管道
function generatePipe() {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    // 随机生成管道间隙位置
    const gapPosition = Math.random() * (canvas.height - config.groundHeight - config.pipeGap * 2) + config.pipeGap;
    
    // 创建上管道
    const topPipe = {
        x: canvas.width,
        y: 0,
        width: 60,
        height: gapPosition - config.pipeGap / 2,
        passed: false
    };
    
    // 创建下管道
    const bottomPipe = {
        x: canvas.width,
        y: gapPosition + config.pipeGap / 2,
        width: 60,
        height: canvas.height - config.groundHeight - (gapPosition + config.pipeGap / 2),
        passed: false
    };
    
    // 添加到管道数组
    pipes.push(topPipe, bottomPipe);
}

// 更新游戏状态
function updateGame() {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    // 更新赛鸽位置
    pigeon.velocity += config.gravity;
    pigeon.y += pigeon.velocity;
    
    // 更新赛鸽角度
    pigeon.angle = Math.min(Math.max(pigeon.velocity * 0.05, -0.5), 0.5);
    
    // 更新翅膀扇动状态
    if (pigeon.flapping) {
        pigeon.flapTime--;
        if (pigeon.flapTime <= 0) {
            pigeon.flapping = false;
        }
    }
    
    // 检查赛鸽是否碰到地面或天空
    if (pigeon.y - config.pigeonRadius <= 0 || 
        pigeon.y + config.pigeonRadius >= canvas.height - config.groundHeight) {
        gameOver();
        return;
    }
    
    // 更新管道位置
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x -= config.pipeSpeed;
        
        // 检查赛鸽是否穿过管道
        if (!pipes[i].passed && pipes[i].x + pipes[i].width < pigeon.x) {
            // 只计算一次得分（每组管道）
            if (i % 2 === 0) {
                score += config.scoreIncrement;
                document.getElementById('currentScore').textContent = score;
                
                // 添加得分动画效果
                const scoreElement = document.getElementById('currentScore');
                scoreElement.classList.add('score-change');
                setTimeout(() => {
                    scoreElement.classList.remove('score-change');
                }, 300);
            }
            pipes[i].passed = true;
        }
        
        // 检查碰撞
        if (checkCollision(pigeon, pipes[i])) {
            gameOver();
            return;
        }
    }
    
    // 移除屏幕外的管道
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
}

// 检查碰撞
function checkCollision(pigeon, pipe) {
    // 简化的圆形与矩形碰撞检测
    const closestX = Math.max(pipe.x, Math.min(pigeon.x, pipe.x + pipe.width));
    const closestY = Math.max(pipe.y, Math.min(pigeon.y, pipe.y + pipe.height));
    
    const distanceX = pigeon.x - closestX;
    const distanceY = pigeon.y - closestY;
    
    return (distanceX * distanceX + distanceY * distanceY) < (config.pigeonRadius * config.pigeonRadius);
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    drawBackground();
    
    // 绘制赛鸽
    drawPigeon();
    
    // 绘制管道
    drawPipes();
    
    // 绘制地面
    drawGround();
}

// 绘制背景
function drawBackground() {
    // 绘制天空（渐变背景已在CSS中设置）
    
    // 绘制太阳
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 80, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    
    // 绘制云朵
    drawCloud(100, 100, 60);
    drawCloud(300, 150, 80);
    drawCloud(500, 80, 70);
    drawCloud(700, 120, 50);
}

// 绘制云朵
function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y + size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
}

// 绘制赛鸽
function drawPigeon() {
    ctx.save();
    
    // 移动到赛鸽位置并应用旋转
    ctx.translate(pigeon.x, pigeon.y);
    ctx.rotate(pigeon.angle);
    
    // 绘制赛鸽身体
    ctx.beginPath();
    ctx.arc(0, 0, config.pigeonRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#8B4513';
    ctx.fill();
    
    // 绘制赛鸽头部
    ctx.beginPath();
    ctx.arc(config.pigeonRadius * 0.7, -config.pigeonRadius * 0.2, config.pigeonRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#A0522D';
    ctx.fill();
    
    // 绘制赛鸽眼睛
    ctx.beginPath();
    ctx.arc(config.pigeonRadius * 0.9, -config.pigeonRadius * 0.3, config.pigeonRadius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(config.pigeonRadius * 0.95, -config.pigeonRadius * 0.3, config.pigeonRadius * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    
    // 绘制赛鸽嘴巴
    ctx.beginPath();
    ctx.moveTo(config.pigeonRadius * 1.2, -config.pigeonRadius * 0.2);
    ctx.lineTo(config.pigeonRadius * 1.5, -config.pigeonRadius * 0.1);
    ctx.lineTo(config.pigeonRadius * 1.2, 0);
    ctx.fillStyle = '#FFA500';
    ctx.fill();
    
    // 绘制赛鸽翅膀
    if (pigeon.flapping) {
        // 翅膀向上扇动
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
            config.pigeonRadius * 0.5, -config.pigeonRadius * 1.5,
            config.pigeonRadius * 1.5, -config.pigeonRadius * 0.5
        );
        ctx.quadraticCurveTo(
            config.pigeonRadius * 1, -config.pigeonRadius * 0.2,
            0, 0
        );
    } else {
        // 翅膀向下
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
            config.pigeonRadius * 0.5, config.pigeonRadius * 0.5,
            config.pigeonRadius * 1.5, 0
        );
        ctx.quadraticCurveTo(
            config.pigeonRadius * 1, -config.pigeonRadius * 0.1,
            0, 0
        );
    }
    ctx.fillStyle = '#A0522D';
    ctx.fill();
    
    // 绘制赛鸽尾巴
    ctx.beginPath();
    ctx.moveTo(-config.pigeonRadius * 0.7, 0);
    ctx.lineTo(-config.pigeonRadius * 1.2, -config.pigeonRadius * 0.3);
    ctx.lineTo(-config.pigeonRadius * 1.2, config.pigeonRadius * 0.3);
    ctx.closePath();
    ctx.fillStyle = '#8B4513';
    ctx.fill();
    
    ctx.restore();
}

// 绘制管道
function drawPipes() {
    pipes.forEach(pipe => {
        // 绘制管道主体
        ctx.fillStyle = '#228B22';
        ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
        
        // 绘制管道顶部/底部装饰
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(pipe.x - 5, pipe.y, pipe.width + 10, 20);
        
        if (pipe.y === 0) {
            // 上管道的装饰在底部
            ctx.fillRect(pipe.x - 5, pipe.y + pipe.height - 20, pipe.width + 10, 20);
        } else {
            // 下管道的装饰在顶部
            ctx.fillRect(pipe.x - 5, pipe.y, pipe.width + 10, 20);
        }
        
        // 绘制管道内部
        ctx.fillStyle = '#3CB371';
        ctx.fillRect(pipe.x + 10, pipe.y + 20, pipe.width - 20, pipe.height - 40);
    });
}

// 绘制地面
function drawGround() {
    // 绘制地面
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - config.groundHeight, canvas.width, config.groundHeight);
    
    // 绘制草地
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - config.groundHeight, canvas.width, 10);
    
    // 绘制地面纹理
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(i, canvas.height - config.groundHeight + 10, 15, 5);
    }
}

// 游戏主循环
function gameLoop() {
    updateGame();
    drawGame();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// 页面加载完成后初始化游戏
window.addEventListener('load', initGame);