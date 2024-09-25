import * as THREE from "three";

export class Tool extends THREE.Group{
    animate = false;
    animationAmplitude = 0.5;
    animationDuration = 750;
    animationStart = 0;
    animationSpeed = 0.025;
    animation = undefined;

    toolMesh = undefined;

    get animationTime(){
        return performance.now()-this.animationStart;
    }

    startAnimation(){
        if(this.animate) return ;
        this.animate = true;
        this.animationStart = performance.now();
        clearTimeout(this.animation);
        this.animation = setTimeout(()=>{
            this.animate = false;
            this.toolMesh.rotation.z = 0;

            //Uncomment lines below to have fun along with line 36 and line 37
            // this.toolMesh.rotation.y = 0;
            // this.toolMesh.rotation.x = 0;
        }, this.animationDuration)
    }

    update(){
        if(this.animate && this.toolMesh){

            this.toolMesh.rotation.z = this.animationAmplitude * Math.sin(this.animationTime * this.animationSpeed)
            
            //Uncomment lines below to have fun along with line 27 and line 28
            // this.toolMesh.rotation.y = -5*this.animationAmplitude * Math.sin(this.animationTime * this.animationSpeed)
            // this.toolMesh.rotation.x = 5*this.animationAmplitude * Math.sin(this.animationTime * this.animationSpeed)
        }
    }
    
    /**
     * 
     * @param {THREE.Mesh} mesh 
     */
    setMesh(mesh){
        this.clear();
        this.toolMesh = mesh;
        this.add(this.toolMesh);
        this.receiveShadow = true;
        this.castShadow = true;

        this.position.set(0.2, -0.3, -0.4);
        this.scale.set(0.3, 0.3, 0.5);
        this.rotation.z = Math.PI / 4 - 0.6;
        this.rotation.x = -Math.PI / 2 + 1.2; 
        this.rotation.y = Math.PI - 1.5;

    }

}   