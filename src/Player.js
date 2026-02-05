import * as THREE from 'three';

export default class Player {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.mesh = new THREE.Group();
        this.progress = 0; // 0 to 1 along the curve
        this.speed = 0.15; // Slowed down from 0.22 for better "live it" feel
        this.rotationAngle = -Math.PI / 2; // Start at Bottom-Center (-90 degrees)
        this.selectedSkin = 'neon';

        // Jump Stats
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = -20;
        this.jumpHeight = 0;

        // Controls
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            Space: false
        };

        this.init();
        this.addEventListeners();
    }

    init() {
        this.mesh = new THREE.Group();
        this.updateCharacterModel();
        this.scene.add(this.mesh);
    }

    updateCharacterModel() {
        // Clear existing
        while (this.mesh.children.length > 0) {
            this.mesh.remove(this.mesh.children[0]);
        }

        // ALWAYS use Crocodile (Probe removed)
        this.createCrocodile();

        // Apply skin-based modifications
        this.applySkin(this.selectedSkin);
    }

    setSkin(skinId) {
        this.selectedSkin = skinId;
        this.updateCharacterModel();
    }

    applySkin(skinId) {
        let mainColor = 0x228b22; // Vibrant Forest Green
        let accentColor = 0xffd700; // GOLDEN EYES by default
        let wireColor = 0x00ff88; // Default Neon Green Wire
        let emissiveIntensity = 1.0;

        if (skinId === 'blood') {
            accentColor = 0xff0000;
            wireColor = 0xff4444;
        } else if (skinId === 'cyber') {
            accentColor = 0xff00ff;
            wireColor = 0xff00ff;
        } else if (skinId === 'gold') {
            mainColor = 0xffd700;
            accentColor = 0xffffff;
            wireColor = 0xffaa00;
            emissiveIntensity = 3.0;
        } else if (skinId === 'neon') {
            accentColor = 0x00ffff;
            wireColor = 0x00ffff;
            emissiveIntensity = 2.0;
        }

        this.mesh.traverse(child => {
            if (child.isMesh && child.userData.part) {
                child.material = child.material.clone();
                if (child.userData.part === 'body') {
                    child.material.color.setHex(mainColor);
                    if (child.material.emissive) child.material.emissive.setHex(0x000000);
                } else if (child.userData.part === 'accent') {
                    child.material.color.setHex(accentColor);
                    if (child.material.emissive) {
                        child.material.emissive.setHex(accentColor);
                        child.material.emissiveIntensity = emissiveIntensity;
                    }
                } else if (child.userData.part === 'wire') {
                    child.material.color.setHex(wireColor);
                }
            } else if (child.isPointLight && child.userData.part === 'accent_light') {
                child.color.setHex(wireColor);
                child.intensity = emissiveIntensity;
            }
        });
    }

    // Absolute Reliability collision proxy - REFINED
    getCollisionBox() {
        const box = new THREE.Box3();
        // Use a very tight core box. Gator is long (Z), so we focus on the center.
        // Shrink slightly more to ensure fairness.
        const size = new THREE.Vector3(0.4, 0.35, 0.8);
        box.setFromCenterAndSize(this.mesh.position, size);
        return box;
    }

    createCrocodile() {
        // Proper Green Crocodile (Clean 2D-Style Graphic look)
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x228b22, // Forest Green
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true // Gives a clean, sharp, "Proper" look
        });

        const ridgeMat = new THREE.MeshStandardMaterial({
            color: 0x32cd32, // Lime Green
            roughness: 0.8,
            flatShading: true
        });

        const eyeMat = new THREE.MeshBasicMaterial({
            color: 0xffd700 // BRIGHT GOLDEN EYES
        });

        // 1. Massive Solid Body
        const bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 1.8);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.25;
        body.userData.part = 'body';
        this.mesh.add(body);

        // 2. Head with Snout
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.25, -0.9);

        const skullGeo = new THREE.BoxGeometry(0.5, 0.35, 0.4);
        const skull = new THREE.Mesh(skullGeo, bodyMat);
        skull.userData.part = 'body';
        headGroup.add(skull);

        const snoutGeo = new THREE.BoxGeometry(0.35, 0.2, 0.8);
        const snout = new THREE.Mesh(snoutGeo, bodyMat);
        snout.position.set(0, -0.05, -0.5);
        snout.userData.part = 'body';
        headGroup.add(snout);

        this.mesh.add(headGroup);

        // 3. Tail
        const tailGeo = new THREE.ConeGeometry(0.25, 1.4, 4);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.rotation.x = -Math.PI / 2;
        tail.position.set(0, 0.2, 1.6);
        tail.userData.part = 'body';
        this.mesh.add(tail);

        // 4. Clean Legs
        const legGeo = new THREE.BoxGeometry(0.2, 0.25, 0.2);
        const legPos = [
            { x: 0.35, z: -0.6 }, { x: -0.35, z: -0.6 },
            { x: 0.35, z: 0.6 }, { x: -0.35, z: 0.6 }
        ];
        legPos.forEach(p => {
            const leg = new THREE.Mesh(legGeo, bodyMat);
            leg.position.set(p.x, 0.1, p.z);
            leg.userData.part = 'body';
            this.mesh.add(leg);
        });

        // 5. Lime Green Ridges
        for (let i = 0; i < 6; i++) {
            const rGeo = new THREE.BoxGeometry(0.12, 0.12, 0.15);
            const r = new THREE.Mesh(rGeo, ridgeMat);
            r.position.set(0, 0.45, -0.5 + i * 0.3);
            r.userData.part = 'accent';
            this.mesh.add(r);
        }

        // 6. GOLDEN EYES
        const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.05);
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(0.15, 0.4, -0.9);
        eyeR.position.set(-0.15, 0.4, -0.9);
        eyeL.userData.part = 'accent';
        eyeR.userData.part = 'accent';
        this.mesh.add(eyeL);
        this.mesh.add(eyeR);
    }


    addEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = true;
            if (e.code === 'Space') this.keys['Space'] = true;
        });
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = false;
            if (e.code === 'Space') this.keys['Space'] = false;
        });
    }

    /**
     * Set input state programmatically (for touch controls)
     * @param {string} key - 'ArrowLeft', 'ArrowRight', or 'Space'
     * @param {boolean} isPressed - Whether the key is pressed
     */
    setInput(key, isPressed) {
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = isPressed;
        }
    }

    update(delta, time) {
        if (!this.world.curve) return;

        // 1. Move Forward
        // We want constant real-world speed, but curve is parametrized 0-1.
        // So we approximate by a small factor. Ideally use getUtoTmapping but simple increment is ok for now.
        const speedFactor = 0.0005;
        let effectiveSpeed = this.speed;

        // Speed boost on Up Arrow (High multiplier)
        if (this.keys.ArrowUp) {
            effectiveSpeed *= 3.0; // 3x faster boost as requested
        }

        this.progress += effectiveSpeed * delta * speedFactor * 100;
        if (this.progress > 1) this.progress = 0; // Loop for now

        // 2. Handle Rotation Input (Increased sensitivity for higher speeds)
        const rotateSpeed = 4.0;
        if (this.keys.ArrowLeft) this.rotationAngle -= rotateSpeed * delta;
        if (this.keys.ArrowRight) this.rotationAngle += rotateSpeed * delta;

        // 2.5 Handle Jump
        if (this.keys.Space && !this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 8;
        }

        if (this.isJumping) {
            this.jumpVelocity += this.gravity * delta;
            this.jumpHeight += this.jumpVelocity * delta;

            if (this.jumpHeight <= 0) {
                this.jumpHeight = 0;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }

        // 3. Compute Position on Curve
        // Get point on curve
        const point = this.world.curve.getPointAt(this.progress);

        // Get tangent to calculate orientation
        const tangent = this.world.curve.getTangentAt(this.progress).normalize();

        // Calculate Normal and Binormal frames to position around the tube
        // Using frenet frames or simple up vector
        const up = new THREE.Vector3(0, 1, 0);
        let axisX = new THREE.Vector3().crossVectors(up, tangent).normalize();
        let axisY = new THREE.Vector3().crossVectors(tangent, axisX).normalize();

        // Rotate the frame based on rotationAngle
        // We want a position offset from 'point' by 'radius' in direction of 'rotationAngle'
        // in the plan perpendicular to 'tangent'.

        // Basis vectors for the cross-section plane
        // We can use the Frenet frames provided by curve.computeFrenetFrames if we precompute,
        // or just construct them on the fly.
        // Let's use a simpler method: 
        // We need a reliable 'normal' for the curve to define 'down' or 'center'. 
        // For a tube, the center is the curve point. check.

        // Create a rotation matrix around the tangent
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(tangent, this.rotationAngle);

        // Initial offset vector (e.g. "Up" relative to curve)
        // We need a stable reference vector. The 'binormal' from Frenet frames is usually good.
        // Let's rely on Three.js standard loop since we don't have frames yet.
        // Simple hack for now: Use an arbitrary vector that isn't parallel to tangent.
        let arbitrary = new THREE.Vector3(0, 1, 0);
        if (Math.abs(tangent.y) > 0.9) arbitrary.set(1, 0, 0);

        // Calculate surface normal (this is strictly purely mathematical Perpendicular)
        const normal = new THREE.Vector3().crossVectors(tangent, arbitrary).normalize();
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

        // Effectively, we want to rotate 'normal' around 'tangent' by 'rotationAngle'.
        const surfaceNormal = normal.clone().applyMatrix4(rotationMatrix);

        // Position = CurvePoint - SurfaceNormal * (TubeRadius - padding)
        // Actually, we want to be ON the wall.
        // If we are INSIDE, we want to be pushed out from center? 
        // The previous implementation was side=BackSide, so we are inside looking out?
        // Or we are running ON the inside surface?
        // Let's assume we are running on the inside surface of a pipe.
        // So position is generated 'Away' from center if we were outside, but we want to stick to the Radius.

        const tubeRadius = 4;
        const playerHeight = 0.5;

        this.mesh.position.copy(point).add(surfaceNormal.clone().multiplyScalar(tubeRadius - playerHeight - this.jumpHeight));

        // Orientation:
        // Up vector of player should point towards center (gravity is reversed/centrifugal) or away?
        // If running on inside, "Up" for player is towards the center of tube.
        // Wait, if I'm surfing on the inside of a pipe, my feet touch the pipe, my head points to center.
        // So player UP = -surfaceNormal.
        // And player Forward = tangent.

        const playerUp = surfaceNormal.clone().negate();
        const lookAtPoint = this.mesh.position.clone().add(tangent);

        this.mesh.matrix.lookAt(this.mesh.position, lookAtPoint, playerUp);
        this.mesh.quaternion.setFromRotationMatrix(this.mesh.matrix);
    }
}
