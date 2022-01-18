export const TWO_PI = Math.PI * 2
export const QUARTER_TURN = Math.PI / 2;

export function normalizeAngle(angle) {
	if (angle < 0) {
		return TWO_PI - (Math.abs(angle) % TWO_PI);
	}
	return angle % TWO_PI;
}

export function radToDegrees(rad) {
	return rad * 180 / Math.PI;
}

export function clamp(value, low, high) {
	low = low !== undefined ? low : Number.MIN_SAFE_INTEGER;
	high = high !== undefined ? high : Number.MAX_SAFE_INTEGER;
	if (value < low) {
		value = low;
	}
	if (value > high) {
		value = high;
	}
	return value;
}

export function pointToGrid(point, scale) {
	return point.map(v => Math.floor(v / scale));
}

export function unitDirection(rayDirection){
	return rayDirection.map(v => v < 0 ? -1 : 1);
}
