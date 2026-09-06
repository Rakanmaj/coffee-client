export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const INITIAL_POSITION = Object.freeze({ x: 0, y: 0, zoom: 1 });

export function photoSize(photo, frame, zoom = 1) {
  const scale = Math.max(frame.width / photo.width, frame.height / photo.height) * zoom;
  return { width: photo.width * scale, height: photo.height * scale };
}

export function boundPosition(position, photo, frame) {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, position.zoom));
  const size = photoSize(photo, frame, zoom);
  const limitX = Math.max(0, (size.width - frame.width) / 2);
  const limitY = Math.max(0, (size.height - frame.height) / 2);
  return {
    zoom,
    x: Math.min(limitX, Math.max(-limitX, position.x)),
    y: Math.min(limitY, Math.max(-limitY, position.y)),
  };
}

export function zoomAt(position, zoom, point, photo, frame) {
  const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  const ratio = nextZoom / position.zoom;
  const px = point.x - frame.width / 2;
  const py = point.y - frame.height / 2;
  return boundPosition({ zoom: nextZoom, x: px - (px - position.x) * ratio, y: py - (py - position.y) * ratio }, photo, frame);
}
