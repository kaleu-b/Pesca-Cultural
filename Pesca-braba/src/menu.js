import Phaser from 'phaser';

// Menu inicial com imagem de 'Como Jogar' e botão para iniciar o jogo
export class Menu extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Background com imagem do pier
        this.add.image(width / 2, height / 2, 'telainicial')
            .setDisplaySize(width, height)
            .setOrigin(0.5, 0.5)
            .setDepth(-1);
        
        // Texto introdutório (primeira parte)
        this.add.text(width / 2, height * 0.15, 'Você é um pescador, que ao ver os preciosos tesouros do Museu de São José perdidos no mar, decide pesca-los.', {
            fontSize: '25px',
            fill: '#FFFFFF',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
            wordWrap: { width: width * 0.9 }
        }).setOrigin(0.5, 0.5);

        // Texto instrucional (segunda parte)
        this.add.text(width / 2, height * 0.45, 'Pesque os tesouros, mas evite as baleias e os peixes. Use o mouse ou toque na tela para controlar o anzol.', {
            fontSize: '25px',
            fill: '#FFFFFF',
            fontFamily: 'Arial, sans-serif',
            align: 'center',
            wordWrap: { width: width * 0.9 }
        }).setOrigin(0.5, 0.5);

        // Botão de iniciar (retângulo + texto)
        const btnWidth = Math.min(260, width * 0.7);
        const btnHeight = 54;
        const btnX = width / 2;
        const btnY = Math.round(height * 0.75);

        const startBtn = this.add.rectangle(btnX, btnY, btnWidth, btnHeight, 0x8b5a2b)
            .setOrigin(0.5, 0.5)
            .setStrokeStyle(4, 0x000000)
            .setInteractive({ useHandCursor: true });

        const startText = this.add.text(btnX, btnY, 'Iniciar Jogo', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5, 0.5);

        // Hover visual
        startBtn.on('pointerover', () => startBtn.setFillStyle(0xa66a39));
        startBtn.on('pointerout',  () => startBtn.setFillStyle(0x8b5a2b));

        // Ao clicar inicia a cena principal
        startBtn.on('pointerdown', () => {
            this.scene.start('Play');
        });
    }
}
