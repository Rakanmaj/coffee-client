import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  AdaptiveDpr,
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { useDriveThroughLanguage } from "../context/driveThroughLanguage";

const MODEL_URL = "/models/moment-cup.glb";

export default function MomentCupScene({ status = "showcase", mode = "hero" }) {
  const { t } = useDriveThroughLanguage();
  const compact = mode === "status";
  const [modelReady, setModelReady] = useState(false);
  const loading = !modelReady;

  return (
    <div className={`momentCupCanvas momentCupCanvas-${mode}`}>
      {loading ? (
        <div className="momentModelLoader visible" aria-hidden="true">
          <span />
          <b>{t("craftingMoment")}</b>
        </div>
      ) : null}
      <Canvas
        camera={{ position: [0, 0.5, compact ? 3.05 : 3.2], fov: 32 }}
        dpr={[1, 1.25]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        shadows
      >
        <ambientLight intensity={1.45} />
        <hemisphereLight args={["#f8fbff", "#6e543f", 1.25]} />
        <directionalLight
          castShadow
          color="#fff7e9"
          intensity={3.2}
          position={[3.5, 5, 4]}
          shadow-mapSize-width={256}
          shadow-mapSize-height={256}
        />
        <directionalLight color="#a7d9d5" intensity={1.4} position={[-3, 2, 2]} />

        <Environment resolution={64}>
          <Lightformer
            form="rect"
            intensity={4.5}
            color="#fff4df"
            position={[1.8, 3.5, 4]}
            scale={[4, 4, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2.8}
            color="#c9efec"
            position={[-3, 1.5, 2]}
            rotation={[0, Math.PI / 3, 0]}
            scale={[3, 5, 1]}
          />
          <Lightformer
            form="ring"
            intensity={2.2}
            color="#ffffff"
            position={[0, 4, -2]}
            scale={2.5}
          />
        </Environment>

        <Suspense fallback={null}>
          <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.16}>
            <MomentCupModel status={status} compact={compact} onReady={() => setModelReady(true)} />
          </Float>

          <ResponsiveContactShadow compact={compact} />
        </Suspense>
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}

function MomentCupModel({ status, compact, onReady }) {
  const group = useRef();
  const liquidRef = useRef();
  const iceRef = useRef();
  const { scene } = useGLTF(MODEL_URL);
  const canvasWidth = useThree((state) => state.size.width);
  const modelScale = getResponsiveScale(canvasWidth, compact);
  const baseY = getResponsiveBaseY(modelScale);

  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      if (!object.isMesh) return;

      const materialName = object.material.name;
      object.castShadow = !["ClearPET", "ClearLidPET", "Ice"].includes(materialName);
      object.receiveShadow = true;
      object.frustumCulled = false;
      object.material = createSceneMaterial(object.material);

      if (object.material.name === "MomentPrintedWrap") {
        object.material.roughness = 0.72;
        object.material.envMapIntensity = 0.45;
      }

      object.renderOrder = getRenderOrder(object.material.name);
    });

    return clone;
  }, [scene]);

  useEffect(() => {
    liquidRef.current = model.getObjectByName("Liquid");
    iceRef.current = model.getObjectByName("IceGroup");
    const timer = window.setTimeout(onReady, 250);
    return () => window.clearTimeout(timer);
  }, [model, onReady]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const liquid = liquidRef.current;
    const ice = iceRef.current;
    const targetFill = getFillTarget(status);
    if (liquid) {
      liquid.scale.y = THREE.MathUtils.damp(liquid.scale.y, targetFill, 3.4, delta);
      liquid.visible = liquid.scale.y > 0.018;
    }

    if (ice) {
      const showIce = ["showcase", "ready", "delivered"].includes(status);
      const targetScale = showIce ? 1 : 0.001;
      const nextScale = THREE.MathUtils.damp(ice.scale.x, targetScale, 5, delta);
      ice.scale.setScalar(nextScale);
      ice.visible = nextScale > 0.01;
    }

    group.current.position.x = 0;
    group.current.position.y = baseY;
    group.current.rotation.y = state.clock.elapsedTime * (status === "pending" ? 0.18 : 0.1);
  });

  return (
    <group ref={group} position={[0, baseY, 0]} scale={modelScale}>
      <primitive object={model} />
    </group>
  );
}

function ResponsiveContactShadow({ compact }) {
  const canvasWidth = useThree((state) => state.size.width);
  const modelScale = getResponsiveScale(canvasWidth, compact);
  const baseY = getResponsiveBaseY(modelScale);

  return (
    <ContactShadows
      position={[0, baseY - 0.13, 0]}
      opacity={0.28}
      scale={2.4 * (modelScale / 0.95)}
      blur={2.5}
      far={1.8}
      resolution={128}
      frames={1}
      color="#17304b"
    />
  );
}

function getResponsiveScale(canvasWidth, compact) {
  const progress = THREE.MathUtils.clamp((canvasWidth - 320) / 780, 0, 1);
  const minScale = compact ? 0.62 : 0.58;
  const maxScale = compact ? 0.88 : 0.95;
  return THREE.MathUtils.lerp(minScale, maxScale, progress);
}

function getResponsiveBaseY(modelScale) {
  return -0.02 - modelScale * 0.704;
}

function createSceneMaterial(source) {
  const name = source.name;

  if (name === "ClearPET" || name === "ClearLidPET") {
    const lid = name === "ClearLidPET";
    return new THREE.MeshPhysicalMaterial({
      name,
      color: lid ? "#eaf8ff" : "#dff3f7",
      roughness: lid ? 0.09 : 0.07,
      metalness: 0,
      transmission: lid ? 0.38 : 0.2,
      thickness: lid ? 0.12 : 0.075,
      ior: 1.46,
      clearcoat: 1,
      clearcoatRoughness: 0.035,
      transparent: true,
      opacity: lid ? 0.32 : 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 1.8,
    });
  }

  if (name === "Ice") {
    return new THREE.MeshPhysicalMaterial({
      name,
      color: "#e3f6ff",
      roughness: 0.08,
      metalness: 0,
      transmission: 0.32,
      thickness: 0.28,
      ior: 1.31,
      clearcoat: 1,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      envMapIntensity: 2.1,
    });
  }

  if (["CoffeeLiquid", "MilkLiquid", "CoffeeCreamBlend", "Crema"].includes(name)) {
    const settings = {
      CoffeeLiquid: { color: "#4f1704", opacity: 0.82, roughness: 0.11, transmission: 0 },
      MilkLiquid: { color: "#f0d4a5", opacity: 0.95, roughness: 0.2, transmission: 0.08 },
      CoffeeCreamBlend: { color: "#c17b42", opacity: 0.2, roughness: 0.18, transmission: 0.04 },
      Crema: { color: "#b55a18", opacity: 0.97, roughness: 0.17, transmission: 0.02 },
    }[name];

    const material = new THREE.MeshPhysicalMaterial({
      name,
      ...settings,
      metalness: 0,
      ior: 1.35,
      clearcoat: 0.72,
      clearcoatRoughness: 0.12,
      transparent: true,
      depthWrite: name === "MilkLiquid",
      side: THREE.DoubleSide,
      envMapIntensity: 1.25,
    });
    return material;
  }

  return source.clone();
}

function getRenderOrder(materialName) {
  if (["MilkLiquid", "CoffeeLiquid", "CoffeeCreamBlend", "Crema"].includes(materialName)) return 1;
  if (["ClearPET", "ClearLidPET", "Ice"].includes(materialName)) return 3;
  if (materialName === "MomentPrintedWrap") return 4;
  return 0;
}

function getFillTarget(status) {
  if (status === "pending") return 0.001;
  if (status === "working") return 0.72;
  return 1;
}

useGLTF.preload(MODEL_URL);
