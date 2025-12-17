import { iniciarJogo } from './main.js';

// Variáveis globais
let gameInstance = null;
let isPaused = false;

// --- Lógica das Abas ---
// page.js - Adicione esta função se ainda não existir
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe active de todos os botões e conteúdos
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
            
            // Adiciona active ao botão clicado
            button.classList.add('active');
            
            // Mostra o conteúdo correspondente
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.remove('hidden');
        });
    });
});

// --- Lógica do Botão de Play ---
const playOverlay = document.getElementById('play-overlay');
const playButton = document.getElementById('play-button');

// Referências UI
const pauseButton = document.getElementById('pause-button');
const iconPause = document.getElementById('icon-pause');
const iconPlay = document.getElementById('icon-play');

const muteButton = document.getElementById('mute-button');
const iconSoundOn = document.getElementById('icon-sound-on');
const iconSoundOff = document.getElementById('icon-sound-off');

// === CORREÇÃO VISUAL ===
// Usamos classes CSS para garantir que o ícone apareça ou suma corretamente
function toggleIcons(showIcon, hideIcon) {
    if (showIcon && hideIcon) {
        showIcon.classList.remove('hidden'); // Remove a classe que esconde
        hideIcon.classList.add('hidden');    // Adiciona a classe que esconde
    }
}

if (playButton) {
    playButton.addEventListener('click', () => {
        playOverlay.classList.remove('active');

        gameInstance = iniciarJogo();

        // Resetar Pause (Mostra icone Pause, Esconde Play)
        isPaused = false;
        toggleIcons(iconPause, iconPlay);
        if (pauseButton) {
            pauseButton.style.backgroundColor = '';
            pauseButton.style.color = '';
        }

        // Resetar Mute (Mostra Som On, Esconde Som Off)
        toggleIcons(iconSoundOn, iconSoundOff);
        if (muteButton) muteButton.style.borderColor = '#415a77';
    });
}

// 1. Lógica de Mute
if (muteButton) {
    muteButton.addEventListener('click', () => {
        if (!gameInstance) return;

        // Inverte o estado
        gameInstance.sound.mute = !gameInstance.sound.mute;

        if (gameInstance.sound.mute) {
            // Ficou MUDO -> Mostra ícone OFF (riscado), esconde ON
            toggleIcons(iconSoundOff, iconSoundOn);
            muteButton.style.borderColor = '#ff0000';
        } else {
            // Ficou COM SOM -> Mostra ícone ON (ondas), esconde OFF
            toggleIcons(iconSoundOn, iconSoundOff);
            muteButton.style.borderColor = '#415a77';
        }

        muteButton.blur();
    });
}

// 2. Lógica de Pause
if (pauseButton) {
    pauseButton.addEventListener('click', () => {
        if (!gameInstance) return;

        const playScene = gameInstance.scene.getScene('Play');
        if (!playScene || !gameInstance.scene.isActive('Play')) {
            if (!isPaused) return;
        }

        isPaused = !isPaused;

        if (isPaused) {
            gameInstance.scene.pause('Play');
            gameInstance.sound.pauseAll();

            // Pausou -> Mostra ícone PLAY (para retomar), esconde PAUSE
            toggleIcons(iconPlay, iconPause);
            pauseButton.style.backgroundColor = '#ffc300';
            pauseButton.style.color = '#000';
        } else {
            gameInstance.scene.resume('Play');
            gameInstance.sound.resumeAll();

            // Retomou -> Mostra ícone PAUSE, esconde PLAY
            toggleIcons(iconPause, iconPlay);
            pauseButton.style.backgroundColor = '';
            pauseButton.style.color = '';
        }

        pauseButton.blur();
    });
}

// --- Fullscreen ---
const fullscreenButton = document.getElementById('fullscreen-button');
const gameWrapper = document.getElementById('game-container-wrapper');

if (fullscreenButton && gameWrapper) {
    fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            gameWrapper.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    });
}
