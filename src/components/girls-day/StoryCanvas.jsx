import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Group, Rect, Text, Image as CanvasImage, Path, Line } from "react-konva";
import useImage from "use-image";
import { STORY, PHOTO_FRAME as FRAME, GIRLS_DAY_LOGO } from "../../data/girlsDayTemplates";
import { girlsDayArtwork } from "../../data/girlsDayArtwork";
import { photoSize } from "../../utils/girlsDay/photoGeometry";
import { usePinchZoom } from "../../hooks/usePinchZoom";

function Accent({ kind, x, y, scale = 1, color, rotation = 0 }) {
  return <Path data={girlsDayArtwork[kind]} x={x} y={y} scaleX={scale} scaleY={scale} rotation={rotation} stroke={color} strokeWidth={2.4} lineCap="round" lineJoin="round" />;
}

function clipPhoto(context) {
  const { x, y, width, height, radius } = FRAME;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

const Background = memo(function Background({ template, background }) {
  const gingham = template.pattern === "gingham";
  return <Layer listening={false}>
    <Rect width={STORY.width} height={STORY.height} fill={template.background} />
    {background && <CanvasImage image={background} width={STORY.width} height={STORY.height} />}
    {gingham && <Group opacity={0.09}>
      {Array.from({ length: 18 }, (_, i) => <Rect key={`v${i}`} x={i * 64} width={26} height={1920} fill={template.accent} />)}
      {Array.from({ length: 30 }, (_, i) => <Rect key={`h${i}`} y={i * 64} height={26} width={1080} fill={template.accent} />)}
    </Group>}
    <Rect x={42} y={42} width={996} height={1836} cornerRadius={100} stroke={template.line} strokeWidth={3} />
    <Rect x={58} y={58} width={964} height={1804} cornerRadius={88} stroke={template.line} strokeWidth={1.5} />
    <Rect x={80} y={390} width={920} height={1110} cornerRadius={40} fill={template.paper} />
    <Rect x={FRAME.x} y={FRAME.y} width={FRAME.width} height={FRAME.height} cornerRadius={FRAME.radius} fill={template.paper} />
  </Layer>;
});

function fittedFont(text, maximum, width, family, weight = "normal") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return maximum * 0.65;
  context.font = `${weight} ${maximum}px ${family}`;
  const measured = Math.max(...text.split("\n").map((line) => context.measureText(line).width));
  return Math.min(maximum, maximum * width / Math.max(1, measured));
}

const Foreground = memo(function Foreground({ template, drink, drinkImage, logo, foreground, name, copy, fontReady }) {
  const fontFamily = fontReady ? 'Manrope, "IBM Plex Sans Arabic", sans-serif' : 'Arial, sans-serif';
  const namePattern = /\p{Script=Arabic}/u.test(name) ? copy.story.personalizedRtlName : copy.story.personalized;
  const storyTitle = name.trim() ? namePattern.replace("{name}", name.trim()) : copy.story.unnamed;
  const fontSize = useMemo(() => fittedFont(storyTitle, 67, 540, fontFamily), [storyTitle, fontFamily]);
  const drinkSize = useMemo(() => fittedFont(copy.story.drinkTitles[drink.id], 28, 560, fontFamily, "bold"), [copy, drink.id, fontFamily]);
  return <Layer listening={false}>
    <Text x={190} y={163} width={700} text={copy.brand} fontFamily={fontFamily} fontStyle="bold" fontSize={26} align="center" fill={template.ink} />
    <Text x={80} y={208} width={920} text={copy.story.title} fontFamily="Georgia" fontStyle="italic" fontSize={112} align="center" fill={template.accent} />
    <Text x={100} y={338} width={880} text={copy.story.subtitle} fontFamily={fontFamily} fontSize={30} align="center" fill={template.ink} />
    <Accent kind={template.pattern === "botanical" ? "leaf" : "bow"} x={494} y={63} scale={1.4} color={template.accent} />
    <Accent kind="heart" x={864} y={313} scale={0.9} color={template.accent} rotation={12} />
    <Accent kind={template.pattern === "botanical" ? "leaf" : "heart"} x={33} y={713} scale={1} color={template.line} rotation={-15} />
    <Accent kind="leaf" x={979} y={1077} scale={0.9} color={template.ink} rotation={18} />
    <Rect x={96} y={406} width={888} height={1078} cornerRadius={30} stroke={template.line} strokeWidth={2} />
    <Text x={116} y={1540} width={552} height={174} text={storyTitle} fontFamily={fontFamily} fontSize={fontSize} lineHeight={1.25} fill={template.ink} align="left" />
    <Line points={[116, 1738, 646, 1738]} stroke={template.line} strokeWidth={1.5} />
    <Text x={116} y={1758} width={560} text={copy.story.drinkTitles[drink.id]} fontFamily={fontFamily} fontStyle="bold" fontSize={drinkSize} fill={template.accent} />
    <Group x={726} y={1520} rotation={6}>
      <Rect x={-8} y={-8} width={254} height={324} fill={template.paper} cornerRadius={18} />
      {drinkImage && <CanvasImage image={drinkImage} width={238} height={306} />}
    </Group>
    <Accent kind="heart" x={666} y={1610} scale={0.72} color={template.accent} rotation={-12} />
    {logo && <CanvasImage image={logo} x={100} y={1802} width={54} height={54} />}
    <Text x={169} y={1819} width={558} text={copy.story.footer} fontFamily={fontFamily} fontSize={19} fill={template.ink} />
    {foreground && <CanvasImage image={foreground} width={STORY.width} height={STORY.height} />}
  </Layer>;
});

export default function StoryCanvas({ stageRef, photo, position, onPositionChange, template, drink, name, copy, onReady, onAssetError, onUpload, interactionDisabled }) {
  const holder = useRef(null);
  const [width, setWidth] = useState(270);
  const [fontReady, setFontReady] = useState(false);
  const [photoImage, photoStatus] = useImage(photo?.url || "");
  const [drinkImage, drinkStatus] = useImage(drink.image, "anonymous");
  const [logo, logoStatus] = useImage(GIRLS_DAY_LOGO, "anonymous");
  const [background, backgroundStatus] = useImage(template.backgroundImage || "", "anonymous");
  const [foreground, foregroundStatus] = useImage(template.foregroundImage || "", "anonymous");
  const gestures = usePinchZoom({ photo, frame: FRAME, position, onChange: onPositionChange });
  const size = photo ? photoSize(photo, FRAME, position.zoom) : null;
  const scale = width / STORY.width;

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(90, Math.floor(entry.contentRect.width / 9) * 9)));
    if (holder.current) observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => { if (active) setFontReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const statuses = [drinkStatus, logoStatus];
    if (photo) statuses.push(photoStatus);
    if (template.backgroundImage) statuses.push(backgroundStatus);
    if (template.foregroundImage) statuses.push(foregroundStatus);
    onReady(!!photo && statuses.every((status) => status === "loaded"));
    onAssetError(statuses.includes("failed"));
  }, [photo, photoStatus, drinkStatus, logoStatus, backgroundStatus, foregroundStatus, template, onReady, onAssetError]);

  return <div className="gdCanvasHolder" ref={holder}>
    <div className="gdCanvas" style={{ width, height: width * 16 / 9 }} role="group" aria-label={copy.preview}>
      <Stage ref={stageRef} width={width} height={width * 16 / 9} scaleX={scale} scaleY={scale} listening={false}>
        <Background template={template} background={background} />
        <Layer listening={false}>
          <Group clipFunc={clipPhoto}>
            {photoImage && size && <CanvasImage image={photoImage} x={FRAME.x + (FRAME.width - size.width) / 2 + position.x} y={FRAME.y + (FRAME.height - size.height) / 2 + position.y} width={size.width} height={size.height} />}
          </Group>
        </Layer>
        <Foreground template={template} drink={drink} drinkImage={drinkImage} logo={logo} foreground={foreground} name={name} copy={copy} fontReady={fontReady} />
      </Stage>
      {photo ? <div className="gdPhotoGesture" key={photo.url} tabIndex={interactionDisabled ? -1 : 0} role="group" aria-label={copy.photoFrame} aria-disabled={interactionDisabled || undefined}
        style={{ pointerEvents: interactionDisabled ? "none" : undefined, left: `${FRAME.x / STORY.width * 100}%`, top: `${FRAME.y / STORY.height * 100}%`, width: `${FRAME.width / STORY.width * 100}%`, height: `${FRAME.height / STORY.height * 100}%` }} {...(interactionDisabled ? {} : gestures)} />
        : <button type="button" className="gdPhotoPlaceholder" onClick={onUpload}>{copy.photoEmpty}<span>+</span></button>}
    </div>
  </div>;
}
