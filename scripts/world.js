import * as THREE from "three";
import { WorldChunk } from "./worldChunk";
import { DataStore } from "./dataStore";

export class World extends THREE.Group {
  asyncLoading = true;

  drawDistance = 2;

  chunkSize = { width: 24, height: 32 };

  noFog = false;

  params = {
    seed: 0,
    terrain: {
      scale: 40,
      magnitude: 10,
      offset: 4,
      waterOffset: 3
    },
    trees:{
      trunk :{
        minHeight: 8,
        maxHeight : 12
      },
      canopy:{
        minRadius : 2,
        maxRadius : 4,
        density: 0.5
      },
      frequency: 0.01
    },
    clouds:{
      scale: 30, 
      density: 0.5
    }
  };

  dataStore = new DataStore();
  constructor(seed = 0) {
    super();
    this.seed = seed;
  }

  generate() {
    this.dataStore.clear();
    this.disposeChunks();

    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
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
    // Get the coordinates of the chunk the player is currently in
    const coords = this.worldToChunkCoords(player.position.x, 0, player.position.z);
    
    const visibleChunks = [];
    for (let x = coords.chunk.x - this.drawDistance; x <= coords.chunk.x + this.drawDistance; x++) {
      for (let z = coords.chunk.z - this.drawDistance; z <= coords.chunk.z + this.drawDistance; z++) {
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
    // Filter down visible chunks, removing ones that already exist
    return visibleChunks.filter((chunkToAdd) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => {
          return chunkToAdd.x === x && chunkToAdd.z === z;
        });

      return !chunkExists;
    })
  }


  /**
   * @param {{x:number, z:number}[]} visibleChunks
   */

  removeUnusedChunks(visibleChunks) {
    // Filter current chunks, getting ones that don't exist in visible chunks
    const chunksToRemove = this.children.filter((obj) => {
      const { x, z } = obj.userData;
      const chunkExists = visibleChunks.find((visibleChunk) => {
          return visibleChunk.x === x && visibleChunk.z === z;
        });

      return !chunkExists;
    })

    for (const chunk of chunksToRemove) {
      chunk.disposeInstance();
      this.remove(chunk);
      // console.log(`Removed chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`);
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} z
   */

  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
    chunk.position.set(
      x * this.chunkSize.width,
      0,
      z * this.chunkSize.width
    );
    chunk.userData = { x, z };
    if (this.asyncLoading) {
      //Load chunk async
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }
    this.add(chunk);
    // console.log(`generated chunk ${x}, ${z}`);
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
      return chunk.getBlock(coords.block.x, y, coords.block.z);
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
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z
    }

    return {
      chunk: chunkCoords,
      block: blockCoords
    };
  }

  /**
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk|null}
   */
  getChunk(chunkX, chunkZ) {
    return this.children.find((chunk) => {
      return chunk.userData.x === chunkX && 
             chunk.userData.z === chunkZ;
    });
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (chunk.disposeInstance) {
        chunk.disposeInstance();
      }
    });
    this.clear();
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} blockId
   */
  addBlock(x, y, z, blockId){
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (chunk) {
      chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, blockId);

      this.hideBlock(x-1, y, z);
      this.hideBlock(x+1, y, z);
      this.hideBlock(x, y-1, z);
      this.hideBlock(x, y+1, z);
      this.hideBlock(x, y, z-1);
      this.hideBlock(x, y, z+1);
    }
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */

  removeBlock(x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (chunk) {
      chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z);
      
      this.revealBlock(x-1, y, z);
      this.revealBlock(x+1, y, z);
      this.revealBlock(x, y-1, z);
      this.revealBlock(x, y+1, z);
      this.revealBlock(x, y, z-1);
      this.revealBlock(x, y, z+1);
    }
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */

  hideBlock(x, y, z){
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (chunk && chunk.isBlockObscured(coords.chunk.x, coords.chunk.y, coords.chunk.z)) {
      chunk.deleteBlockInstance(
        coords.block.x,
        coords.block.y,
        coords.block.z
      )
    }
  }


  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */

  revealBlock(x, y, z){
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (chunk) {
      chunk.addBlockInstance(
        coords.block.x,
        coords.block.y,
        coords.block.z
      )
    }
  }


}
