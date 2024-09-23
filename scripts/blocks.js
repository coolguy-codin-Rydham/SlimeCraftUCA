import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();

const loadTexture = (path) => {
    const texture = textureLoader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
};

const textures = {
    dirt: loadTexture("/dirt.png"),
    grass: loadTexture("/grass_carried.png"),
    grassSide: loadTexture("/grass_side_carried.png"),
    stone: loadTexture("/stone.png"),
    coalOre: loadTexture("/coal_ore.png"),
    ironOre: loadTexture("/iron_ore.png"),
}

export const blocks = {
  empty: {
    id: 0,
    name: "empty",
  },
  grass: {
    id: 1,
    name: "grass",
    color: 0x55bf01,
    material: [
        new THREE.MeshLambertMaterial({map: textures.grassSide}),
        new THREE.MeshLambertMaterial({map: textures.grassSide}),
        new THREE.MeshLambertMaterial({map: textures.grass}),
        new THREE.MeshLambertMaterial({map: textures.dirt}),
        new THREE.MeshLambertMaterial({map: textures.grassSide}),
        new THREE.MeshLambertMaterial({map: textures.grassSide}),
    ]
  },
  dirt: {
    id: 2,
    name: "dirt",
    color: 0x807020,
    material:new THREE.MeshLambertMaterial({map: textures.dirt}),
  },
  stone: {
    id: 3,
    name: "stone",
    color: 0x808080,
    scale: { x: 50, y: 50, z: 50 },
    scarcity: 0.5,
    material:  new THREE.MeshLambertMaterial({map: textures.stone})
  },
  coalOre: {
    id: 4,
    name: "coalOre",
    color: 0x202020,
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8,
    material: new THREE.MeshLambertMaterial({map: textures.coalOre})
  },
  ironOre: {
    id: 5,
    name: "ironOre",
    color: 0x806060,
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
    material: new THREE.MeshLambertMaterial({map: textures.ironOre})
  },
};

export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre];
