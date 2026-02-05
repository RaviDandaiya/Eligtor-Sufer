import * as THREE from 'three';
import { createRoadCurve } from './Utils.js';

export const THEMES = {
    PURPLE_NEON: {
        roadColor: 0x000510,
        emissiveColor: 0x00aaff,
        fogColor: 0x00020a,
        lightColor: 0x00ffff,
        name: 'Bold Minimal',
        wireframe: true
    },
    WIRE_TUNNEL: {
        roadColor: 0x000000,
        emissiveColor: 0x888888,
        fogColor: 0x000000,
        lightColor: 0xffffff,
        name: 'Classic Wire',
        wireframe: true
    },
    GOLD_RUN: {
        roadColor: 0x221100,
        emissiveColor: 0xffaa00,
        fogColor: 0x110500,
        lightColor: 0xffd700,
        name: 'Gold Run',
        wireframe: true
    },
    BLOODSTREAM: {
        roadColor: 0x220000,
        emissiveColor: 0xff3333,
        fogColor: 0x0a0000,
        lightColor: 0xff6666,
        name: 'Bloodstream',
        wireframe: true
    },
    OUTSIDE_WORLD: {
        roadColor: 0x222222,
        emissiveColor: 0xffffff,
        fogColor: 0x87CEEB, // Sky Blue
        lightColor: 0xffffff,
        name: 'Outside World',
        wireframe: false,
        isTransparent: true
    }
};

export default class World {
    constructor(scene) {
        this.scene = scene;
        this.curve = null;
        this.tubeGeometry = null;
        this.tubeMesh = null;
        this.pointLight = null;
        this.currentTheme = THEMES.PURPLE_NEON;
        this.availableThemes = Object.values(THEMES);
        this.textures = {};

        this.init();
    }

    init() {
        this.curve = createRoadCurve(400, 5);
        const radius = 5;
        this.tubeGeometry = new THREE.TubeGeometry(this.curve, 400, radius, 24, false);

        // 1. HOLO-GRID (Square Wired)
        const squareTexture = (() => {
            const c = document.createElement('canvas');
            c.width = 1024; c.height = 1024;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1024, 1024);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 12;
            const size = 128;
            for (let x = 0; x <= 1024; x += size) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(1024, x); ctx.stroke();
            }
            ctx.fillStyle = '#ffffff';
            for (let x = 0; x <= 1024; x += size) {
                for (let y = 0; y <= 1024; y += size) {
                    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
                }
            }
            const t = new THREE.CanvasTexture(c);
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(4, 1);
            return t;
        })();

        // 2. HEX-WIRED (Classic Retro)
        const hexTexture = (() => {
            const c = document.createElement('canvas');
            c.width = 1024; c.height = 1024;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1024, 1024);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            const r = 64;
            const h = r * Math.sqrt(3);
            const drawHex = (x, y) => {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3;
                    const px = x + r * Math.cos(a);
                    const py = y + r * Math.sin(a);
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath(); ctx.stroke();
            };
            for (let y = 0; y < 1024 + h; y += h) {
                for (let x = 0; x < 1024 + r * 3; x += r * 3) {
                    drawHex(x, y);
                    drawHex(x + r * 1.5, y + h / 2);
                }
            }
            const t = new THREE.CanvasTexture(c);
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(4, 1);
            return t;
        })();

        // 3. VEIN-WIRED (Organic / Bloodstream)
        const veinTexture = (() => {
            const c = document.createElement('canvas');
            c.width = 1024; c.height = 1024;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#050000';
            ctx.fillRect(0, 0, 1024, 1024);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 8;
            for (let i = 0; i < 30; i++) {
                ctx.beginPath();
                let x = Math.random() * 1024;
                ctx.moveTo(x, 0);
                for (let j = 0; j < 5; j++) {
                    x += (Math.random() - 0.5) * 200;
                    ctx.lineTo(x, (j + 1) * 200);
                }
                ctx.stroke();
            }
            const t = new THREE.CanvasTexture(c);
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(2, 1);
            return t;
        })();

    // 4. DIAMOND-WIRED (Gold Run)
        const diamondTexture = (() => {
            const c = document.createElement('canvas');
            c.width = 1024; c.height = 1024;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1024, 1024);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 10;
            const size = 128;
            for (let i = -1024; i < 1024 * 2; i += size) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 1024, 1024); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(i, 1024); ctx.lineTo(i + 1024, 0); ctx.stroke();
            }
            const t = new THREE.CanvasTexture(c);
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(4, 1);
            return t;
        })();

        // 5. OPEN ROAD (Transparent Top)
        const openTexture = (() => {
            const c = document.createElement('canvas');
            c.width = 1024; c.height = 1024;
            const ctx = c.getContext('2d');
            // Transparent background
            ctx.clearRect(0, 0, 1024, 1024);
            
            // Bottom half (Road) - Texture wraps Y. Let's make the middle transparent (top of tube) 
            // and edges solid (bottom of tube). 
            // Actually, usually in standard UV cylinder mapping, the seam is at the back.
            // Let's assume we want the "floor" to be visible.
            
            // Fill "Floor" (0-0.3 and 0.7-1.0 might be the bottom if seam is top, or 0.25-0.75 if seam is bottom)
            // Let's try filling the bottom 50% visually. 
            // In ThreeJS TubeGeometry, it often wraps around. 
            // Let's paint the whole thing with a clear gap in the middle.
            
            ctx.fillStyle = '#222222';
            ctx.fillRect(0, 0, 1024, 1024); // Fill all first
            
            // Clear the "Ceiling"
            ctx.clearRect(0, 256, 1024, 512); // Clear middle 50% horizontally (if V is height)
            
            // Draw Road Lines on the solid parts
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 100, 1024, 20); // Side line
            ctx.fillRect(0, 900, 1024, 20); // Side line (other side)
            
            // Dashed center line? Maybe simple grid
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 5;
            for(let i=0; i<1024; i+=100) {
                 ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(i, 768); ctx.lineTo(i, 1024); ctx.stroke();
            }

            const t = new THREE.CanvasTexture(c);
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(4, 1);
            return t;
        })();

        this.textures = {
            'Bold Minimal': squareTexture,
            'Classic Wire': hexTexture,
            'Bloodstream': veinTexture,
            'Gold Run': diamondTexture,
            'Outside World': openTexture
        };

        const tubeMaterial = new THREE.MeshStandardMaterial({
            map: squareTexture,
            emissiveMap: squareTexture,
            emissive: 0x00aaff,
            emissiveIntensity: 1.0,
            color: 0x000510,
            roughness: 0.2,
            metalness: 0.8,
            side: THREE.BackSide,
            transparent: true // Enable transparency support
        });

        this.tubeMesh = new THREE.Mesh(this.tubeGeometry, tubeMaterial);
        this.scene.add(this.tubeMesh);

        this.scene.fog = new THREE.FogExp2(this.currentTheme.fogColor, 0.02);
        this.scene.background = new THREE.Color(this.currentTheme.fogColor);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        this.pointLight = new THREE.PointLight(this.currentTheme.lightColor, 5, 50);
        this.pointLight.position.set(0, 0, 10);
        this.scene.add(this.pointLight);
    }

    setTheme(themeName) {
        const theme = THEMES[themeName];
        if (!theme) return;
        this.currentTheme = theme;

        const texture = this.textures[theme.name] || this.textures['Bold Minimal'];

        this.tubeMesh.material.emissive.setHex(theme.emissiveColor);
        this.tubeMesh.material.color.setHex(theme.roadColor);
        this.tubeMesh.material.map = texture;
        this.tubeMesh.material.emissiveMap = texture;
        this.tubeMesh.material.wireframe = theme.wireframe;
        this.tubeMesh.material.emissiveIntensity = theme.wireframe ? 2.0 : 1.0;
        
        // Transparency handling for Outside World
        if (theme.isTransparent) {
            this.tubeMesh.material.transparent = true;
            this.tubeMesh.material.opacity = 1.0; // Ensure visible parts are opaque
             // Use alphaTest to handle the clear patches cleanly if needed, or just standard blending
            this.tubeMesh.material.alphaTest = 0.5; 
        } else {
            this.tubeMesh.material.transparent = false;
            this.tubeMesh.material.alphaTest = 0;
        }

        this.scene.fog.color.setHex(theme.fogColor);
        this.scene.background.setHex(theme.fogColor);
        this.pointLight.color.setHex(theme.lightColor);
    }

    update(delta, time) {
        if (this.currentTheme.name === 'Bloodstream') {
            const pulse = 1.0 + Math.sin(time * 2.0) * 0.02;
            this.tubeMesh.scale.set(pulse, pulse, 1.0);
        }
    }
}
