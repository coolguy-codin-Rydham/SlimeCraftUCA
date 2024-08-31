import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RNG } from "./rng";
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({
  color: 0x00d000,
});

export class World extends THREE.Group {
  /**
   * @type {{
   *  id: number,
   *  instanceId:number
   * }[][][]}
   */
  data = [];

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.5,
      offset: 0.2
    }
  };

  constructor(size = { width: 64, height: 32 }) {
    super();
    this.size = size;
    this.InitializeTerrain(); // Ensure terrain data is initialized
  }

  generate() {
    this.InitializeTerrain(); // Reinitialize terrain data
    this.generateTerrain();
    this.generateMeshes();
  }

  /*
    Initializing the World Terrain Data
  */
  InitializeTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice = [];
      for (let y = 0; y < this.size.height; y++) {
        const row = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({
            id: 0,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  /**
   * Generate Terrain
   */
  generateTerrain() {
    const rng = new RNG(this.params.seed);
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value = simplex.noise(
          x / this.params.terrain.scale,
          z / this.params.terrain.scale
        );

        const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value;
        let height = Math.floor(this.size.height * scaledNoise);
        height = Math.max(0, Math.min(height, this.size.height - 1)); // Ensure height is within bounds

        for (let y = 0; y <= height; y++) {
          this.setBlockId(x, y, z, 1); // Set block ID
        }
      }
    }
  }

  /**
   * Generate Meshes
   */
  generateMeshes() {
    this.clear(); // Clear existing meshes

    const maxCount = this.size.width * this.size.width * this.size.height;
    const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    mesh.count = 0;

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const block = this.getBlock(x, y, z);
          if (block && block.id !== 0) {
            matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
            mesh.setMatrixAt(mesh.count, matrix);
            this.setBlockInstanceId(x, y, z, mesh.count);
            mesh.count++;
          }
        }
      }
    }

    mesh.instanceMatrix.needsUpdate = true; // Ensure the instance matrix updates
    this.add(mesh);
  }

  /**
   * Checks if the block at (x, y, z) is within bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    return (
      x >= 0 && x < this.size.width &&
      y >= 0 && y < this.size.height &&
      z >= 0 && z < this.size.width
    );
  }

  /**
   * Get the block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceId: number} | null}
   */
  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /**
   * Sets the block id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} id
   */
  setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = id;
    }
  }

  /**
   * Sets the block instance ID for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} instanceId
   */
  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }
}
