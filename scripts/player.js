import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { blocks } from "./blocks";
import { Tool } from "./tool";

const CENTER_SCREEN = new THREE.Vector2();

export class Player {
  radius = 0.5
  height = 1.75
  jumpSpeed = 10;
  onGround = false;
  maxSpeed = 20;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();

  #worldVelocity = new THREE.Vector3();
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  controls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new THREE.CameraHelper(this.camera);

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 3);
  selectedCoords = null;
  activeBlockId = blocks.empty.id;

  tool = new Tool();

  /**
   *
   * @param {THREE.Scene} scene
   */

  constructor(scene) {
    this.position.set(32, 16, 32);
    this.camera.layers.enable(1);
    scene.add(this.camera);
    // scene.add(this.cameraHelper);

    this.camera.add(this.tool);
    document.addEventListener("keydown", this.onkeydown.bind(this));
    document.addEventListener("keyup", this.onkeyup.bind(this));

    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({wireframe: true})
    )
    // scene.add(this.boundsHelper);

    const selectionMaterial = new THREE.MeshBasicMaterial({color: "white", transparent: true, opacity: 0.5})
    const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01)
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial)
    scene.add(this.selectionHelper)

    this.raycaster.layers.set(0);
  }

  get worldVelocity(){
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    return this.#worldVelocity;
  }

  /**
   * @param {World} world
   */

  update(world){
    this.updateRaycaster(world);
    this.tool.update();
  }

  /**
   * @param {World} world
   */

  updateRaycaster(world){
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera)
    const intersections = this.raycaster.intersectObject(world, true)
    if(intersections.length>0){
      const intersection = intersections[0]

      const chunk = intersection.object.parent

      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix)
      this.selectedCoords = chunk.position.clone()
      this.selectedCoords.applyMatrix4(blockMatrix)

      if(this.activeBlockId!==blocks.empty.id){
        this.selectedCoords.add(intersection.normal)
      }
      

      this.selectionHelper.position.copy(this.selectedCoords)
      this.selectionHelper.visible = true


      // console.log(this.selectedCoords)
    }else{
      this.selectedCoords= null
      this.selectionHelper.visible = false
    }
  }

  /**
     * @param {THREE.Vector3} deltaVelocity
   */
  applyWorldDeltaVelocity(deltaVelocity) {
    deltaVelocity.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(deltaVelocity);
  }

  applyInput(dt) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;

      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);

      this.position.y += this.velocity.y * dt;


      document.getElementById("player-position").textContent = this.toString();
    }
  }

  updateBoundsHelper(){
    this.boundsHelper.position.copy(this.position);
    this.boundsHelper.position.y -=this.height/2;
  }

  /**
   * @type {THREE.Vector3}
   */

  get position() {
    return this.camera.position;
  }

  /**
   * @param {KeyboardEvent} event
   */
  onkeydown(event) {
    if (!this.controls.isLocked) {
      this.controls.lock();
      console.log("locked");
    }

    switch (event.code) {
      case "Digit0":
      case "Digit1":
      case "Digit2":
      case "Digit3":
      case "Digit4":
      case "Digit5":
      case "Digit6":
      case "Digit7":
      case "Digit8":
        document.getElementById(`toolbar-${this.activeBlockId}`).classList.remove("selected")
        this.activeBlockId=Number(event.key)
        document.getElementById(`toolbar-${this.activeBlockId}`).classList.add("selected")
        this.tool.visible = (this.activeBlockId===0)
        console.log(`Active block is: ${event.key}`)
        break;
      case "KeyW":
        this.input.z = this.maxSpeed;
        break;
      case "KeyA":
        this.input.x = -this.maxSpeed;
        break;
      case "KeyS":
        this.input.z = -this.maxSpeed;
        break;
      case "KeyD":
        this.input.x = this.maxSpeed;
        break;
      case "KeyR":
        this.position.set(32, 64, 32);
        this.velocity.set(0, 0, 0);
        break;
      case "Space":
        if(this.onGround){
          this.velocity.y += this.jumpSpeed;
        }
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  onkeyup(event) {
    switch (event.code) {
      case "KeyW":
        this.input.z = 0;
        break;
      case "KeyA":
        this.input.x = 0;
        break;
      case "KeyS":
        this.input.z = 0;
        break;
      case "KeyD":
        this.input.x = 0;
        break;
    }
  }
  toString() {
    let str = "";
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)} `;
    return str;
  }
}
