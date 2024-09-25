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

  constructor(size, params, dataStore) {
    super();
    this.size = size;
    this.params = params;
    this.loaded = false;
    this.dataStore = dataStore;
  }

  generate() {
    const start = performance.now();
    const rng = new RNG(this.params.seed);

    this.InitializeTerrain(); // Reinitialize terrain data
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateTrees(rng);
    this.generateClouds(rng);
    this.loadPlayerChanges();
    this.generateMeshes();


    this.loaded = true;

    // console.log(`Generated in ${performance.now() - start}ms`);
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
   * @param {RNG} rng
   */

  generateResources(rng) {
    for (const resource of resources) {
      const simplex = new SimplexNoise(rng);
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const n = simplex.noise3d(
              (this.position.x + x) / resource.scale.x,
              (this.position.y + y) / resource.scale.y,
              (this.position.z + z) / resource.scale.z
            );

            if (n > resource.scarcity) {
              this.setBlockId(x, y, z, resource.id);
            }
          }
        }
      }
    }
  }

  /**
   * Generate Terrain
   * @param {RNG} rng
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
        let height = Math.floor(scaledNoise);

        // Clamp between 0 and max height
        height = Math.max(
          0,
          Math.min(Math.floor(height), this.size.height - 1)
        );

        for (let y = 0; y < this.size.height; y++) {
          if(y<this.params.terrain.waterOffset && y<=height){
            this.setBlockId(x,y,z,blocks.sand.id)
          }else if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (y === height) {
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.empty.id);
          }
        }
      }
    }
  }
  /**
   *
   * @param {RNG} rng
   */

  generateTrees(rng) {
    const generateTreeTrunk = (x, z, rng) => {
      const minH = this.params.trees.trunk.minHeight;
      const maxH = this.params.trees.trunk.maxHeight;
      const h = Math.round(minH + (maxH - minH) * rng.random());

      for (let y = 0; y < this.size.height; y++) {
        const block = this.getBlock(x, y, z);
        if (block && block.id === blocks.dirt.id) {
          for (let treeY = y + 2; treeY < y + h; treeY++) {
            this.setBlockId(x, treeY, z, blocks.tree.id);
          }
          generateTreeCanopy(x, y + h, z, rng);
          break;
        }
      }
    };

    const generateTreeCanopy = (centerX, centerY, centerZ, rng) => {
      const minR = this.params.trees.canopy.minRadius;
      const maxR = this.params.trees.canopy.maxRadius;
      const r = Math.round(minR + (maxR - minR) * rng.random());

      for (let x = -r; x <= r; x++) {
        for (let y = 0; y <= r; y++) {
          for (let z = -r; z <= r; z++) {
            const n = rng.random();
            if (x * x + y * y + z * z > r * r) continue;
            const block = this.getBlock(centerX + x, centerY + y, centerZ + z);
            if (block && block.id !== blocks.empty.id) continue;
            if (n < this.params.trees.canopy.density) {
              this.setBlockId(
                centerX + x,
                centerY + y,
                centerZ + z,
                blocks.leaves.id
              );
            }
          }
        }
      }
    };

    let offset = this.params.trees.canopy.maxRadius;

    for (let x = offset; x < this.size.width - offset; x++) {
      for (let z = offset; z < this.size.width - offset; z++) {
        if (rng.random() < this.params.trees.frequency) {
          generateTreeTrunk(x, z, rng);
        }
      }
    }
  }

  /**
   *
   * @param {RNG} rng
   */

  generateClouds(rng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value = (simplex.noise(
          (this.position.x + x) / this.params.clouds.scale,
          (this.position.z + z) / this.params.clouds.scale
        )+1)*0.5
        if (value < this.params.clouds.density) {
          for(let xa = 1;xa<=2;xa++){
            this.setBlockId(x, this.size.height - xa, z, blocks.cloud.id);
          }
        }
      }
    }
  }

  loadPlayerChanges() {
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          if (
            this.dataStore.contains(this.position.x, this.position.z, x, y, z)
          ) {
            const blockId = this.dataStore.get(
              this.position.x,
              this.position.z,
              x,
              y,
              z
            );
            this.setBlockId(x, y, z, blockId);
          }
        }
      }
    }
  }

  /**
   * Generate Water
   */
  generateWater(){
   const material = new THREE.MeshLambertMaterial({
    color: 0x9090e0,
    transparent: true, 
    opacity: 0.5, 
    side: THREE.DoubleSide,
   });

   const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);

   waterMesh.rotateX(-Math.PI/2);
   waterMesh.position.set(
    this.size.width/2,
    this.params.terrain.waterOffset-0.6,
    this.size.width/2
   )
   waterMesh.scale.set(this.size.width, this.size.width, 1);
   waterMesh.layers.set(1);
   this.add(waterMesh);
  }

  /**
   * Generate Meshes
   */
  generateMeshes() {
    this.clear(); // Clear existing meshes

    //Creating a lookup table for the blocks
    this.generateWater();

    const meshes = {};

    Object.values(blocks)
      .filter((block) => block.id !== blocks.empty.id)
      .forEach((block) => {
        const maxCount = this.size.width * this.size.width * this.size.height;
        const mesh = new THREE.InstancedMesh(
          geometry,
          block.material,
          maxCount
        );
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
          if (blockId === blocks.empty.id) {
            continue;
          }

          const mesh = meshes[blockId];

          const instanceId = mesh.count;
          if (!this.isBlockObscured(x, y, z)) {
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
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} blockId
   */
  addBlock(x, y, z, blockId) {
    if (this.getBlock(x, y, z).id === blocks.empty.id) {
      this.setBlockId(x, y, z, blockId);
      this.addBlockInstance(x, y, z);

      this.dataStore.set(this.position.x, this.position.z, x, y, z, blockId);
    }
  }

  /**
   * @param {number}x
   * @param {number}y
   * @param {number}z
   */
  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block && block.id !== blocks.empty.id) {
      this.deleteBlockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty.id);
      this.dataStore.set(
        this.position.x,
        this.position.z,
        x,
        y,
        z,
        blocks.empty.id
      );
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  addBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block && block.id !== blocks.empty.id && !block.instanceId) {
      const mesh = this.children.find(
        (instanceMesh) => instanceMesh.name === block.id
      );
      const instanceId = mesh.count++;

      this.setBlockInstanceId(x, y, z, instanceId);

      const matrix = new THREE.Matrix4();
      matrix.setPosition(x, y, z);
      mesh.setMatrixAt(instanceId, matrix);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  /**
   * @param {number}x
   * @param {number}y
   * @param {number}z
   * @param {{ id: number, instanceId: number }} block
   */
  deleteBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block.id === blocks.empty.id || !block.instanceId) {
      return;
    }
    const mesh = this.children.find(
      (instanceMesh) => instanceMesh.name === block.id
    );

    const instanceId = block.instanceId;

    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);
    const v = new THREE.Vector3();
    v.setFromMatrixPosition(lastMatrix);
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    mesh.setMatrixAt(instanceId, lastMatrix);
    mesh.count--;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    this.setBlockInstanceId(x, y, z, null);
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

  /**
   * Checks if the block at (x, y, z) is within bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    if (
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
    ) {
      return true;
    } else {
      return false;
    }
  }

  isBlockObscured(x, y, z) {
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
    const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
    const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
    const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
    const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

    if (
      up === blocks.empty.id ||
      down === blocks.empty.id ||
      left === blocks.empty.id ||
      right === blocks.empty.id ||
      forward === blocks.empty.id ||
      back === blocks.empty.id
    ) {
      return false;
    } else {
      return true;
    }
  }

  disposeInstance() {
    this.traverse((obj) => {
      if (obj.dispose) obj.dispose();
    });
    this.clear();
  }
}
