import { Camera } from "../entities/camera.js";
import { scaleVector, normalizeVector, addVector } from "../lib/vector.js";
import { clamp, pointToGrid, unitDirection } from "../lib/math-helpers.js";

const map = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
const SCALE = 100;

export class WcGeoVx extends HTMLElement {
	#context;
	#width = 1000;
	#height = 1000;

	constructor() {
		super();
		this.bind(this);
	}
	bind(element) {
		element.attachEvents = element.attachEvents.bind(element);
		element.cacheDom = element.cacheDom.bind(element);
		element.createShadowDom = element.createShadowDom.bind(element);
		element.createCameras = element.createCameras.bind(element);
		element.render = element.render.bind(element);
		element.render2d = element.render2d.bind(element);
		element.raycast = element.raycast.bind(element);
	}
	async connectedCallback() {
		this.createShadowDom();
		this.cacheDom();
		this.attachEvents();

		this.#context = this.dom.canvas.getContext("2d");

		this.createCameras();
		this.render2d();
	}
	createShadowDom() {
		this.shadow = this.attachShadow({ mode: "open" });
		this.shadow.innerHTML = `
                <style>
                    :host { display: block; }
                </style>
                <canvas width="${this.#width}" height="${this.#height}"></canvas>
            `;
	}
	cacheDom() {
		this.dom = {
			canvas: this.shadow.querySelector("canvas")
		};
	}
	createCameras() {
		this.cameras = {
			default: new Camera({
				position: [500, 0, 500],
				screenHeight: this.#height,
				screenWidth: this.#width,
				near: 0,
				far: 5
			})
		};
		this.cameras.default.lookAt(map[0].length / 2 * SCALE, 0, 10000);
	}
	render2d(){
		const halfVolumeWidth = this.cameras.default.getAspectRatio();
		const halfPixelWidth = this.#width / 2;
		const pixelWidthRatio = halfVolumeWidth / halfPixelWidth;

		for(let row = 0; row < map.length; row++){
			for(let col = 0; col < map[row].length; col++){
				if(map[row][col] > 0){
					this.#context.fillRect(row * SCALE, col * SCALE, SCALE, SCALE);
				}
			}
		}

		const pos = this.cameras.default.getPosition();
		this.#context.fillStyle = "#FF0000";
		this.#context.beginPath();
		this.#context.arc(pos[0], pos[2], 2, 0, 360, false);
		this.#context.fill();

		this.#context.strokeStyle = "#00FF00";
		for (let col = 0; col < this.#width; col++) {
			const xDelta = scaleVector(this.cameras.default.getRightDirection(), (col - halfPixelWidth) * pixelWidthRatio);
			const ray = {
				origin: this.cameras.default.getPosition(),
				direction: normalizeVector(addVector(this.cameras.default.getForwardDirection(), xDelta))
			};
			const intersection = this.raycast(ray);

			this.#context.beginPath();
			this.#context.moveTo(ray.origin[0], ray.origin[2]);
			this.#context.lineTo(intersection[0], intersection[2]);
			this.#context.stroke();
		}
	}
	render() {
		//const halfVolumeHeight = 1;
		//const halfPixelHeight = this.#height / 2;
		//const pixelHeightRatio = halfVolumeHeight / halfPixelHeight;
		const halfVolumeWidth = this.cameras.default.getAspectRatio();
		const halfPixelWidth = this.#width / 2;
		const pixelWidthRatio = halfVolumeWidth / halfPixelWidth;

		const pixelData = this.#context.getImageData(0, 0, this.#width, this.#height);

		for (let row = 0; row < this.#height; row++) {
			for (let col = 0; col < this.#width; col++) {
				const xDelta = scaleVector(this.cameras.default.getRightDirection(), (col - halfPixelWidth) * pixelWidthRatio);
				//const yDelta = scaleVector(scaleVector(this.cameras.default.getUpDirection(), -1), (row - halfPixelHeight) * pixelHeightRatio);
				const yDelta = 0;
				const ray = {
					origin: this.cameras.default.getPosition(),
					direction: normalizeVector(addVector(addVector(this.cameras.default.getForwardDirection(), xDelta), yDelta))
				};

				const color = this.raycast(ray);

				const index = (row * this.#width * 4) + (col * 4);
				pixelData.data[index + 0] = clamp(color[0] * 255, 0, 255);
				pixelData.data[index + 1] = clamp(color[1] * 255, 0, 255);
				pixelData.data[index + 2] = clamp(color[2] * 255, 0, 255);
				pixelData.data[index + 3] = clamp(color[3] * 255, 0, 255);
			}
		}

		this.#context.putImageData(pixelData, 0, 0);
	}
	attachEvents() {
	}

	raycast(ray) {
		const scaleFactorX = Math.sqrt(1 + (ray.direction[2]/ray.direction[0]) ** 2);
		const scaleFactorZ = Math.sqrt(1 + (ray.direction[0]/ray.direction[2]) ** 2);

		const gridCell = pointToGrid(ray.origin, SCALE);
		const stepDirection = unitDirection(ray.direction);
		let lengthByX = 0;
		let lengthByZ = 0;

		if(stepDirection[0] < 0){
			lengthByX = (ray.origin[0] - (gridCell[0] * SCALE)) * scaleFactorX;
		} else {
			lengthByX = (((gridCell[0] + 1) * SCALE) - ray.origin[0]) * scaleFactorX;
		}

		if (stepDirection[2] < 0) {
			lengthByZ = (ray.origin[2] - (gridCell[2] * SCALE)) * scaleFactorZ;
		} else {
			lengthByZ = (((gridCell[2] + 1) * SCALE) - ray.origin[2]) * scaleFactorZ;
		}

		let found = false;
		let distance = 0;
		const MAX_DISTANCE = 10000;
		while(!found && distance < MAX_DISTANCE){
			if(lengthByX < lengthByZ){
				gridCell[0] += stepDirection[0];
				distance = lengthByX;
				lengthByX += scaleFactorX * SCALE;
			} else {
				gridCell[2] += stepDirection[2];
				distance = lengthByZ;
				lengthByZ += scaleFactorZ * SCALE;
			}

			if(gridCell[0] >= 0 && gridCell[0] < map[0].length && gridCell[2] >= 0 && gridCell[2] < map.length){
				if(map[gridCell[0]][gridCell[2]] > 0){
					found = true;
				}
			}
		}

		let intersection = null;
		if(found){
			intersection = addVector(ray.origin, scaleVector(ray.direction, distance));
		}

		return intersection;
	}

	//Attrs
	attributeChangedCallback(name, oldValue, newValue) {
		if (newValue !== oldValue) {
			this[name] = newValue;
		}
	}
	set height(value) {
		this.#height = value;
		if (this.dom) {
			this.dom.canvas.height = value;
		}
	}
	set width(value) {
		this.#width = value;
		if (this.dom) {
			this.dom.canvas.height = value;
		}
	}
}

customElements.define("wc-geo-vx", WcGeoVx);