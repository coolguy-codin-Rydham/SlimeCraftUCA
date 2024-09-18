import * as THREE from "three";
import { WorldChunk } from "./worldChunk";

export class World extends THREE.Group {
  asyncLoading = true;

  drawDistance = 2;

  chunkSize = { width: 64, height: 32 };

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.5,
      offset: 0.2,
    },
  };
  constructor(seed = 0) {
    super();
    this.seed = seed;
  }

  generate() {
    this.disposeChunks();

    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        const chunk = new WorldChunk(this.chunkSize, this.params);
        chunk.position.set(
          x * this.chunkSize.width,
          0,
          z * this.chunkSize.width
        );
        chunk.generate();
        chunk.userData = { x, z };
        this.add(chunk);
      }
    }

    // this.chunk = new WorldChunk(this.chunkSize, this.params);
    // this.chunk.generate();
    // this.add(this.chunk);
  }

  /**
   * @param {Player} player
   */
  update(player) {
    const visibleChunks = this.getVisibleChunks(player);

    const chunksToAdd = this.getChunksToAdd(visibleChunks);

    this.removeUnusedChunks(visibleChunks);

    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  /**
   * @param {Player} player
   * @return {{x:number, z:number}[]}
   */
  getVisibleChunks(player) {
    const visibleChunks = [];
    const coords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z
    );

    const chunkX = coords.chunk.x;
    const chunkZ = coords.chunk.z;

    for (
      let x = chunkX - this.drawDistance;
      x <= chunkX + this.drawDistance;
      x++
    ) {
      for (
        let z = chunkZ - this.drawDistance;
        z <= chunkZ + this.drawDistance;
        z++
      ) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   * @param {{x:number, z:number}[]} visibleChunks
   * @return {{x:number, z:number}[]}
   */

  getChunksToAdd(visibleChunks) {
    return visibleChunks.filter((chunk) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => chunk.x === x && chunk.z === z);

      return !chunkExists;
    });
  }

  /**
   * @param {{x:number, z:number}[]} visibleChunks
   */

  removeUnusedChunks(visibleChunks) {
    const chunksToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData;
      const chunkExists = visibleChunks.find(
        (visibleChunk) => visibleChunk.x === x && visibleChunk.z === z
      );

      return !chunkExists;
    });

    for (const chunk of chunksToRemove) {
      chunk.disposeInstance();
      this.remove(chunk);
      console.log(`removed chunk ${chunk.userData.x}, ${chunk.userData.z}`);
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} z
   */

  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params);
    chunk.position.set(
      x * this.chunkSize.width * 1.01,
      0,
      z * this.chunkSize.width * 1.01
    );
    chunk.userData = { x, z };
    if (this.asyncLoading) {
      //Load chunk async
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }
    this.add(chunk);
    console.log(`generated chunk ${x}, ${z}`);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @return {{id:number, instanceId:number} | null}
   */
  getBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk && chunk.loaded) {
      return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
    } else {
      return null;
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{
   *  chunk: {x:number, z:number},
   *  block: {x:number, y:number, z:number}
   * }}
   *
   */

  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };
    const blockCoords = {
      x: x - chunkCoords.x * this.chunkSize.width,
      y,
      z: z - chunkCoords.z * this.chunkSize.width,
    };
    return { chunk: chunkCoords, block: blockCoords };
  }

  /**
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk|null}
   */
  getChunk(chunkX, chunkZ) {
    return this.children.find(
      (chunk) => chunk.userData.x === chunkX && chunk.userData.z === chunkZ
    );
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstance) {
        chunk.disposeInstance();
      }
    });
    this.clear();
  }
}
