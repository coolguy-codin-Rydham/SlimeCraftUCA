import {GUI} from "three/addons/libs/lil-gui.module.min.js"
import {blocks, resources} from "./blocks.js"
export function createUI(world){
    const gui = new GUI();


    gui.add(world.size, "width", 8, 128, 1).name('Width');
    gui.add(world.size, "height", 8, 64, 1).name('Height');

    const terrainFolder = gui.addFolder('Terrain')
    terrainFolder.add(world.params, 'seed', 1, 10000).name('Seed');
    terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale');
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 1).name('Magnitude');
    terrainFolder.add(world.params.terrain, 'offset',0, 1).name('Offset');

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