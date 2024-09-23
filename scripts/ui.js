import {GUI} from "three/addons/libs/lil-gui.module.min.js"
import {blocks, resources} from "./blocks.js"
export function createUI(scene, world, player){
    const gui = new GUI();

    const sceneFolder = gui.addFolder('Scene')
    sceneFolder.add(scene.fog, 'near', 1, 200, 1).name('Fog Near');
    sceneFolder.add(scene.fog, 'far', 1, 200, 1).name('Fog Far');

    const playerFolder = gui.addFolder('Player')
    playerFolder.add(player, 'maxSpeed', 1, 100).name('Speed');
    playerFolder.add(player, 'jumpSpeed', 1, 100, 0.1).name('Jump Speed');
    playerFolder.add(player.cameraHelper, 'visible').name('Show Camera Helper');

    const terrainFolder = gui.addFolder('Terrain')
    terrainFolder.add(world, 'asyncLoading').name('Async Loading');
    terrainFolder.add(world, 'drawDistance', 1, 10).name('Draw Distance');
    terrainFolder.add(world.params, 'seed', 1, 10000).name('Seed');
    terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale');
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 1).name('Magnitude');
    terrainFolder.add(world.params.terrain, 'offset',0, 1).name('Offset');
    terrainFolder.add(world.chunkSize, 'width', 1, 256).step(1).name('Chunk Width');
    terrainFolder.add(world.chunkSize, 'height', 1, 256).step(1).name('Chunk Height')


    const allResources = gui.addFolder("Resources")
    resources.forEach((resource)=>{
        const resourcesFolder = allResources.addFolder(resource.name)
        resourcesFolder.add(resource, 'scarcity', 0, 1).name('Scarcity');
    
        const scaleFolder = resourcesFolder.addFolder('Scale')
        scaleFolder.add(resource.scale, 'x', 1, 100).name('X Scale');
        scaleFolder.add(resource.scale, 'y', 1, 100).name('Y Scale');
        scaleFolder.add(resource.scale, 'z', 1, 100).name('Z Scale');
    })

    
    // gui.add(world, 'generate')
    gui.onChange(()=>{
        world.generate();
    })
}