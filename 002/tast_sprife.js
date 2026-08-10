const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload,
        create,
        update 
    }
};

const game = new Phaser.Game(config);
let cursors;
let keyW;
let keyA;
let keyD;
let keyS;
let player;
let speed = 4; 
let coins;
let score = 0;
let scoreText;
let walls; 
let isGameOver = false; 

let timerEvent;
let timerText;
let initialTime = 45; 

function preload() {
    this.load.spritesheet('player', 'Character_image/t.png', {
        frameWidth: 32,
        frameHeight: 32
    });
    this.load.image('coin','money/coin.png');
    this.load.audio('bite', 'Sound/driken5482-retro-coin-4-236671.mp3');
    this.load.audio('victory', 'Sound/freesound_community-dead-8bit-41400.mp3');
    // 🎵 โหลดเสียงแพ้ (Sad Trombone)
    this.load.audio('lose', 'Sound/u_ss015dykrt-brass-fanfare-with-timpani-and-winchimes-reverberated-146260.mp3');
}

function create() {
    walls = this.add.group();
    walls.add(this.add.rectangle(400, 150, 200, 40, 0xff0000));
    walls.add(this.add.rectangle(150, 300, 40, 200, 0xff0000));
    walls.add(this.add.rectangle(650, 300, 40, 200, 0xff0000));
    walls.add(this.add.rectangle(400, 450, 200, 40, 0xff0000));

    player = this.add.sprite(400, 300, 'player', 0);
    player.setScale(3);

    coins = this.add.group();

    for (let i = 0; i < 4; i++) {
        let coords = getValidLocation();
        let newCoin = coins.create(coords.x, coords.y, 'coin');
        newCoin.setScale(0.15);
        newCoin.setData('lifespan', 4000); 
    }

    cursors = this.input.keyboard.createCursorKeys();
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
        frameRate: 4,     
        repeat: -1      
    });

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 24, end: 31 }),
        frameRate: 8,    
        repeat: -1      
    });

    player.play('idle', true);

    scoreText = this.add.text(20, 20, 'Coins: 0/15', {
        fontSize: '32px',
        color: '#ffffff'
    });

    timerText = this.add.text(600, 20, 'Time: ' + initialTime, {
        fontSize: '32px',
        color: '#ffffff'
    });

    timerEvent = this.time.addEvent({
        delay: 1000,
        callback: onEvent,
        callbackScope: this,
        loop: true
    });
}

function update(time, delta) {
    if (isGameOver) {
        player.play('idle', true);
        return; 
    }

    let isMoving = false;

    if (keyD.isDown || cursors.right.isDown){
        if (player.x < 780) { player.x += speed; }
        player.play('walk', true);
        player.flipX = false;
        isMoving = true;
        if (isColliding(player, walls)) { player.x -= speed; }
    } else if (keyA.isDown || cursors.left.isDown){
        if (player.x > 20) { player.x -= speed; }
        player.play('walk', true);
        player.flipX = true;
        isMoving = true;
        if (isColliding(player, walls)) { player.x += speed; }
    } 

    if (keyW.isDown || cursors.up.isDown){
        if (player.y > 20) { player.y -= speed; }
        player.play('walk', true);
        isMoving = true;
        if (isColliding(player, walls)) { player.y += speed; }
    } else if (keyS.isDown || cursors.down.isDown){
        if (player.y < 580) { player.y += speed; }
        player.play('walk', true);
        isMoving = true;
        if (isColliding(player, walls)) { player.y -= speed; }
    } 

    if (!isMoving) {
        player.play('idle', true);
    }

    coins.children.iterate(function (coin) {
        if (coin) {
            let distance = Phaser.Math.Distance.Between(player.x, player.y, coin.x, coin.y);
            
            if (distance < 50) { 
                score += 1;
                scoreText.setText('Coins: ' + score + '/15'); 
                
                if (score >= 10) {
                    isGameOver = true;
                    timerEvent.destroy(); 
                    
                    this.sound.play('victory');
                    
                    coins.clear(true, true);
                    walls.clear(true, true);
                    scoreText.setVisible(false);
                    timerText.setVisible(false); 
                    
                    player.x = 400;
                    player.y = 350;

                    let winBg = this.add.rectangle(400, 200, 550, 120, 0x000000, 0.7);
                    winBg.setStrokeStyle(4, 0xffff00); 

                    let winText = this.add.text(400, 200, 'Victory!', {
                        fontSize: '36px',
                        color: '#ffff00',
                        fontStyle: 'bold'
                    });
                    winText.setOrigin(0.5); 
                    return;
                } else {
                    this.sound.play('bite');
                    let newCoords = getValidLocation();
                    coin.x = newCoords.x;
                    coin.y = newCoords.y;
                    coin.alpha = 1;
                    coin.setData('lifespan', 4000); 
                }
            }

            let currentLife = coin.getData('lifespan') - delta;
            coin.setData('lifespan', currentLife);

            if (currentLife <= 0) {
                let newCoords = getValidLocation();
                coin.x = newCoords.x;
                coin.y = newCoords.y;
                coin.alpha = 1;
                coin.setData('lifespan', 4000); 
            } 
            else if (currentLife <= 1500) {
                coin.alpha = Math.floor(time / 100) % 2 === 0 ? 0.2 : 1;
            } 
            else {
                coin.alpha = 1;
            }
        }
    }, this);
}

function onEvent() {
    if (isGameOver) return;

    initialTime -= 1; 
    timerText.setText('Time: ' + initialTime);

    if (initialTime <= 0) {
        isGameOver = true;
        timerEvent.destroy(); 

        // 🎵 เล่นเสียงแป๊กตอนแพ้ (Sad Trombone) 
        this.sound.play('lose');

        coins.clear(true, true);
        walls.clear(true, true);
        scoreText.setVisible(false);
        timerText.setVisible(false);

        player.x = 400;
        player.y = 350;

        let gameOverBg = this.add.rectangle(400, 200, 550, 120, 0x000000, 0.7);
        gameOverBg.setStrokeStyle(4, 0xff0000); 

        let gameOverText = this.add.text(400, 200, 'Mission Failed!', {
            fontSize: '36px',
            color: '#ff3333',
            fontStyle: 'bold'
        });
        gameOverText.setOrigin(0.5);
    }
}

function getValidLocation() {
    let valid = false;
    let spawnX, spawnY;
    let attempts = 0;

    while (!valid && attempts < 100) {
        spawnX = Phaser.Math.Between(50, 750);
        spawnY = Phaser.Math.Between(50, 550);
        valid = true;
        attempts++;

        if (walls && walls.getChildren().length > 0) {
            let tempCoinBounds = new Phaser.Geom.Rectangle(spawnX - 15, spawnY - 15, 30, 30);
            
            walls.children.iterate(function (wall) {
                let hitWall = Phaser.Geom.Intersects.RectangleToRectangle(tempCoinBounds, wall.getBounds());
                if (hitWall) { valid = false; }
            });
        }

        if (player) {
            let distToPlayer = Phaser.Math.Distance.Between(player.x, player.y, spawnX, spawnY);
            if (distToPlayer < 150) { valid = false; } 
        }

        if (coins && coins.getChildren().length > 0) {
            coins.children.iterate(function (existingCoin) {
                let distToCoin = Phaser.Math.Distance.Between(existingCoin.x, existingCoin.y, spawnX, spawnY);
                if (distToCoin < 60) { valid = false; }
            });
        }
    }

    return { x: spawnX, y: spawnY };
}
function isColliding(player, wallsGroup) {
    let colliding = false;
    if (wallsGroup && wallsGroup.getChildren().length > 0) {
        wallsGroup.children.iterate(function (wall) {
            if (wall) {
                let hit = Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), wall.getBounds());
                if (hit) { colliding = true; }
            }
        });
    }
    return colliding;
}