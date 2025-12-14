import Phaser from 'phaser';
// Define a cena de pré-carregamento que herda da classe Scene do Phaser
export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');  // Chama o construtor da classe pai com o nome da cena
    }

    // Método preload: carrega todos os assets (imagens, sons, etc.)
    preload() {
        console.log("Carregando assets...");
        // Carrega o spritesheet do pescador (imagem com múltiplos quadros)
        this.load.spritesheet('fisher', '/assets/animations/tool_rod.png', {
            frameWidth: 128,   // Largura de cada quadro de animação
            frameHeight: 128   // Altura de cada quadro de animação
        });

        // Carrega a imagem da isca
        this.load.image(
            'bait',  // Chave única para referenciar este asset
            '/assets/fishing-rod-hook-icon-fish-hook-fish-catch-fishing-tip-victim-bait-trap-free-vector-2287970379.jpg'
        );

        // === Carregamento dos peixes ===
        this.load.image('Anchova', '/assets/peixes 16/anchova.png');
        this.load.image('Corvina', '/assets/peixes 16/corvina.png');
        this.load.image('Linguado', '/assets/peixes 16/linguado.png');
        this.load.image('Pampos', '/assets/peixes 16/pampos.png');
        this.load.image('Tainha', '/assets/peixes 16/tainha.png');

        // === Carregamento dos tesouros === 
        this.load.image('Caveira', '/assets/tesouros 32/caveira.png');
        this.load.image('Mascara', '/assets/tesouros 32/mascara.png');
        this.load.image('Relogio', '/assets/tesouros 32/relogio.png');
        this.load.image('Jarro', '/assets/tesouros 32/vaso.png');
        this.load.image('Vaso', '/assets/tesouros 32/vaso2.png');
        this.load.image('Zarabatana', '/assets/tesouros 32/zarabatana.png');

        // === Carregamento dos tesouros maiores ===
        this.load.image('Caveira-grande', '/assets/tesouros 64/caveira.png');
        this.load.image('Mascara-grande', '/assets/tesouros 64/mascara.png');
        this.load.image('Relogio-grande', '/assets/tesouros 64/relogio.png');
        this.load.image('Vaso-grande', '/assets/tesouros 64/vaso2.png');
        this.load.image('Jarro-grande', '/assets/tesouros 64/vaso.png');
        this.load.image('Zarabatana-grande', '/assets/tesouros 64/zarabatana.png');

        // == Carregamento da baleia ===
        this.load.image('Baleia', '/assets/peixes 64/Baleia.png')

        // == Carregamento do píer ===
        this.load.image('pier','/assets/cenario/Trapiche-museu.png')
    
        // == Imagem do menu 'Como Jogar' ===
        // Usa o arquivo presente em public/assets/tela como jogar/como jogar.png
        this.load.image('howToPlay', '/assets/tela como jogar/como jogar.png');

        // Carregamento do ícone de vida ===
        this.load.image('heart', '/assets/ui/heart.png');

        // === EFEITOS DE DANO (GRUNT) ===
        this.load.audio('grunt1', '/assets/sounds/grunt1.wav');
        this.load.audio('grunt2', '/assets/sounds/grunt2.wav');
        this.load.audio('grunt3', '/assets/sounds/grunt3.wav');

        // === EFEITOS DA VARA (SPLASH) ===
        this.load.audio('splash1', '/assets/sounds/splash1.wav');
        this.load.audio('splash2', '/assets/sounds/splash2.wav');

        // === EFEITOS DE TESOURO (COIN/RISE) ===
        // Atenção: Converta .aif para .mp3 se possível!
        this.load.audio('treasure1', '/assets/sounds/Coin01.wav');
        this.load.audio('treasure2', '/assets/sounds/Rise01.wav');
        this.load.audio('treasure3', '/assets/sounds/Rise02.wav');
        this.load.audio('treasure4', '/assets/sounds/Rise03.wav');
        this.load.audio('treasure5', '/assets/sounds/Rise06.wav');
        this.load.audio('treasure6', '/assets/sounds/Rise07.wav');

        // === MÚSICAS DE FUNDO (BGM) ===
        this.load.audio('bgm1', '/assets/sounds/bgm1.mp3');
        this.load.audio('bgm2', '/assets/sounds/bgm2.wav');
        this.load.audio('bgm3', '/assets/sounds/bgm3.mp3');
        this.load.audio('bgm4', '/assets/sounds/bgm4.mp3');
        this.load.audio('bgm5', '/assets/sounds/bgm5.mp3');
        this.load.audio('bgm6', '/assets/sounds/bgm6.mp3');
        this.load.audio('bgm7', '/assets/sounds/bgm7.mp3');

        // === TELAS DE FUNDO ===
        this.load.image('telafinal', '/assets/tela inicial/pier_inicial_teste.jpeg');
        this.load.image('telainicial', '/assets/tela inicial/pier_inicial.png');
    }

    // Método create: executado após o carregamento dos assets
    create() {
        // Inicia a cena do menu (mostra instruções e botão de iniciar)
        this.scene.start('Menu');
        console.log("Assets carregados — entrando no Menu...");
    }
}
