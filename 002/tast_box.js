/*const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};*/

let player;
let platforms;
let cursors;
let keyW;
let keyA;
let keyD;
let keyS;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 }, 
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'background/download.jpg');
    this.load.image('ground', 'floor/tile.jpg');
    this.load.image('platform', 'floor/tile.jpg');
    this.load.spritesheet('player', 'Character_image/t.png', {
        frameWidth: 32,
        frameHeight: 32
    });
}

function create() {
    // 1. BACKGROUND
    let bg = this.add.image(400, 350, 'background');
    bg.setDisplaySize(800, 700);
    bg.setTint(0x777777); 

    // 2. PLAYER (Spawned at top-center)
    player = this.physics.add.sprite(400, 50, 'player', 0);
    player.setBounce(0.1); 
    player.setCollideWorldBounds(true);

    // 3. STATIC GROUPS FOR STAGE LAYOUT
    platforms = this.physics.add.staticGroup();

    // Floor Ground
    platforms.create(400, 668, "ground")
        .setScale(1.5625, 0.14) 
        .refreshBody();

    // Support platform right below the player spawn point 
    let blockWidth = 48;
    let blockScale = 0.09375;
    
    for (let block = 0; block < 3; block++) {
        platforms.create(352 + (block * blockWidth), 150, 'platform')
            .setScale(blockScale, blockScale)
            .refreshBody();
    }

    // ==========================================
    // 4. PUT THE FIXED LOOP RIGHT HERE:
    // ==========================================
    let elevations = [220, 310, 400, 490, 580]; 

    for (let i = 0; i < 5; i++) {
        // Pick a random X coordinate for the row
        let startX = Phaser.Math.Between(50, 600);
        
        // Take a guaranteed distinct height from our array
        let groupY = elevations[i];
        
        for (let block = 0; block < 3; block++) {
            platforms.create(startX + (block * blockWidth), groupY, 'platform')
                .setScale(blockScale, blockScale)
                .refreshBody();
        }
    }
    // ==========================================

    // Enable collisions
    this.physics.add.collider(player, platforms);

    // 5. INPUT CONTROLS
    cursors = this.input.keyboard.createCursorKeys();
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    // 6. ANIMATIONS
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
        frameRate: 4,     
        repeat: -1      
    });

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 24, end: 31 }),
        frameRate: 12,    
        repeat: -1      
    });

    this.anims.create({
        key: 'jump_launch',
        frames: this.anims.generateFrameNumbers('player', { start: 40, end: 41 }),
        frameRate: 8,
        repeat: 0
    });

    this.anims.create({
        key: 'jump_mid',
        frames: this.anims.generateFrameNumbers('player', { start: 42, end: 44 }),
        frameRate: 6,
        repeat: -1 
    });

    this.anims.create({
        key: 'jump_land',
        frames: this.anims.generateFrameNumbers('player', { start: 45, end: 48 }),
        frameRate: 10,
        repeat: 0 
    });

    player.play('idle', true);
}

function update() {
    let isMoving = false;
    let runSpeed = 250;
    let jumpPower = -650; // กระโดดสูงขึ้น

    // เดินซ้าย-ขวา
    if (keyD.isDown || cursors.right.isDown) {
        player.setVelocityX(runSpeed);
        player.flipX = false;
        isMoving = true;
    } else if (keyA.isDown || cursors.left.isDown) {
        player.setVelocityX(-runSpeed);
        player.flipX = true;
        isMoving = true;
    } else {
        player.setVelocityX(0);
    }

    // กระโดด
    if ((keyW.isDown || cursors.up.isDown) && player.body.blocked.down) {
        player.setVelocityY(jumpPower);
    }

    // Animation
    if (!player.body.blocked.down) {
        if (player.body.velocity.y < -150) {
            player.play('jump_launch', true);
        } else {
            player.play('jump_mid', true);
        }
    } else {
        if (player.body.wasTouching.down === false) {
            player.play('jump_land', true);
        } else if (
            player.anims.currentAnim &&
            player.anims.currentAnim.key === 'jump_land' &&
            player.anims.isPlaying
        ) {
            // รอเล่น jump_land จบ
        } else if (isMoving) {
            player.play('walk', true);
        } else {
            player.play('idle', true);
        }
    }
}