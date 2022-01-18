import { UP, subtractVector, crossVector, normalizeVector } from "../lib/vector.js";

export class Camera {
	#position = [0, 0, -1];
	#target = [0, 0, 0];
	#screenWidth;
	#screenHeight;
	#near = 0.01;
	#far = 5;

	constructor(camera) {
		this.#position = camera.position;
		this.#screenWidth = camera.screenWidth;
		this.#screenHeight = camera.screenHeight;
		this.#near = camera.near ?? this.#near;
		this.#far = camera.far ?? this.#far;
	}

	lookAt(x, y, z) {
		this.#target = [x, y, z];
	}

	getForwardDirection() {
		return normalizeVector(subtractVector(this.#target, this.#position));
	}

	getRightDirection() {
		return crossVector(UP, this.getForwardDirection());
	}

	getUpDirection() {
		return crossVector(this.getForwardDirection(), this.getRightDirection());
	}

	getAspectRatio() {
		return this.#screenWidth / this.#screenHeight;
	}

	getPosition() {
		return this.#position;
	}

	setPosition(position) {
		this.#position = position;
	}
}