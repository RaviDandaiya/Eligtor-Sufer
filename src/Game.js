import * as THREE from 'three';
import World from './World.js';
import Player from './Player.js';
import { AdSystem } from './AdSystem.js';
import { ObstacleSystem } from './ObstacleSystem.js';
import { AudioManager } from './AudioManager.js';

export default class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.distanceElement = document.getElementById('distance');
        this.speedElement = document.getElementById('speed');
        this.progressBar = document.getElementById('progress-bar');
        this.progressIndicator = document.getElementById('progress-indicator');
        this.pauseBtn = document.getElementById('pause-btn');

        this.isPremium = false;
        this.scene = new THREE.Scene();
        // High FOV for speed sensation
        this.camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.score = 0;
        this.level = 0;
        this.lapCount = 0;
        this.lastPlayerProgress = 0;
        this.lapTriggered = false;
        this.selectedTheme = 'PURPLE_NEON';

        this.audio = new AudioManager();

        this.init();
    }

    init() {
        // Setup Renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Setup Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Instances
        this.world = new World(this.scene);
        this.player = new Player(this.scene, this.world);
        // this.adSystem = new AdSystem(this.scene, this.world.curve); // Removed tunnel banners
        this.obstacleSystem = new ObstacleSystem(this.scene, this.world);

        // Camera initial position
        this.camera.position.set(0, 2, 5);

        // Event Listeners
        window.addEventListener('resize', this.onResize.bind(this));

        // Character Selection Logic
        this.selectionScreen = document.getElementById('selection-screen');
        this.confirmBtn = document.getElementById('confirm-selection-btn');
        this.characterOptions = document.querySelectorAll('.character-option');

        this.characterOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                this.characterOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                const themeId = opt.dataset.theme;
                if (themeId) {
                    this.selectedTheme = themeId;
                    this.world.setTheme(themeId);
                    console.log("Selected Theme:", themeId);
                }
            });
        });

        this.confirmBtn.addEventListener('pointerdown', () => {
            console.log("Confirm button clicked!");
            this.selectionScreen.classList.add('hidden');
            this.startScreen.classList.remove('hidden');
            this.startScreen.style.display = 'flex'; // Ensure flex layout for centered buttons
        });

        this.startBtn.addEventListener('pointerdown', this.startGame.bind(this));
        this.pauseBtn.addEventListener('click', () => {
            this.isRunning = !this.isRunning;
            console.log(this.isRunning ? 'Game Resumed' : 'Game Paused');
        });

        // Premium features disabled for now
        // this.premiumBtn.addEventListener('click', () => {
        //     this.enablePremium();
        // });

        // Theme selection removed as requested
        /*
        this.themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.world.setTheme(theme);

                // Update active button
                this.themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        */

        // Mobile Controls Binding
        this.setupMobileControls();

        // Start Loop
        this.animate();
    }

    setupMobileControls() {
        const controls = {
            'control-left': 'ArrowLeft',
            'control-right': 'ArrowRight',
            'control-jump': 'Space'
        };

        Object.entries(controls).forEach(([id, key]) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const handleStart = (e) => {
                // Remove preventDefault as it might interfere on some browsers if not handled carefully
                // e.preventDefault(); 
                this.player.setInput(key, true);
            };

            const handleEnd = (e) => {
                // e.preventDefault();
                this.player.setInput(key, false);
            };

            // Pointer events are the modern standard for touch and mouse
            btn.addEventListener('pointerdown', handleStart);
            btn.addEventListener('pointerup', handleEnd);
            btn.addEventListener('pointerleave', handleEnd);
            btn.addEventListener('pointercancel', handleEnd);

            // Still keep touch prevention if needed for scrolling, but let's test without first
            btn.style.touchAction = 'none';
        });
    }

    enablePremium() {
        if (this.isPremium) return;
        this.isPremium = true;

        console.log("Premium Version Activated!");

        // 1. UI Updates
        this.premiumBadge.classList.remove('hidden');
        this.premiumBtn.classList.add('hidden');
        document.getElementById('ui-layer').classList.add('premium-mode');

        // 2. Visual Upgrades
        // Enhance existing lights
        this.scene.children.forEach(child => {
            if (child.isAmbientLight) child.intensity = 0.8;
            if (child.isDirectionalLight) {
                child.intensity = 1.5;
                child.color.setHex(0xffd700); // Golden light
            }
        });

        // 3. Remove Ads (Optional part of premium)
        if (this.adSystem) {
            this.adSystem.hideAds();
        }

        // 4. Play Premium Sound
        if (this.audio) {
            // We could add a premium jingle here
        }
    }

    startGame() {
        this.audio.init();
        this.audio.startMusic();

        // Hide overlay and show game
        this.startScreen.classList.add('hidden');
        this.startScreen.style.display = 'none';

        // Set initial theme if selected
        this.isRunning = true;
        this.clock.start();

        // Final theme application just in case
        if (this.selectedTheme) {
            this.world.setTheme(this.selectedTheme);
        }

        console.log("Game Started with theme:", this.world.currentTheme ? this.world.currentTheme.name : "Default");
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        if (!this.isRunning) return;

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        this.world.update(delta, time);
        this.player.update(delta, time);

        // Collisions - Fixed to use the player object for absolute fairness
        if (this.obstacleSystem && this.obstacleSystem.checkCollisions(this.player)) {
            console.log("CRASH!");
            this.audio.playCrash();
            this.isRunning = false;
            // Delay reload to let sound play or show UI
            setTimeout(() => {
                alert("GAME OVER! Score: " + Math.floor(this.score));
                location.reload();
            }, 100);
        }

        // Camera Follow Logic - Immersive / Center View
        if (this.player.mesh && this.world.curve) {
            // We want the camera to be positioned relative to the player's progress on the curve,
            // but fixed in the center of the tube (or slightly above player), looking forward.

            const playerPos = this.player.mesh.position;
            const progress = this.player.progress;

            // Get point and tangent at current progress
            const tangent = this.world.curve.getTangentAt(progress).normalize();

            // 1. Position: Slightly behind and above player, but MUCH closer than before.
            // Or completely First Person: purely based on curve point.

            // Let's go for "Cockpit" view: Just above the surfboard.
            // relativeOffset was (0, 2, 4). New: (0, 0.8, 0.5) 
            // Better yet, let's keep it centered in the tube for that "Tunnel Rush" feel.
            // Tunnel Rush camera is often dead center or slightly trailing.

            const relativeOffset = new THREE.Vector3(0, 1.5, 2.0); // Moved back for better view
            const cameraOffset = relativeOffset.applyMatrix4(this.player.mesh.matrixWorld);

            // Smoothly move camera there
            this.camera.position.lerp(cameraOffset, 0.2);

            // 2. Look At: Point further down the track
            // We want to look at the horizon, not the player.
            const lookAheadDist = 0.1; // 10% ahead on curve
            const lookAtProgress = (progress + lookAheadDist) % 1;
            const lookAtPoint = this.world.curve.getPointAt(lookAtProgress);

            this.camera.lookAt(lookAtPoint);
        }

        // Jump Sound (Check player state)
        if (this.player.velocity > 0 && this.player.isJumping && !this.playedJumpSound) {
            this.audio.playJump();
            this.playedJumpSound = true;
        } else if (!this.player.isJumping) {
            this.playedJumpSound = false;
        }

        this.score += delta * 10;
        const currentSpeed = (this.player.speed * 1000).toFixed(1);
        const currentDistance = (this.score).toFixed(1);

        this.speedElement.innerText = `${currentSpeed}m/s`;
        this.distanceElement.innerText = `${currentDistance}m`;

        // Progress bar logic (0 to 100% of lap)
        const progressPercent = this.player.progress * 100;
        this.progressBar.style.width = `${progressPercent}%`;

        // Continuous Speed Increase
        let acceleration = 0.0005; // Very slow acceleration for "chill" vibe

        // Music-synced speed fluctuation in Bloodstream
        if (this.world.currentTheme.name === 'Bloodstream') {
            const beatIntensity = Math.sin(time * 3.0);
            acceleration += beatIntensity * 0.0001;
        }

        this.player.speed += delta * acceleration;

        // Visual feedback for milestones (optional, keeping it simple)
        const currentLevel = Math.floor(this.score / 100);
        if (currentLevel > this.level) {
            this.level = currentLevel;
            console.log(`Speed Up! New Speed: ${this.player.speed.toFixed(4)}`);
            this.showNotification("FASTER!");
        }

        // Lap / Difficulty Logic
        // Detect loop crossing: 0.9 -> 0.1
        if (this.player.progress < 0.2 && this.lastPlayerProgress > 0.8) {
            if (!this.lapTriggered) {
                this.onLapComplete();
                this.lapTriggered = true;
            }
        } else if (this.player.progress > 0.5) {
            // Reset trigger once we are safely past the start
            this.lapTriggered = false;
        }
        this.lastPlayerProgress = this.player.progress;
    }

    onLapComplete() {
        console.log("Lap Complete! Generating new obstacles...");
        this.lapCount++;

        // Cycle through the 4 core themes
        const themes = ['PURPLE_NEON', 'WIRE_TUNNEL', 'GOLD_RUN', 'BLOODSTREAM'];
        const themeIndex = this.lapCount % themes.length;
        this.world.setTheme(themes[themeIndex]);
        this.showNotification(`LEVEL ${this.lapCount + 1}: ${this.world.currentTheme.name}`);

        // Balanced Speed Bump
        this.player.speed += 0.01; // Reduced from 0.02
        console.log(`Speed Bump! New Base Speed: ${this.player.speed.toFixed(4)}`);

        // Increase difficulty based on lap count (obstacle density)
        const difficulty = this.lapCount;
        this.obstacleSystem.nextLevel(difficulty);
    }

    showNotification(text) {
        const notif = document.createElement('div');
        notif.innerText = text;
        notif.style.position = 'absolute';
        notif.style.top = '20%';
        notif.style.left = '50%';
        notif.style.transform = 'translate(-50%, -50%)';
        notif.style.color = '#fff';
        notif.style.fontSize = '48px';
        notif.style.fontWeight = 'bold';
        notif.style.textShadow = '0 0 10px #ff00de';
        notif.style.pointerEvents = 'none';
        notif.style.transition = 'opacity 1s';
        this.container.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 1000);
        }, 1000);
    }

    gameOver() {
        console.log("CRASH!");
        this.audio.playCrash();
        this.isRunning = false;

        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScore = document.getElementById('final-score');
        const gameUI = document.getElementById('game-ui');

        finalScore.innerText = Math.floor(this.score) + "m";

        gameUI.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.style.display = 'flex';

        // Setup Retry Button (one-time logic)
        const retryBtn = document.getElementById('retry-btn');
        retryBtn.onclick = () => {
            location.reload();
        };
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

