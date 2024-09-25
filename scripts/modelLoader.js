import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class ModelLoader{
   loader = new GLTFLoader();
   models = {
    pickaxe: undefined,
   }

   /**
    * 
    * @param {(object) => ()} onLoad 
    */

   loadModels(onLoad){
    this.loader.load("/models/pickaxe.glb", (model)=>{
        const mesh = model.scene;
        this.models.pickaxe = mesh;
        console.log("pickaxe loaded");
        onLoad(this.models);
    })
   }


}                                                          