import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RNG } from "./rng";
import { blocks, resources } from "./blocks";
const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshLambertMaterial();

export class WorldChunk extends THREE.Group {
  /**
   * @type {{
   *  id: number,
   *  instanceId:number
   * }[][][]}
   */
  data = [];



  constructor(size, params) {
    super();
    this.loaded = false;
    this.size = size;
    this.params = params;
  }

  generate() {
    const start = performance.now()
    const rng = new RNG(this.params.seed);

    this.InitializeTerrain(); // Reinitialize terrain data
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateMeshes();

    this.loaded = true;

    console.log(`Generated in ${performance.now() - start}ms`);
  }

  /*
    Initializing the WorldChunk Terrain Data
  */
  InitializeTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice = [];
      for (let y = 0; y < this.size.height; y++) {
        const row = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({
            id: blocks.empty.id,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  /**
   * Generate Resources
   */

  generateResources(rng) {
    const simplex = new SimplexNoise(rng);
    resources.forEach((resource) => {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const value = simplex.noise3d(
              (this.position.x + x) / resource.scale.x,
              (this.position.y + y) / resource.scale.y,
              (this.position.z + z) / resource.scale.z
            );
            if (value > resource.scarcity) {
              this.setBlockId(x, y, z, resource.id);
            }
          }
        }
      }
    });
  }

  /**
   * Generate Terrain
   */
  generateTerrain(rng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value = simplex.noise(
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale
        );

        const scaledNoise =
          this.params.terrain.offset + this.params.terrain.magnitude * value;
        let height = Math.floor(this.size.height * scaledNoise);
        height = Math.max(0, Math.min(height, this.size.height - 1)); // Ensure height is within bounds

        for (let y = 0; y <= this.size.height; y++) {
          if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (y == height) {
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.empty.id);
          }
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
    //Creating a lookup table for the blocks

    const meshes = {};

    Object.values(blocks)
      .filter((block) => block.id !== blocks.empty.id)
      .forEach((block) => {
        const mesh = new THREE.InstancedMesh(geometry, block.material, maxCount);
        mesh.name = block.id;
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes[block.id] = mesh;
      });

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z).id;
          if(blockId === blocks.empty.id){
            continue;
          }

          const mesh = meshes[blockId];

          const instanceId = mesh.count;
          if (blockId !== blocks.empty.id && !this.isBlockObscured(x, y, z)) {
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
          }
        }
      }
    }

    // mesh.instanceMatrix.needsUpdate = true; // Ensure the instance matrix updates
    this.add(...Object.values(meshes));
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
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
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
   * @param {number}x
   * @param {number}y
   * @param {number}z
   */
  removeBlock(x, y, z){
    const block = this.getBlock(x, y, z);
    if(block && block.id !== blocks.empty.id){
      this.deleteBlockInstance(x, y, z);
    }
  }

  /**
   * @param {number}x
   * @param {number}y
   * @param {number}z
   */
  deleteBlockInstance(x, y, z){
    const block = this.getBlock(x, y, z);
    if(block.instanceId===null){
      return ;
    }
    const mesh = this.children.find((instanceMesh)=>{
      return (
        instanceMesh.name === block.id
      )
    })

    const instanceId = block.instanceId;

    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count-1, lastMatrix);
    const v  = new THREE.Vector3();
    v.applyMatrix4(lastMatrix);
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    mesh.setMatrixAt(instanceId, lastMatrix);
    mesh.count--;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    this.setBlockInstanceId(x, y, z, null);
    this.setBlockId(x, y, z, blocks.empty.id);
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

  isBlockObscured(x, y, z) {
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
    const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
    const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
    const front = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
    const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

    if (
      up === blocks.empty.id ||
      down === blocks.empty.id ||
      left === blocks.empty.id ||
      right === blocks.empty.id ||
      front === blocks.empty.id ||
      back === blocks.empty.id
    ) {
      return false;
    } else {
      return true;
    }
  }

  disposeInstance(){
    this.traverse((obj)=>{
        if(obj.dispose) obj.dispose();
    });
    this.clear();
  }
}
