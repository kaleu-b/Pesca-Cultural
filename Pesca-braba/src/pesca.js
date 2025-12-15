import Phaser from 'phaser';

// Define a cena principal do jogo que herda da classe Scene do Phaser
export class Play extends Phaser.Scene {
    constructor() {
        super('Play');  // Define o nome da cena como 'Play'
    }

    // Método create: executado uma vez quando a cena é criada
    create() {
        // Define as listas de sons
        this.hurtSounds = ['grunt1', 'grunt2', 'grunt3'];
        this.splashSounds = ['splash1', 'splash2'];
        this.treasureSounds = ['treasure1', 'treasure2', 'treasure3', 'treasure4', 'treasure5', 'treasure6'];
        this.bgmTracks = ['bgm1', 'bgm2', 'bgm3', 'bgm4', 'bgm5', 'bgm6', 'bgm7'];

        // Lógica da Música de Fundo Aleatória
        // Para qualquer música anterior (caso tenha reiniciado o jogo)
        this.sound.stopAll(); // Para músicas anteriores

        // 1. Recupera qual foi a última música tocada (se houver)
        const lastBgm = this.registry.get('lastBgm');

        // 2. Cria uma lista de músicas possíveis EXCLUINDO a última
        let availableTracks = this.bgmTracks;
        if (lastBgm) {
            availableTracks = this.bgmTracks.filter(track => track !== lastBgm);
        }

        // 3. Sorteia uma música apenas da lista filtrada
        const randomBgmKey = Phaser.Utils.Array.GetRandom(availableTracks);

        // 4. Salva a nova música na memória para a próxima vez
        this.registry.set('lastBgm', randomBgmKey);

        // === AQUI É A MUDANÇA: MAPA DE VOLUMES ===
        const musicVolumes = {
            'bgm5': 0.3,
            'bgm6': 0.3
        };

        // Define o volume (usa 0.4 se não estiver no mapa)
        const finalVolume = musicVolumes[randomBgmKey] !== undefined ? musicVolumes[randomBgmKey] : 0.4;

        // Toca a música
        this.bgMusic = this.sound.add(randomBgmKey, { volume: finalVolume, loop: true });

        if (!this.sound.locked) {
            this.bgMusic.play();
        } else {
            this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
                this.bgMusic.play();
            });
        }
        // Obtém as dimensões da tela

        const width = this.scale.width;
        const height = this.scale.height;

        // === Sistema de Pontuação ===
        this.score = 0;
        this.scoreText = this.add.text(20, 20, 'Pontuação: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(100);

        // === Sistema de Timer ===
        this.gameTime = 180; // 3 minutos em segundos (3 * 60 = 180)
        this.timerText = this.add.text(width - 200, 20, 'Tempo: 03:00', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(100);

        // === Sistema de Vidas ===
        this.lives = 3;  // Jogador começa com 3 vidas
        this.livesGroup = this.add.group();

        // Função para desenhar os corações na tela
        this.drawHearts = () => {
            // Limpa os corações antigos antes de desenhar os novos
            this.livesGroup.clear(true, true);

            // Loop para criar um coração para cada vida restante
            for (let i = 0; i < this.lives; i++) {
                // Posiciona os corações um ao lado do outro (30px + deslocamento)
                const heart = this.add.image(30 + (i * 40), 60, 'heart')
                    .setDisplaySize(30, 30)           // Ajuste o tamanho se precisar
                    .setScrollFactor(0)    // Fixa na tela (HUD)
                    .setDepth(100);        // Garante que fique na frente de tudo

                this.livesGroup.add(heart);
            }
        };

        // Chama a função pela primeira vez para desenhar os 3 corações iniciais
        this.drawHearts();

        // === Criação do fundo com gradiente animado ===
        // Cria uma textura dinâmica usando canvas
        this.bgTexture = this.textures.createCanvas('bgCanvas', width, height);
        // Adiciona a imagem do canvas à cena na posição (0,0)
        this.bgSprite = this.add.image(0, 0, 'bgCanvas').setOrigin(0, 0).setDepth(-2);
        this.waveOffset = 300;  // Valor inicial para animação das ondas

        // === Configuração de escalas relativas ao tamanho da tela ===
        this.playerScale = width / 600;  // Escala proporcional para o pescador
        this.baitScale = this.playerScale * 0.15;  // Escala proporcional para a isca

        // === Criação do pescador ===
        // Posiciona o pescador em um ponto fixo da tela (não depende do pier)
        const fixedPlayerY = height * 0.4;  // Posição fixa: 39% da altura da tela
        this.player = this.add.sprite(width / 2, fixedPlayerY, 'fisher').setScale(this.playerScale);

        // === ADIÇÃO DO PIER ===
        // Carrega a imagem do pier e a posiciona abaixo dos pés do pescador
        this.pier = this.add.image(width / 2, height - 50, 'pier').setOrigin(0.5, 1.3);
        // Ajusta a escala do pier baseado no tamanho da tela
        const pierScale = Math.min(width / 800, height / 600) * 0.6;
        this.pier.setScale(pierScale);
        // Coloca o pier em uma camada abaixo do pescador mas acima do fundo
        this.pier.setDepth(-1);

        // === Criação da hitbox (área de colisão) da isca ===
        // Retângulo vermelho semitransparente para detectar colisões
        this.baitHitbox = this.add.rectangle(width / 2, height / 2, 15, 15, 0xff0000, 0.5);
        this.baitHitbox.setOrigin(0.5, 0.5);  // Define a origem para o centro
        this.baitHitbox.setStrokeStyle(2, 0xffffff);  // Adiciona contorno branco
        this.baitHitbox.setVisible(true);  // Torna visível para debugging

        // === Criação da imagem da isca ===
        // A imagem da isca seguirá a posição da hitbox
        this.bait = this.add.image(this.baitHitbox.x, this.baitHitbox.y, 'bait').setScale(this.baitScale);

        // === Criação da linha de pesca ===
        // Objeto Graphics permite desenhar formas primitivas
        this.line = this.add.graphics();

        // === Define os limites de movimento da isca ===
        this.bounds = {
            left: 10,                    // Limite esquerdo
            right: width - 10,           // Limite direito
            top: this.player.y + 60,     // Limite superior (abaixo do pescador)
            bottom: height - 10          // Limite inferior
        };

        // === Inicialização de variáveis de estado ===
        this.targetPos = { x: this.baitHitbox.x, y: this.baitHitbox.y };  // Posição alvo da isca
        this.lastPointerY = null;        // Última posição Y do cursor
        this.smoothDeltaY = 0;           // Suavização do movimento vertical
        this.smoothRod = { x: this.player.x, y: this.player.y };  // Posição suavizada da vara
        this.isCatching = false;         // Flag para verificar se está pescando
        this.caughtTreasure = null;      // Referência ao tesouro atualmente capturado
        this.catchTriggered = false;     // Flag para controlar trigger único da animação
        this.isInvulnerable = false;     // Flag para período de invulnerabilidade após tomar dano
        this.invulnerabilityTimer = 0;   // Timer para controle de invulnerabilidade
        this.gameEnded = false;          // Flag para indicar se o jogo acabou

        // === AJUSTE: Variáveis de distância otimizadas para a nova posição ===
        this.catchDistance = 80;         // Distância para ativar animação de pesca (aumentada)
        this.collectDistance = 100;      // Distância para coletar tesouros (aumentada)

        // === Configuração de entrada do usuário ===
        // Evento disparado quando o mouse/toque se move
        this.input.on('pointermove', pointer => {
            // Atualiza a posição alvo com a posição do cursor
            this.targetPos.x = pointer.x;
            this.targetPos.y = pointer.y;
        });

        // === Criação das animações do pescador ===

        // Animação de idle (repouso)
        this.anims.create({
            key: 'idle',                 // Nome da animação
            frames: [{ key: 'fisher', frame: 28 }],  // Quadro único
            frameRate: 1,                // Velocidade (quadros por segundo)
            repeat: 0                    // Não repetir
        });

        // Animação de abaixar a vara
        this.anims.create({
            key: 'rod_down',
            frames: this.anims.generateFrameNumbers('fisher', { start: 31, end: 34 }),
            frameRate: 15,
            repeat: 0                    // Não repetir (executa uma vez)
        });

        // Animação de levantar a vara
        this.anims.create({
            key: 'rod_up',
            frames: this.anims.generateFrameNumbers('fisher', { start: 33, end: 36 }),
            frameRate: 15,
            repeat: 0
        });

        // Animação de pescar
        this.anims.create({
            key: 'catch',
            frames: this.anims.generateFrameNumbers('fisher', { start: 29, end: 36 }),
            frameRate: 15,
            repeat: 0
        });

        // === Estado inicial do jogo ===
        this.player.play('idle');        // Inicia com animação de idle
        this.currentAnim = 'idle';       // Registra a animação atual

        // === Configuração de eventos de animação ===
        // Ouvinte disparado quando uma animação termina
        this.player.on('animationcomplete', anim => {
            if (anim.key === 'catch') {
                this.isCatching = false;           // Finaliza o estado de pesca
                this.player.play('idle', true);    // Volta para animação de idle
                this.currentAnim = 'idle';
                // Não reseta catchTriggered aqui - só reseta quando a isca se afastar
            } else if (['rod_down', 'rod_up'].includes(anim.key) && !this.isCatching) {
                this.player.play('idle', true);    // Volta para idle após mover a vara
                this.currentAnim = 'idle';
            }
        });

        // === Grupos para gerenciamento de entidades ===
        this.fishGroup = this.add.group();     // Grupo para armazenar todos os peixes ativos
        this.whaleGroup = this.add.group();    // Grupo para armazenar todas as baleias ativas
        this.treasureGroup = this.add.group(); // Grupo para armazenar todos os tesouros ativos

        // Lista de tipos de peixes disponíveis
        this.fishTypes = ['Anchova', 'Corvina', 'Linguado', 'Pampos', 'Tainha'];
        // Lista de tipos de baleias disponíveis
        this.whaleTypes = ['Baleia'];
        // Lista de tipos de tesouros disponíveis
        this.treasureTypes = ['Caveira', 'Mascara', 'Relogio', 'Vaso', 'Jarro', 'Zarabatana'];
       
        // === Timer para spawn de peixes (PROGRESSIVO) ===
        // Em vez de usar um evento com delay fixo, usamos um agendador
        // que ajusta o intervalo com base no tempo restante do jogo.
        // No início spawnam menos peixes (delay maior) e, quando
        // faltar 30s, alcança a frequência original (900ms).
        this.fishMinDelay = 900;   // delay mínimo (ms) — frequência alvo quando faltar 30s
        this.fishMaxDelay = 2500;  // delay máximo (ms) — mais raro no início
        this.fishSpawnTimer = null;
        this.scheduleNextFishSpawn();

        // === Timer para spawn de baleias ===
        // Cria um evento que chama spawnWhale em intervalos mais longos (mais raro)
        this.time.addEvent({
            delay: 5000,       // A cada 5 segundos (mais raro que peixes)
            callback: this.spawnWhale,
            callbackScope: this,
            loop: true
        });

        // === Timer para spawn de tesouros ===
        // Cria um evento que chama spawnTreasure em intervalos regulares
        this.time.addEvent({
            delay: 2000,       // A cada 2 segundos
            callback: this.spawnTreasure,
            callbackScope: this,
            loop: true
        });

        // === Timer principal do jogo ===
        // Cria um evento que atualiza o timer a cada segundo
        this.timerEvent = this.time.addEvent({
            delay: 1000,       // A cada 1 segundo
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.lastSplashTime = 0;
    }

    // === Função para atualizar o timer ===
    updateTimer() {
        // Se o jogo já acabou, não atualiza o timer
        if (this.gameEnded) return;

        // Reduz o tempo em 1 segundo
        this.gameTime--;

        // Atualiza o texto do timer
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        const timeString = `Tempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timerText.setText(timeString);

        // Efeito visual quando o tempo está acabando (últimos 30 segundos)
        if (this.gameTime <= 30) {
            // Pisca o texto em vermelho
            this.timerText.setFill(this.gameTime % 2 === 0 ? '#ff0000' : '#ffffff');

            // Efeito sonoro ou visual adicional pode ser adicionado aqui
            if (this.gameTime === 30) {
                // Alerta visual para os últimos 30 segundos
                const warningText = this.add.text(
                    this.scale.width / 2,
                    this.scale.height / 2 - 100,
                    'ÚLTIMOS 30 SEGUNDOS!',
                    {
                        fontSize: '36px',
                        fill: '#ff0000',
                        fontFamily: 'Arial, sans-serif',
                        stroke: '#000000',
                        strokeThickness: 6,
                        align: 'center'
                    }
                ).setOrigin(0.5).setDepth(150);

                // Remove o texto de aviso após 2 segundos
                this.time.delayedCall(2000, () => {
                    warningText.destroy();
                });
            }
        }

        // Verifica se o tempo acabou
        if (this.gameTime <= 0) {
            this.timeUp();
        }
    }

    // === Função quando o tempo acaba ===
    timeUp() {
        // Para o timer
        this.timerEvent.remove();

        // Chama a função de finalização do jogo
        this.endGame('Tempo Esgotado!');
    }

    // === Função para verificar colisões com inimigos ===
    checkEnemyCollisions() {
        // Se o jogo acabou, não verifica colisões
        if (this.gameEnded) return;

        // Só verifica colisões se não estiver invulnerável
        if (this.isInvulnerable) return;

        const baitBounds = this.baitHitbox.getBounds();

        // Verifica colisão com peixes
        this.fishGroup.getChildren().forEach(fish => {
            const fishHitbox = fish.getData('hitbox');
            if (fishHitbox) {
                const fishBounds = fishHitbox.getBounds();
                if (Phaser.Geom.Rectangle.Overlaps(baitBounds, fishBounds)) {
                    this.takeDamage(1, 'peixe');
                    return; // Sai da função após uma colisão
                }
            }
        });

        // Verifica colisão com baleias
        this.whaleGroup.getChildren().forEach(whale => {
            const whaleHitbox = whale.getData('hitbox');
            if (whaleHitbox) {
                const whaleBounds = whaleHitbox.getBounds();
                if (Phaser.Geom.Rectangle.Overlaps(baitBounds, whaleBounds)) {
                    this.takeDamage(1, 'baleia');
                    return; // Sai da função após uma colisão
                }
            }
        });
    }

    // === Função para tomar dano ===
    takeDamage(damage, enemyType) {
        // Reduz vidas
        this.lives -= damage;
        this.drawHearts();

        // TOCA SOM ALEATÓRIO DE DANO (GRUNT)
        const randomHurtSfx = Phaser.Utils.Array.GetRandom(this.hurtSounds);
        this.sound.play(randomHurtSfx, { volume: 0.8 });

        // Efeito visual de dano
        const damageText = this.add.text(
            this.player.x,
            this.player.y - 80,
            `-${damage} vida!`,
            {
                fontSize: '20px',
                fill: '#ff0000',
                fontFamily: 'Arial, sans-serif',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setDepth(100);

        // Animação do texto de dano
        this.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });

        // Efeito visual no pescador (piscar)
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 0;

        // Efeito de piscar
        const blinkInterval = setInterval(() => {
            this.player.setAlpha(this.player.alpha === 1 ? 0.3 : 1);
        }, 100);

        // Remove o efeito após 2 segundos
        setTimeout(() => {
            clearInterval(blinkInterval);
            this.player.setAlpha(1);
            this.isInvulnerable = false;
        }, 2000);

        // Verifica se o jogo acabou
        if (this.lives <= 0) {
            this.endGame('Game Over');
        }
    }

    // === Função de finalização do jogo (para tempo ou vidas) ===
    endGame(reason) {
        // Previne qualquer ação adicional
        this.isCatching = true;
        this.isInvulnerable = true;
        this.gameEnded = true;
        let finalText = "";
        // === Para todos os timers de spawn ===
        this.time.removeAllEvents();

        // === Remove todas as entidades ===
        this.removeAllEntities();

        // === Remove a capacidade de mover a isca ===
        this.input.off('pointermove');
        this.input.on('pointermove', () => {
            // Não faz nada - impede o movimento da isca
        });

        // Determina o título baseado no motivo do fim do jogo
        let title = 'GAME OVER';
        if (reason === 'Tempo Esgotado!') {
            title = 'TEMPO ESGOTADO!';
        }

        if(this.score >= 1000 && this.lives > 0){
            // Efeito visual de final do jogo
            
        // Background com imagem do pier
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'telafinal')
            .setDisplaySize(this.scale.width, this.scale.height)
            .setOrigin(0.5, 0.5)
            .setDepth(199);
            
            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                `Parabéns Pescador! \nVocê resgatou todos\n os tesouros do museu!\n\nPontuação Final: ${this.score}\n\nClique para jogar novamente`,
                {
                    fontSize: '32px',
                    fill: '#FFFFFF',
                    fontFamily: 'Arial, sans-serif',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center'
                }
            ).setOrigin(0.5).setDepth(200);
        } else if(this.lives <= 0){
            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                `Você pescou muitos \npeixes. \n\nClique para jogar novamente`,
                {
                    fontSize: '32px',
                    fill: '#ff0000',
                    fontFamily: 'Arial, sans-serif',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center'
                }
            ).setOrigin(0.5).setDepth(200);
        } else {
            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                `Você não pescou \ntesouros o suficiente. \n\nClique para jogar novamente`,
                {
                    fontSize: '32px',
                    fill: '#ff0000',
                    fontFamily: 'Arial, sans-serif',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center'
                }
            ).setOrigin(0.5).setDepth(200);
        }
        // Adiciona evento de clique para reiniciar
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });

        // Também permite reiniciar com a tecla espaço
        this.input.keyboard?.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }

    // === Função para remover todas as entidades ===
    removeAllEntities() {
        // Remove todos os peixes
        this.fishGroup.getChildren().forEach(fish => {
            const fishHitbox = fish.getData('hitbox');
            if (fish && fish.active) fish.destroy();
            if (fishHitbox && fishHitbox.active) fishHitbox.destroy();
        });
        this.fishGroup.clear(true, true);

        // Remove todas as baleias
        this.whaleGroup.getChildren().forEach(whale => {
            const whaleHitbox = whale.getData('hitbox');
            if (whale && whale.active) whale.destroy();
            if (whaleHitbox && whaleHitbox.active) whaleHitbox.destroy();
        });
        this.whaleGroup.clear(true, true);

        // Remove todos os tesouros
        this.treasureGroup.getChildren().forEach(treasure => {
            const treasureHitbox = treasure.getData('hitbox');
            if (treasure && treasure.active) treasure.destroy();
            if (treasureHitbox && treasureHitbox.active) treasureHitbox.destroy();
        });
        this.treasureGroup.clear(true, true);

        // Limpa a referência do tesouro capturado
        this.caughtTreasure = null;
    }

    // === Função para spawnar um peixe ===
    spawnFish() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Escolhe um peixe aleatório da lista
        const fishKey = Phaser.Utils.Array.GetRandom(this.fishTypes);

        // Define posição inicial fora da tela (esquerda ou direita)
        const fromLeft = Phaser.Math.Between(0, 1) === 0;
        const x = fromLeft ? -20 : width + 20;
        // AJUSTE: Área de spawn otimizada para nova posição do pescador
        const y = Phaser.Math.Between(this.player.y + 100, height - 50);

        // Cria o sprite do peixe
        const fish = this.add.image(x, y, fishKey).setScale(1.0);

        // === Criação da hitbox do peixe ===
        // Cria um retângulo vermelho semitransparente para a hitbox do peixe
        const fishHitbox = this.add.rectangle(fish.x, fish.y, fish.width, fish.height, 0xff0000, 0.4);
        fishHitbox.setOrigin(0.5, 0.5);  // Define a origem para o centro
        fishHitbox.setStrokeStyle(2, 0xff0000);  // Adiciona contorno vermelho
        fishHitbox.setVisible(true);  // Torna visível para debugging

        // Se vier da direita, inverte o sprite (espelhado)
        if (!fromLeft) {
            fish.setFlipX(true);
        }

        // Define velocidade aleatória para peixes (mais rápida)
        const speed = Phaser.Math.Between(50, 100);

        // Adiciona o peixe ao grupo com suas propriedades
        this.fishGroup.add(fish);
        fish.setData('speed', speed * (fromLeft ? 1 : -1));
        fish.setData('hitbox', fishHitbox);  // Armazena a hitbox associada a este peixe
    }

    // === Função para spawnar uma baleia ===
    spawnWhale() {
        // 20% de chance de spawnar uma baleia
        if (Phaser.Math.Between(1, 100) < 20) {
            const width = this.scale.width;
            const height = this.scale.height;

            // Escolhe uma baleia aleatória da lista
            const whaleKey = Phaser.Utils.Array.GetRandom(this.whaleTypes);

            // Define posição inicial fora da tela (esquerda ou direita)
            const fromLeft = Phaser.Math.Between(0, 1) === 0;
            const x = fromLeft ? -50 : width + 50;
            // AJUSTE: Baleias spawnam em área mais adequada
            const y = Phaser.Math.Between(this.player.y + 150, height - 80);

            // Cria o sprite da baleia
            const whale = this.add.image(x, y, whaleKey).setScale(1.0);

            // === Criação da hitbox da baleia ===
            // Cria um retângulo azul semitransparente para a hitbox da baleia
            const whaleHitbox = this.add.rectangle(whale.x, whale.y, whale.width, whale.height, 0x0000ff, 0.4);
            whaleHitbox.setOrigin(0.5, 0.5);  // Define a origem para o centro
            whaleHitbox.setStrokeStyle(2, 0x0000ff);  // Adiciona contorno azul
            whaleHitbox.setVisible(true);  // Torna visível para debugging

            // Se vier da direita, inverte o sprite (espelhado)
            if (!fromLeft) {
                whale.setFlipX(true);
            }

            // Define velocidade para baleias (mais lenta que peixes)
            const speed = Phaser.Math.Between(20, 40);  // Velocidade menor que peixes

            // Adiciona a baleia ao grupo com suas propriedades
            this.whaleGroup.add(whale);
            whale.setData('speed', speed * (fromLeft ? 1 : -1));
            whale.setData('hitbox', whaleHitbox);  // Armazena a hitbox associada a esta baleia
        }
    }

    // === Função para spawnar tesouros ===
    spawnTreasure() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Escolhe um tesouro aleatório da lista
        const treasureKey = Phaser.Utils.Array.GetRandom(this.treasureTypes);

        // Define posição inicial fora da tela (esquerda ou direita)
        const fromLeft = Phaser.Math.Between(0, 1) === 0;
        const x = fromLeft ? -30 : width + 30;
        // AJUSTE: Tesouros spawnam em área mais adequada
        const y = Phaser.Math.Between(this.player.y + 120, height - 70);

        // Cria o sprite do tesouro
        const treasure = this.add.image(x, y, treasureKey).setScale(1.0);

        // === Criação da hitbox do tesouro ===
        // Cria um retângulo verde semitransparente para a hitbox do tesouro (80% do tamanho do sprite)
        const treasureHitbox = this.add.rectangle(
            treasure.x,
            treasure.y,
            treasure.width * 0.8,
            treasure.height * 0.8,
            0x00ff00,
            0.4
        );
        treasureHitbox.setOrigin(0.5, 0.5);  // Define a origem para o centro
        treasureHitbox.setStrokeStyle(2, 0x00ff00);  // Adiciona contorno verde
        treasureHitbox.setVisible(true);  // Torna visível para debugging

        // Se vier da direita, inverte o sprite (espelhado)
        if (!fromLeft) {
            treasure.setFlipX(true);
        }

        // Define velocidade para tesouros
        const speed = Phaser.Math.Between(30, 60);

        // Adiciona o tesouro ao grupo com suas propriedades
        this.treasureGroup.add(treasure);
        treasure.setData('speed', speed * (fromLeft ? 1 : -1));
        treasure.setData('hitbox', treasureHitbox);  // Armazena a hitbox associada a este tesouro
        treasure.setData('isCaught', false);  // Estado inicial: não capturado
        treasure.setData('value', 50);  // Valor aleatório entre 10-50 pontos
    }
    //== Função que mostra o tesouro capturado ==
    // Deve mostrar o tesouro capturado pelo pescador em cima da tela, com um texto indicando o nome do tesouro
    showTreasure(){
        if(this.caughtTreasure){
            // Mostra o nome do tesouro capturado
            const treasureName = this.caughtTreasure.texture.key;
            const treasureText = this.add.text(
                this.scale.width / 2,
                80,
                `Tesouro Capturado: ${treasureName}`,
                {
                    fontSize: '20px',
                    fill: '#ffff00',
                    fontFamily: 'Arial, sans-serif',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center'
                }
            ).setOrigin(0.5).setDepth(150);

            // Cria a imagem do tesouro pequeno abaixo do texto
            const treasureImage = this.add.image(this.scale.width / 2, 150, this.caughtTreasure.texture.key + "-grande" ).setScale(1).setDepth(150);

            // Remove o texto e a imagem após 2 segundos
            this.time.delayedCall(1500, () => {
                treasureText.destroy();
                treasureImage.destroy();
            });
        }
    }

    // === CÁLCULO E AGENDAMENTO PROGRESSIVO DO SPAWN DE PEIXES ===
    // Calcula o delay em ms com base no tempo restante do jogo.
    computeFishDelay() {
        // Mapeia linearmente gameTime (segundos) de [180..30] para delay [fishMaxDelay..fishMinDelay]
        const gameTime = typeof this.gameTime === 'number' ? this.gameTime : 0;
        const start = 180; // início do jogo (segundos)
        const end = 30;    // ponto em que queremos atingir a frequência mínima
        const minDelay = this.fishMinDelay || 1000;
        const maxDelay = this.fishMaxDelay || 2500;

        // Normaliza entre 0 e 1
        const t = Phaser.Math.Clamp((gameTime - end) / (start - end), 0, 1);
        // Quando t == 1 -> início do jogo -> delay = maxDelay (mais raro)
        // Quando t == 0 -> chegada em end -> delay = minDelay (mais frequente)
        // Mapeia t de forma que no início usemos delay maior e no final delay menor
        return Math.round(minDelay + t * (maxDelay - minDelay));
    }

    // Agenda o próximo spawn de peixe de maneira recursiva
    scheduleNextFishSpawn() {
        if (this.gameEnded) return;
        const delay = this.computeFishDelay();
        // Armazena referência para poder cancelar, se necessário
        this.fishSpawnTimer = this.time.delayedCall(delay, () => {
            if (this.gameEnded) return;
            this.spawnFish();
            // Agenda o próximo
            this.scheduleNextFishSpawn();
        }, [], this);
    }

    // === Atualização da linha de pesca ===
    updateFishingLine() {
        // Limpa o desenho anterior da linha
        this.line.clear();
        // Define o estilo da linha (espessura, cor, alpha)
        this.line.lineStyle(1.3, 0xffffff, 2);
        // Move para a posição da ponta da vara
        this.line.moveTo(this.smoothRod.x, this.smoothRod.y);
        // Desenha linha até a isca
        this.line.lineTo(this.baitHitbox.x, this.baitHitbox.y);
        // Aplica o traço
        this.line.strokePath();
    }

    // === Atualização dos peixes ===
    updateFish() {
        const width = this.scale.width;
        // Move cada peixe e remove se sair da tela
        this.fishGroup.getChildren().forEach(fish => {
            // Obtém a velocidade armazenada nos dados do peixe
            const speed = fish.getData('speed');
            // Obtém a hitbox associada ao peixe
            const fishHitbox = fish.getData('hitbox');

            // Move o peixe baseado na velocidade e tempo delta
            fish.x += speed * (this.game.loop.delta / 1000);

            // Move a hitbox junto com o peixe
            if (fishHitbox) {
                fishHitbox.x = fish.x;
                fishHitbox.y = fish.y;
            }

            // Remove peixes que saíram da tela
            if ((speed > 0 && fish.x > width + 100) || (speed < 0 && fish.x < -100)) {
                // Destroi tanto o peixe quanto sua hitbox
                fish.destroy();
                if (fishHitbox) fishHitbox.destroy();
            }
        });
    }

    // === Atualização das baleias ===
    updateWhales() {
        const width = this.scale.width;
        // Move cada baleia e remove se sair da tela
        this.whaleGroup.getChildren().forEach(whale => {
            // Obtém a velocidade armazenada nos dados da baleia
            const speed = whale.getData('speed');
            // Obtém a hitbox associada à baleia
            const whaleHitbox = whale.getData('hitbox');

            // Move a baleia baseado na velocidade e tempo delta
            whale.x += speed * (this.game.loop.delta / 1000);

            // Move a hitbox junto com a baleia
            if (whaleHitbox) {
                whaleHitbox.x = whale.x;
                whaleHitbox.y = whale.y;
            }

            // Remove baleias que saíram da tela
            if ((speed > 0 && whale.x > width + 150) || (speed < 0 && whale.x < -150)) {
                // Destroi tanto a baleia quanto sua hitbox
                whale.destroy();
                if (whaleHitbox) whaleHitbox.destroy();
            }
        });
    }

    // === Atualização dos tesouros ===
    updateTreasures() {
        const width = this.scale.width;

        // Processa cada tesouro no grupo
        this.treasureGroup.getChildren().forEach(treasure => {
            const speed = treasure.getData('speed');
            const treasureHitbox = treasure.getData('hitbox');
            const isCaught = treasure.getData('isCaught');

            if (!isCaught) {
                // Tesouro não capturado: move normalmente
                treasure.x += speed * (this.game.loop.delta / 1000);

                // Move a hitbox junto com o tesouro
                if (treasureHitbox) {
                    treasureHitbox.x = treasure.x;
                    treasureHitbox.y = treasure.y;
                }
                
                // Se já tem um tesouro capturado, retorna e não deixa capturar outro tesouro
                if (this.caughtTreasure) return;

                // Verifica colisão com a isca usando overlap de retângulos
                const baitBounds = this.baitHitbox.getBounds();
                const treasureBounds = treasureHitbox.getBounds();

                // Se houve colisão entre a isca e o tesouro
                if (Phaser.Geom.Rectangle.Overlaps(baitBounds, treasureBounds)) {
                    treasure.setData('isCaught', true);  // Marca como capturado
                    this.caughtTreasure = treasure;      // Armazena referência

                    // Efeito visual de captura (amarelo)
                    treasure.setTint(0xffff00);
                    treasureHitbox.setFillStyle(0xffff00, 0.5);
                }
            } else {
                // Tesouro capturado: segue a isca
                treasure.x = this.baitHitbox.x;
                treasure.y = this.baitHitbox.y + 20;  // Offset para ficar abaixo da isca

                // Move a hitbox junto com o tesouro
                if (treasureHitbox) {
                    treasureHitbox.x = treasure.x;
                    treasureHitbox.y = treasure.y;
                }
                
                // AJUSTE: Verifica se chegou perto do pescador para coleta
                const distToPlayer = Phaser.Math.Distance.Between(
                    treasure.x, treasure.y,
                    this.player.x, this.player.y
                );
                
                // AJUSTE: Distância de coleta aumentada para nova posição
                if (distToPlayer < this.collectDistance) {
                    this.collectTreasure(treasure);
                }
            }

            // Remove tesouros que saíram da tela (apenas os não capturados)
            if (!isCaught && ((speed > 0 && treasure.x > width + 100) || (speed < 0 && treasure.x < -100))) {
                treasure.destroy();
                if (treasureHitbox) treasureHitbox.destroy();
            }
        });
    }

    // === Função para coletar tesouro ===
    collectTreasure(treasure) {
        const treasureValue = treasure.getData('value');
        const treasureHitbox = treasure.getData('hitbox');

        // Adiciona pontuação
        this.score += treasureValue;
        this.scoreText.setText(`Pontuação: ${this.score}`);

        // TOCA SOM ALEATÓRIO DE TESOURO
        const randomTreasureSfx = Phaser.Utils.Array.GetRandom(this.treasureSounds);
        this.sound.play(randomTreasureSfx, { volume: 0.6 });

        this.showTreasure();

        // Efeito visual de coleta - texto flutuante
        const collectText = this.add.text(
            this.player.x,
            this.player.y - 50,
            `+${treasureValue}`,
            {
                fontSize: '20px',
                fill: '#ffff00',
                fontFamily: 'Arial, sans-serif',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setDepth(100);

        // Animação do texto flutuante (sobe e desaparece)
        this.tweens.add({
            targets: collectText,
            y: collectText.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                collectText.destroy();
            }
        });

        // Remove o tesouro e sua hitbox
        treasure.destroy();
        if (treasureHitbox) treasureHitbox.destroy();

        // Limpa a referência do tesouro capturado
        if (this.caughtTreasure === treasure) {
            this.caughtTreasure = null;
        }
    }

    // === Atualização do fundo animado ===
    updateBackground(width, height) {
        this.waveOffset += 0.01;  // Incrementa o offset para animação
        const canvas = this.textures.get('bgCanvas').getSourceImage();
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);  // Limpa o canvas

        // Cria um gradiente linear com cores que variam com o tempo
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        const lightness = 50 + Math.sin(this.waveOffset) * 10;
        const darkLightness = 20 + Math.sin(this.waveOffset + Math.PI / 2) * 10;
        gradient.addColorStop(0, `hsl(200, 80%, ${lightness}%)`);
        gradient.addColorStop(1, `hsl(220, 80%, ${darkLightness}%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        this.textures.get('bgCanvas').refresh();  // Atualiza a textura
    }

    // === Atualização da posição da isca ===
    updateBait() {
        // === Movimento da hitbox da isca ===
        if (!this.targetPos) return;

        // Limita a posição alvo aos limites definidos
        const clampedX = Phaser.Math.Clamp(this.targetPos.x, this.bounds.left, this.bounds.right);
        const clampedY = Phaser.Math.Clamp(this.targetPos.y, this.bounds.top, this.bounds.bottom);

        // Suaviza o movimento usando interpolação linear
        const smoothFactor = 0.10;
        this.baitHitbox.x = Phaser.Math.Linear(this.baitHitbox.x, clampedX, smoothFactor);
        this.baitHitbox.y = Phaser.Math.Linear(this.baitHitbox.y, clampedY, smoothFactor);

        // A imagem da isca segue a hitbox
        this.bait.x = this.baitHitbox.x;
        this.bait.y = this.baitHitbox.y;
    }

    // === Atualização das animações do pescador ===
    updateRodAnimation() {
        // === Detecção de movimento vertical para animações ===
        if (this.lastPointerY !== null && !this.isCatching) {
            const deltaY = this.baitHitbox.y - this.lastPointerY;  // Diferença de posição Y
            const threshold = 2.5;  // Limite mínimo para considerar movimento
            // Suaviza a diferença para evitar animações tremulas
            this.smoothDeltaY = this.smoothDeltaY * 0.7 + deltaY * 0.3;

            // Decide qual animação reproduzir baseada no movimento
            if (this.smoothDeltaY > threshold && this.currentAnim !== 'rod_down') {
                this.player.play('rod_down', true);  // Move vara para baixo
                this.currentAnim = 'rod_down';
                const now = this.time.now; // Pega o tempo atual do jogo
                if (now - this.lastSplashTime > 1000) { // Só entra se passou 300ms
                    const randomSplash = Phaser.Utils.Array.GetRandom(this.splashSounds);
                    this.sound.play(randomSplash, { volume: 0.5 });

                    this.lastSplashTime = now; // Atualiza a hora do último som
                }
            } else if (this.smoothDeltaY < -threshold && this.currentAnim !== 'rod_up') {
                this.player.play('rod_up', true);    // Move vara para cima
                this.currentAnim = 'rod_up';
            } else if (Math.abs(this.smoothDeltaY) <= threshold && this.currentAnim !== 'idle') {
                this.player.play('idle', true);      // Volta ao repouso
                this.currentAnim = 'idle';
            }
        }
        this.lastPointerY = this.baitHitbox.y;  // Armazena a posição atual para o próximo frame
    }

    // === VERIFICAÇÃO DE CAPTURA AJUSTADA ===
    checkCatch() {
        // === Verificação de captura (quando a isca está perto do pescador) ===
        const dist = Phaser.Math.Distance.Between(
            this.baitHitbox.x, this.baitHitbox.y,
            this.player.x, this.player.y
        );
        
        // AJUSTE: Usa a distância variável otimizada para nova posição
        // Só ativa a animação se estiver perto, não tiver sido triggerada ainda, e não estiver em catch
        if (dist < this.catchDistance && !this.catchTriggered && !this.isCatching && this.currentAnim !== 'catch') { 
            this.isCatching = true;           // Ativa estado de pesca
            this.catchTriggered = true;       // Marca que já foi ativada (trigger único)
            this.player.play('catch', true);  // Reproduz animação de pescar
            this.currentAnim = 'catch';
        }
        
        // AJUSTE: Reseta o trigger quando a isca se afastar (permite nova ativação)
        if (dist >= this.catchDistance && this.catchTriggered && !this.isCatching) {
            this.catchTriggered = false;
        }
    }

    // === Atualização da vara e da linha ===
    updateRodAndLine(width) {
        // Fatores de escala para adaptar a diferentes tamanhos de tela
        const scaleFactor = this.player.scaleX;
        const widthFactor = width / 800;

        // Posição alvo da ponta da vara (depende da animação atual)
        let playerRodX = this.player.x;
        let playerRodY = this.player.y;

        // Ajusta a posição da ponta da vara baseado na animação
        switch (this.currentAnim) {
            case 'idle':
                playerRodX += 7 * scaleFactor * widthFactor;
                playerRodY -= 47 * scaleFactor * widthFactor;
                break;
            case 'rod_down':
            case 'rod_up':
            case 'catch':
                playerRodX += 40 * scaleFactor * widthFactor;
                playerRodY += 5 * scaleFactor * widthFactor;
                break;
        }

        // Suaviza o movimento da ponta da vara
        this.smoothRod.x = Phaser.Math.Linear(this.smoothRod.x, playerRodX, 0.90);
        this.smoothRod.y = Phaser.Math.Linear(this.smoothRod.y, playerRodY, 0.90);

        // Atualiza a linha de pesca
        this.updateFishingLine();
    }

    // Método update: executado a cada frame (aproximadamente 60 vezes por segundo)
    update() {
        const width = this.scale.width;
        const height = this.scale.height;

        // === Atualização do fundo animado ===
        this.updateBackground(width, height);

        // === Movimento da hitbox da isca ===
        this.updateBait();

        // === Detecção de movimento vertical para animações ===
        this.updateRodAnimation();

        // === Verificação de captura (quando a isca está perto do pescador) ===
        this.checkCatch();

        // === Atualização da vara e da linha ===
        this.updateRodAndLine(width);

        // === Atualização dos peixes ===
        this.updateFish();

        // === Atualização das baleias ===
        this.updateWhales();

        // === Atualização dos tesouros ===
        this.updateTreasures();

        // === Verificação de colisões com inimigos ===
        this.checkEnemyCollisions();

        // === Atualização do timer de invulnerabilidade ===
        if (this.isInvulnerable) {
            this.invulnerabilityTimer += this.game.loop.delta;
        }
    }
}