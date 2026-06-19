import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { Accessor, Document, NodeIO } from "@gltf-transform/core";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const sourceWrap = path.join(scriptDir, "assets", "moment-wrap-reference.png");
const outputDir = path.join(projectRoot, "public", "models");
const labelPath = path.join(outputDir, "moment-label.png");
const modelPath = path.join(outputDir, "moment-cup.glb");

await fs.mkdir(outputDir, { recursive: true });
await createLabelTexture(sourceWrap, labelPath);
await createMomentCup(modelPath, labelPath);

console.log(`Generated ${modelPath}`);

async function createLabelTexture(sourcePath, outputPath) {
  const crop = await sharp(sourcePath)
    .extract({ left: 0, top: 315, width: 1254, height: 610 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(crop.data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const warmPanel = r - b > 3 || g - b > 2;
    const artwork = r < 222 || g < 222 || b < 222;
    pixels[i + 3] = warmPanel || artwork ? 255 : 0;
  }

  const isolated = await sharp(pixels, { raw: crop.info })
    .resize({ width: 1880, height: 512, fit: "fill" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  await sharp({
    create: {
      width: 2048,
      height: 512,
      channels: 4,
      background: { r: 247, g: 242, b: 231, alpha: 1 },
    },
  })
    .composite([{ input: isolated, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath);
}

async function createMomentCup(outputPath, texturePath) {
  const doc = new Document();
  const buffer = doc.createBuffer("MomentCupBuffer");
  const scene = doc.createScene("MomentCupScene");

  const texture = doc
    .createTexture("MomentLabelTexture")
    .setImage(await fs.readFile(texturePath))
    .setMimeType("image/png");

  const plastic = doc
    .createMaterial("ClearPET")
    .setBaseColorFactor([0.92, 0.97, 1.0, 0.24])
    .setRoughnessFactor(0.08)
    .setMetallicFactor(0)
    .setAlphaMode("BLEND")
    .setDoubleSided(true);

  const lidPlastic = doc
    .createMaterial("ClearLidPET")
    .setBaseColorFactor([0.95, 0.98, 1.0, 0.32])
    .setRoughnessFactor(0.06)
    .setMetallicFactor(0)
    .setAlphaMode("BLEND")
    .setDoubleSided(true);

  const labelMaterial = doc
    .createMaterial("MomentPrintedWrap")
    .setBaseColorFactor([1, 1, 1, 1])
    .setBaseColorTexture(texture)
    .setRoughnessFactor(0.76)
    .setMetallicFactor(0)
    .setDoubleSided(true);

  const sipOpeningMaterial = doc
    .createMaterial("SipOpening")
    .setBaseColorFactor([0.025, 0.045, 0.055, 0.72])
    .setRoughnessFactor(0.12)
    .setMetallicFactor(0)
    .setAlphaMode("BLEND")
    .setDoubleSided(true);

  const liquidMaterial = doc
    .createMaterial("CoffeeLiquid")
    .setBaseColorFactor([0.24, 0.075, 0.018, 0.92])
    .setRoughnessFactor(0.12)
    .setMetallicFactor(0)
    .setAlphaMode("BLEND")
    .setDoubleSided(true);

  const milkMaterial = doc
    .createMaterial("MilkLiquid")
    .setBaseColorFactor([0.94, 0.83, 0.66, 0.97])
    .setRoughnessFactor(0.22)
    .setMetallicFactor(0)
    .setAlphaMode("BLEND")
    .setDoubleSided(true);

  const cremaMaterial = doc
    .createMaterial("Crema")
    .setBaseColorFactor([0.66, 0.3, 0.075, 0.96])
    .setRoughnessFactor(0.18)
    .setMetallicFactor(0)
    .setAlphaMode("BLEND")
    .setDoubleSided(true);

  const creamBlendMaterial = doc
    .createMaterial("CoffeeCreamBlend")
    .setBaseColorFactor([0.72, 0.38, 0.14, 0.34])
    .setRoughnessFactor(0.18)
    .setMetallicFactor(0)
    .setAlphaMode("BLEND")
    .setDoubleSided(true);

  const iceMaterial = doc
    .createMaterial("Ice")
    .setBaseColorFactor([0.72, 0.9, 1.0, 0.46])
    .setRoughnessFactor(0.12)
    .setMetallicFactor(0)
    .setAlphaMode("BLEND")
    .setDoubleSided(true);

  const rig = doc
    .createNode("MomentCupRig")
    .setExtras({
      brand: "Moment",
      cupSizeOz: 12,
      statusNodes: {
        liquid: "Liquid",
        ice: "IceGroup",
        lid: "Lid",
        label: "Label",
      },
    });
  scene.addChild(rig);

  const cupProfile = [
    { r: 0.322, y: 0.015 },
    { r: 0.35, y: 0.025 },
    { r: 0.366, y: 0.052 },
    { r: 0.365, y: 0.082 },
    { r: 0.352, y: 0.106 },
    { r: 0.37, y: 0.136 },
    { r: 0.482, y: 1.145 },
    { r: 0.5, y: 1.18 },
    { r: 0.515, y: 1.198 },
    { r: 0.542, y: 1.212 },
    { r: 0.548, y: 1.235 },
    { r: 0.538, y: 1.264 },
  ];

  const cup = createMeshNode(doc, buffer, "Cup", lathe(cupProfile, 128), plastic);
  cup.setExtras({ role: "cup", material: "PET" });
  rig.addChild(cup);

  const bottom = createMeshNode(
    doc,
    buffer,
    "CupBottom",
    lathe([
      { r: 0, y: 0.035 },
      { r: 0.32, y: 0.035 },
      { r: 0.34, y: 0.055 },
      { r: 0, y: 0.065 },
    ], 96),
    plastic
  );
  rig.addChild(bottom);

  const cupInner = createMeshNode(
    doc,
    buffer,
    "CupInner",
    lathe([
      { r: 0.346, y: 0.11 },
      { r: 0.365, y: 0.15 },
      { r: 0.486, y: 1.17 },
      { r: 0.505, y: 1.2 },
    ], 128),
    plastic
  );
  cupInner.setExtras({ role: "inner-wall", material: "PET" });
  rig.addChild(cupInner);

  [
    [0.345, 0.018, 0.047],
    [0.356, 0.012, 0.078],
    [0.535, 0.012, 1.218],
    [0.542, 0.013, 1.245],
  ].forEach(([radius, tube, y], index) => {
    const ring = createMeshNode(
      doc,
      buffer,
      `CupRing_${index + 1}`,
      torusGeometry(radius, tube, 12, 128),
      plastic
    ).setTranslation([0, y, 0]);
    rig.addChild(ring);
  });

  const label = createMeshNode(
    doc,
    buffer,
    "Label",
    lathe([
      { r: 0.382, y: 0.255 },
      { r: 0.468, y: 0.96 },
    ], 128),
    labelMaterial
  );
  label.setExtras({ role: "label", texture: "Moment wrap" });
  rig.addChild(label);

  const lidProfile = [
    { r: 0.49, y: 1.235 },
    { r: 0.558, y: 1.242 },
    { r: 0.58, y: 1.258 },
    { r: 0.584, y: 1.282 },
    { r: 0.575, y: 1.306 },
    { r: 0.548, y: 1.322 },
    { r: 0.52, y: 1.334 },
    { r: 0.49, y: 1.35 },
    { r: 0.46, y: 1.37 },
    { r: 0.425, y: 1.392 },
    { r: 0.395, y: 1.404 },
    { r: 0.08, y: 1.408 },
    { r: 0, y: 1.408 },
  ];
  const lid = createMeshNode(doc, buffer, "Lid", lathe(lidProfile, 160), lidPlastic);
  lid.setExtras({ role: "lid" });
  rig.addChild(lid);

  [
    [0.568, 0.018, 1.276],
    [0.542, 0.012, 1.316],
    [0.486, 0.01, 1.354],
    [0.414, 0.012, 1.4],
  ].forEach(([radius, tube, y], index) => {
    const ring = createMeshNode(
      doc,
      buffer,
      `LidRing_${index + 1}`,
      torusGeometry(radius, tube, 12, 144),
      lidPlastic
    ).setTranslation([0, y, 0]);
    rig.addChild(ring);
  });

  const sipRim = createMeshNode(
    doc,
    buffer,
    "SipRim",
    superellipsoidGeometry(24, 12, 4.5),
    lidPlastic
  );
  sipRim
    .setTranslation([0, 1.354, 0.47])
    .setRotation(quaternionFromEuler(-0.2, 0, 0))
    .setScale([0.145, 0.018, 0.058])
    .setExtras({ role: "sip-slot-rim" });
  rig.addChild(sipRim);

  const sipOpening = createMeshNode(
    doc,
    buffer,
    "SipOpening",
    superellipsoidGeometry(24, 12, 4.5),
    sipOpeningMaterial
  );
  sipOpening
    .setTranslation([0, 1.358, 0.482])
    .setRotation(quaternionFromEuler(-0.2, 0, 0))
    .setScale([0.112, 0.01, 0.036])
    .setExtras({ role: "sip-opening" });
  rig.addChild(sipOpening);

  const liquid = doc
    .createNode("Liquid")
    .setTranslation([0, 0.14, 0])
    .setExtras({ role: "liquid", scaleOrigin: "bottom", emptyScaleY: 0.01, fullScaleY: 1 });
  rig.addChild(liquid);

  const milk = createMeshNode(
    doc,
    buffer,
    "MilkLayer",
    lathe([
      { r: 0, y: 0 },
      { r: 0.344, y: 0 },
      { r: 0.418, y: 0.68 },
      { r: 0, y: 0.68 },
    ], 96),
    milkMaterial
  );
  liquid.addChild(milk);

  const coffee = createMeshNode(
    doc,
    buffer,
    "CoffeeLayer",
    lathe([
      { r: 0, y: 0.42 },
      { r: 0.39, y: 0.42 },
      { r: 0.465, y: 1.04 },
      { r: 0, y: 1.04 },
    ], 96),
    liquidMaterial
  );
  liquid.addChild(coffee);

  const creamBlend = createMeshNode(
    doc,
    buffer,
    "CoffeeCreamBlend",
    lathe([
      { r: 0, y: 0.55 },
      { r: 0.405, y: 0.55 },
      { r: 0.458, y: 1.01 },
      { r: 0, y: 1.01 },
    ], 96),
    creamBlendMaterial
  );
  liquid.addChild(creamBlend);

  const crema = createMeshNode(
    doc,
    buffer,
    "CremaTop",
    lathe([
      { r: 0, y: 1.035 },
      { r: 0.462, y: 1.035 },
      { r: 0.463, y: 1.058 },
      { r: 0, y: 1.058 },
    ], 96),
    cremaMaterial
  );
  liquid.addChild(crema);

  const iceMesh = createMesh(doc, buffer, "IceCubeMesh", createRoundedIceGeometry(), iceMaterial);
  const iceGroup = doc.createNode("IceGroup").setExtras({ role: "ice", showWhen: "ready" });
  rig.addChild(iceGroup);

  const iceLayout = [
    [-0.24, 1.02, 0.1, [0.13, 0.09, 0.12], [0.25, 0.1, 0.4]],
    [0.02, 1.055, 0.22, [0.145, 0.1, 0.13], [-0.2, 0.45, 0.18]],
    [0.25, 1.0, 0.025, [0.12, 0.085, 0.14], [0.32, -0.24, 0.5]],
    [-0.09, 1.13, -0.13, [0.135, 0.095, 0.12], [-0.35, 0.2, -0.12]],
    [0.2, 1.145, -0.18, [0.115, 0.08, 0.12], [0.16, 0.4, -0.3]],
    [-0.28, 1.165, -0.09, [0.105, 0.075, 0.11], [0.4, -0.1, 0.2]],
    [0.015, 1.205, 0.025, [0.12, 0.085, 0.115], [0.28, 0.35, 0.12]],
    [0.3, 1.16, 0.12, [0.1, 0.07, 0.105], [-0.12, 0.25, 0.38]],
    [-0.16, 1.23, 0.16, [0.105, 0.075, 0.1], [0.38, -0.2, 0.14]],
  ];

  iceLayout.forEach(([x, y, z, scale, rotation], index) => {
    const node = doc
      .createNode(`Ice_${String(index + 1).padStart(2, "0")}`)
      .setMesh(iceMesh)
      .setTranslation([x, y, z])
      .setScale(scale)
      .setRotation(quaternionFromEuler(...rotation))
      .setExtras({ role: "ice-cube" });
    iceGroup.addChild(node);
  });

  const io = new NodeIO();
  await io.write(outputPath, doc);
}

function createMeshNode(doc, buffer, name, geometry, material) {
  return doc.createNode(name).setMesh(createMesh(doc, buffer, `${name}Mesh`, geometry, material));
}

function createMesh(doc, buffer, name, geometry, material) {
  const position = doc
    .createAccessor(`${name}Position`)
    .setType(Accessor.Type.VEC3)
    .setArray(new Float32Array(geometry.positions))
    .setBuffer(buffer);
  const normal = doc
    .createAccessor(`${name}Normal`)
    .setType(Accessor.Type.VEC3)
    .setArray(new Float32Array(geometry.normals))
    .setBuffer(buffer);
  const texcoord = doc
    .createAccessor(`${name}Texcoord`)
    .setType(Accessor.Type.VEC2)
    .setArray(new Float32Array(geometry.uvs))
    .setBuffer(buffer);
  const indices = doc
    .createAccessor(`${name}Indices`)
    .setType(Accessor.Type.SCALAR)
    .setArray(new Uint16Array(geometry.indices))
    .setBuffer(buffer);

  const primitive = doc
    .createPrimitive()
    .setAttribute("POSITION", position)
    .setAttribute("NORMAL", normal)
    .setAttribute("TEXCOORD_0", texcoord)
    .setIndices(indices)
    .setMaterial(material);

  return doc.createMesh(name).addPrimitive(primitive);
}

function lathe(profile, segments) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j < profile.length; j += 1) {
    const prev = profile[Math.max(0, j - 1)];
    const next = profile[Math.min(profile.length - 1, j + 1)];
    const dr = next.r - prev.r;
    const dy = next.y - prev.y;
    const normalLength = Math.hypot(dy, dr) || 1;
    const radial = dy / normalLength;
    const normalY = -dr / normalLength;

    for (let i = 0; i <= segments; i += 1) {
      const u = i / segments;
      const angle = u * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      positions.push(profile[j].r * cos, profile[j].y, profile[j].r * sin);
      normals.push(radial * cos, normalY, radial * sin);
      uvs.push(1 - u, 1 - j / Math.max(1, profile.length - 1));
    }
  }

  for (let j = 0; j < profile.length - 1; j += 1) {
    for (let i = 0; i < segments; i += 1) {
      const a = j * (segments + 1) + i;
      const b = a + segments + 1;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  return { positions, normals, uvs, indices };
}

function torusGeometry(majorRadius, tubeRadius, radialSegments, tubularSegments) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= radialSegments; j += 1) {
    const v = (j / radialSegments) * Math.PI * 2;
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);

    for (let i = 0; i <= tubularSegments; i += 1) {
      const u = (i / tubularSegments) * Math.PI * 2;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      const radius = majorRadius + tubeRadius * cosV;

      positions.push(radius * cosU, tubeRadius * sinV, radius * sinU);
      normals.push(cosV * cosU, sinV, cosV * sinU);
      uvs.push(i / tubularSegments, j / radialSegments);
    }
  }

  const stride = tubularSegments + 1;
  for (let j = 0; j < radialSegments; j += 1) {
    for (let i = 0; i < tubularSegments; i += 1) {
      const a = j * stride + i;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return { positions, normals, uvs, indices };
}

function sphereGeometry(widthSegments = 12, heightSegments = 8) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let y = 0; y <= heightSegments; y += 1) {
    const v = y / heightSegments;
    const phi = v * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let x = 0; x <= widthSegments; x += 1) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;
      const px = sinPhi * Math.cos(theta);
      const py = cosPhi;
      const pz = sinPhi * Math.sin(theta);
      positions.push(px, py, pz);
      normals.push(px, py, pz);
      uvs.push(u, 1 - v);
    }
  }

  const stride = widthSegments + 1;
  for (let y = 0; y < heightSegments; y += 1) {
    for (let x = 0; x < widthSegments; x += 1) {
      const a = y * stride + x;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return { positions, normals, uvs, indices };
}

function superellipsoidGeometry(widthSegments, heightSegments, exponent) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const power = 2 / exponent;

  for (let y = 0; y <= heightSegments; y += 1) {
    const v = y / heightSegments;
    const latitude = -Math.PI / 2 + v * Math.PI;
    const cosLat = signedPower(Math.cos(latitude), power);
    const py = signedPower(Math.sin(latitude), power);

    for (let x = 0; x <= widthSegments; x += 1) {
      const u = x / widthSegments;
      const longitude = -Math.PI + u * Math.PI * 2;
      const px = cosLat * signedPower(Math.cos(longitude), power);
      const pz = cosLat * signedPower(Math.sin(longitude), power);
      const length = Math.hypot(px, py, pz) || 1;
      positions.push(px, py, pz);
      normals.push(px / length, py / length, pz / length);
      uvs.push(u, v);
    }
  }

  const stride = widthSegments + 1;
  for (let y = 0; y < heightSegments; y += 1) {
    for (let x = 0; x < widthSegments; x += 1) {
      const a = y * stride + x;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return { positions, normals, uvs, indices };
}

function createRoundedIceGeometry() {
  const geometry = new RoundedBoxGeometry(2, 2, 2, 3, 0.26);
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const texcoord = geometry.getAttribute("uv");
  const positions = Array.from(position.array);
  const normals = Array.from(normal.array);
  const uvs = texcoord ? Array.from(texcoord.array) : new Array(position.count * 2).fill(0);
  const indices = geometry.getIndex()
    ? Array.from(geometry.getIndex().array)
    : Array.from({ length: position.count }, (_, index) => index);

  geometry.dispose();
  return { positions, normals, uvs, indices };
}

function mergeScaledSpheres(base, placements) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const vertexCount = base.positions.length / 3;

  placements.forEach(({ position, scale }, placementIndex) => {
    for (let index = 0; index < vertexCount; index += 1) {
      const offset = index * 3;
      const x = base.positions[offset];
      const y = base.positions[offset + 1];
      const z = base.positions[offset + 2];
      positions.push(
        position[0] + x * scale[0],
        position[1] + y * scale[1],
        position[2] + z * scale[2]
      );

      const nx = x / scale[0];
      const ny = y / scale[1];
      const nz = z / scale[2];
      const length = Math.hypot(nx, ny, nz) || 1;
      normals.push(nx / length, ny / length, nz / length);
    }

    uvs.push(...base.uvs);
    const vertexOffset = placementIndex * vertexCount;
    base.indices.forEach((index) => indices.push(index + vertexOffset));
  });

  return { positions, normals, uvs, indices };
}

function signedPower(value, power) {
  return Math.sign(value) * Math.pow(Math.abs(value), power);
}

function boxGeometry() {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const faces = [
    { n: [1, 0, 0], v: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]] },
    { n: [-1, 0, 0], v: [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]] },
    { n: [0, 1, 0], v: [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]] },
    { n: [0, -1, 0], v: [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]] },
    { n: [0, 0, 1], v: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
    { n: [0, 0, -1], v: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
  ];

  faces.forEach((face) => {
    const base = positions.length / 3;
    face.v.forEach((vertex) => {
      positions.push(vertex[0], vertex[1], vertex[2]);
      normals.push(face.n[0], face.n[1], face.n[2]);
    });
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  return { positions, normals, uvs, indices };
}

function quaternionFromEuler(x, y, z) {
  const cx = Math.cos(x / 2);
  const sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2);
  const sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2);
  const sz = Math.sin(z / 2);

  return [
    sx * cy * cz - cx * sy * sz,
    cx * sy * cz + sx * cy * sz,
    cx * cy * sz - sx * sy * cz,
    cx * cy * cz + sx * sy * sz,
  ];
}
