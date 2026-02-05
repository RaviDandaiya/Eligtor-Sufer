import * as THREE from 'three';

export class ObstacleSystem {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.curve = world.curve;
        this.obstacles = [];
        this.init();
    }

    init() {
        if (!this.curve) return;
        this.generate(30); // Initial count
    }

    createObstacle(position, normal, type) {
        let mesh;
        const theme = this.world.currentTheme;
        const color = theme.emissiveColor;

        if (type === 'crate' || type === 'block') {
            const geo = new THREE.BoxGeometry(4, 5, 0.4);
            const solidMat = new THREE.MeshStandardMaterial({
                color: 0x001122,
                transparent: true,
                opacity: 0.6
            });
            mesh = new THREE.Group();

            const solid = new THREE.Mesh(geo, solidMat);
            mesh.add(solid);

            const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
                color: color,
                wireframe: true,
                transparent: true,
                opacity: 0.8
            }));
            wire.scale.multiplyScalar(1.05);
            mesh.add(wire);

            const targetOrientation = new THREE.Vector3().copy(normal).negate();
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetOrientation);
            mesh.position.copy(position).sub(normal.clone().multiplyScalar(2.0));
        } else {
            // Wired Spikes
            const geo = new THREE.ConeGeometry(0.8, 3.2, 4);
            mesh = new THREE.Group();

            const solid = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
                color: 0x110000,
                transparent: true,
                opacity: 0.5
            }));
            mesh.add(solid);

            const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
                color: color,
                wireframe: true,
                transparent: true,
                opacity: 1.0
            }));
            wire.scale.multiplyScalar(1.1);
            mesh.add(wire);

            const targetOrientation = new THREE.Vector3().copy(normal).negate();
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetOrientation);
            mesh.position.copy(position);
        }

        this.scene.add(mesh);

        // Store for collision and animation
        const collider = new THREE.Box3();
        collider.setFromObject(mesh);
        // Store initial position and normal for animation reference
        mesh.userData = {
            type: 'obstacle',
            subtype: type,
            collider: collider,
            initialPos: position.clone(),
            normal: normal.clone(),
            randomOffset: Math.random() * 100 // Randomize animation phase
        };
        this.obstacles.push(mesh);
    }

    checkCollisions(player) {
        const playerBox = player.getCollisionBox();

        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            const collider = obstacle.userData.collider;

            // Update collider in case it moved
            collider.setFromObject(obstacle);

            if (playerBox.intersectsBox(collider)) {
                return true;
            }
        }
        return false;
    }

    update(delta, time) {
        this.obstacles.forEach(obs => {
            const data = obs.userData;

            // 1. Universal Pulse (Existing)
            if (obs.children.length > 1) {
                const wire = obs.children[1];
                const pulse = 1.05 + Math.sin(time * 3 + data.randomOffset) * 0.05;
                wire.scale.set(pulse, pulse, pulse);
            }

            // 2. Specific Animations
            if (data.subtype === 'spike') {
                // ROTATION: Spin spikes around their local Y axis (which points up/out)
                // Since we set orientation using quaternion, local Y is the direction of the normal.
                obs.rotateY(delta * 2.0);
            } else if (data.subtype === 'crate') {
                // HOVER / BOBBING: Move slightly up and down along the normal
                const hoverOffset = Math.sin(time * 2 + data.randomOffset) * 0.5;
                const newPos = data.initialPos.clone().add(data.normal.clone().multiplyScalar(hoverOffset));
                obs.position.copy(newPos);

                // Slow tumble (optional, might look messy if not careful, let's stick to hover + slow spin)
                obs.rotateY(delta * 0.5);
                obs.rotateZ(delta * 0.2);
            }
        });
    }

    nextLevel(difficulty) {
        // Clear old obstacles
        this.obstacles.forEach(obs => this.scene.remove(obs));
        this.obstacles = [];

        // Increase density based on difficulty
        const count = Math.min(60, 30 + difficulty * 2);
        this.generate(count);
    }

    generate(count) {
        for (let i = 0; i < count; i++) {
            // Position along the curve (start further out)
            const t = 0.1 + (i / count) * 0.9;
            const point = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t).normalize();

            // Random angle around the tangent (lane)
            const angle = Math.random() * Math.PI * 2;
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(tangent, angle);

            let arbitrary = new THREE.Vector3(0, 1, 0);
            if (Math.abs(tangent.y) > 0.9) arbitrary.set(1, 0, 0);
            const normal = new THREE.Vector3().crossVectors(tangent, arbitrary).normalize();

            const surfaceNormal = normal.clone().applyMatrix4(rotationMatrix);
            const tubeRadius = 4;

            const position = point.clone().add(surfaceNormal.clone().multiplyScalar(tubeRadius));

            // Type: Spike or Crate
            const type = Math.random() > 0.5 ? 'crate' : 'spike';
            this.createObstacle(position, surfaceNormal, type);
        }
    }
}
