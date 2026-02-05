import * as THREE from 'three';

/**
 * Creates a winding road curve for the tunnel.
 * @param {number} pointsCount - Number of points in the curve
 * @param {number} radius - Complexity/Winding factor
 * @returns {THREE.CatmullRomCurve3}
 */
export function createRoadCurve(pointsCount = 100, radius = 5) {
    const points = [];
    for (let i = 0; i < pointsCount; i++) {
        points.push(new THREE.Vector3(
            Math.sin(i * 0.1) * radius,
            Math.cos(i * 0.1) * radius,
            i * 10
        ));
    }
    return new THREE.CatmullRomCurve3(points);
}
