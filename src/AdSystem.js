import * as THREE from 'three';

export class AdSystem {
    constructor(scene, curve) {
        this.scene = scene;
        this.curve = curve;
        this.ads = [];
        this.init();
    }

    init() {
        if (!this.curve) return;

        // Load textures
        const loader = new THREE.TextureLoader();
        this.textures = [
            loader.load('./assets/ads/ad1.png'),
            loader.load('./assets/ads/ad2.png')
        ];

        // Place ads at regular intervals
        const adCount = 40;
        for (let i = 0; i < adCount; i++) {
            const t = (i / adCount);
            const point = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t).normalize();

            const up = new THREE.Vector3(0, 1, 0);
            let right = new THREE.Vector3().crossVectors(up, tangent).normalize();

            const side = Math.random() > 0.5 ? 1 : -1;
            const wallOffset = right.clone().multiplyScalar(side * 3.5);

            const position = point.clone().add(wallOffset);
            const lookAtTarget = point.clone();

            const texture = this.textures[i % this.textures.length];
            this.createBillboard(position, lookAtTarget, texture);
        }
    }

    createBillboard(position, lookAtTarget, texture) {
        const width = 3;
        const height = 1.6;
        const geo = new THREE.PlaneGeometry(width, height);

        const mat = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            map: texture,
            transparent: true,
            opacity: 0.9
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.lookAt(lookAtTarget);

        this.scene.add(mesh);
        this.ads.push(mesh);
    }

    hideAds() {
        this.ads.forEach(mesh => {
            mesh.visible = false;
        });
    }
}
