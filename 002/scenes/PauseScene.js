export default class PauseScene extends Phaser.Scene {

    constructor() {
        super("PauseScene");
    }


    create() {
        this.add.rectangle(
            600,
            337,
            500,
            300,
            0x000000,
            0.8
        );

        this.add.text(
            600,
            250,
            "PAUSED",
            {
                fontSize:"60px",
                color:"#ffffff"
            }
        )
        .setOrigin(0.5);

        let resumeButton = this.add.text(
            600,
            400,
            "RESUME",
            {
                fontSize:"40px",
                color:"#00ff00"
            }
        )
        .setOrigin(0.5);

        resumeButton.setInteractive();
        resumeButton.on(
            "pointerdown",
            ()=>{
                console.log("Resume");
                this.scene.stop();
                this.scene.resume("GameplayScene");
            }
        );
    }

}