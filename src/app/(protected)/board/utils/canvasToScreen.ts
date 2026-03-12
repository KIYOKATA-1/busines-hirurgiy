import type { CanvasPoint } from "../types";

export function canvasToScreen(
  x: number,
  y: number,
  pan: CanvasPoint,
  zoom: number
): CanvasPoint {
  return {
    x: x * zoom + pan.x,
    y: y * zoom + pan.y,
  };
}
