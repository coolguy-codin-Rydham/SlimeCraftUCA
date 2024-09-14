import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";

export class Player {
  maxSpeed = 40;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  controls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new THREE.CameraHelper(this.camera);

  /**
   *
   * @param {THREE.Scene} scene
   */

  constructor(scene) {
    this.position.set(32, 16, 32);
    scene.add(this.camera);
    scene.add(this.cameraHelper);
    document.addEventListener("keydown", this.onkeydown.bind(this));
    document.addEventListener("keyup", this.onkeyup.bind(this));
  }

  applyInput(dt) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;

      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);

      this.camera.position.y += this.input.y * dt;

      document.getElementById("player-position").textContent = this.toString();
    }
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
      case "Space":
        this.input.y = this.maxSpeed;
        break;
      case "ShiftLeft":
        this.input.y = -this.maxSpeed;
        break;
      case "KeyR":
        this.position.set(32, 16, 32);
        this.velocity.set(0, 0, 0);
        break;
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
      case "Space":
        this.input.y = 0;
        break;
      case "ShiftLeft":
        this.input.y = 0;
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
