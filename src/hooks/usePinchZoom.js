import { useRef } from "react";
import { boundPosition, zoomAt } from "../utils/girlsDay/photoGeometry";

const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function usePinchZoom({ photo, frame, position, onChange }) {
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const current = useRef(position);

  const point = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * frame.width / bounds.width, y: (event.clientY - bounds.top) * frame.height / bounds.height };
  };
  const begin = () => {
    gesture.current = { points: [...pointers.current.values()], position: { ...current.current } };
  };

  return {
    onPointerDown(event) {
      if (!photo || (event.pointerType === "mouse" && event.button !== 0)) return;
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      if (!pointers.current.size) current.current = position;
      pointers.current.set(event.pointerId, point(event));
      begin();
    },
    onPointerMove(event) {
      if (!photo || !pointers.current.has(event.pointerId) || !gesture.current) return;
      event.preventDefault();
      pointers.current.set(event.pointerId, point(event));
      const points = [...pointers.current.values()];
      const start = gesture.current;
      let next;
      if (points.length > 1 && start.points.length > 1) {
        const from = midpoint(start.points[0], start.points[1]);
        const to = midpoint(points[0], points[1]);
        const zoom = start.position.zoom * distance(points[0], points[1]) / Math.max(1, distance(start.points[0], start.points[1]));
        next = zoomAt(start.position, zoom, from, photo, frame);
        next = boundPosition({ ...next, x: next.x + to.x - from.x, y: next.y + to.y - from.y }, photo, frame);
      } else {
        next = boundPosition({ ...start.position, x: start.position.x + points[0].x - start.points[0].x, y: start.position.y + points[0].y - start.points[0].y }, photo, frame);
      }
      current.current = next;
      onChange(next);
    },
    onPointerUp(event) {
      pointers.current.delete(event.pointerId);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      begin();
    },
    onPointerCancel() { pointers.current.clear(); gesture.current = null; },
    onLostPointerCapture(event) { pointers.current.delete(event.pointerId); begin(); },
    onKeyDown(event) {
      if (!photo) return;
      const step = event.shiftKey ? 72 : 24;
      const keys = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (keys[event.key]) {
        event.preventDefault();
        onChange(boundPosition({ ...position, x: position.x + keys[event.key][0], y: position.y + keys[event.key][1] }, photo, frame));
      } else if (["+", "=", "-"].includes(event.key)) {
        event.preventDefault();
        onChange(boundPosition({ ...position, zoom: position.zoom + (event.key === "-" ? -0.1 : 0.1) }, photo, frame));
      }
    },
  };
}
