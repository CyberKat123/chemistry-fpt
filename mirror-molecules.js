import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const page = document.body.dataset.page || "home";
const canvas = document.getElementById("environment");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0, 11);

const ambient = new THREE.AmbientLight(0xffffff, 1.15);
const key = new THREE.PointLight(0xffffff, 82, 26);
key.position.set(-4, 5, 8);
const rim = new THREE.PointLight(0xff6f9f, 38, 22);
rim.position.set(5, -3, 6);
scene.add(ambient, key, rim);

const pageThemes = {
  home: { clear: 0x315879, colors: [0x8fcfff, 0xff6f9f, 0xffd377], density: 24 },
  lab: { clear: 0xc9eefd, colors: [0x87d7f5, 0xe8fbff, 0x2a739f], density: 20 },
  life: { clear: 0x07111b, colors: [0x14a8ff, 0x5bc6ff, 0xe8fbff], density: 26 },
  risks: { clear: 0xf7f8fa, colors: [0xe84f9a, 0x3ea4dc, 0xffffff], density: 30 },
  verdict: { clear: 0x24445f, colors: [0xff6f9f, 0x8758ff, 0xffd377], density: 24 }
};

const theme = pageThemes[page] || pageThemes.home;
renderer.setClearColor(theme.clear, 0.28);

const glass = (color, opacity = 0.48) => new THREE.MeshPhysicalMaterial({
  color,
  transparent: true,
  opacity,
  roughness: 0.08,
  transmission: 0.55,
  thickness: 1.2,
  clearcoat: 1,
  clearcoatRoughness: 0.05
});

const mat = {
  blue: glass(0x8fcfff, 0.45),
  pink: glass(0xff6f9f, 0.45),
  gold: glass(0xffd377, 0.48),
  green: glass(0x74df9d, 0.46),
  white: glass(0xffffff, 0.68),
  dark: new THREE.MeshStandardMaterial({ color: 0x152536, roughness: 0.32 }),
  bond: glass(0xe8fbff, 0.38)
};

function sphere(radius, material) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 24), material);
}

function cylinderBetween(a, b, radius, material) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 20), material);
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function makeChiralPair(scale = 1) {
  const group = new THREE.Group();
  const left = makeTetra(false, mat.blue);
  const right = makeTetra(true, mat.pink);
  left.position.x = -1.5;
  right.position.x = 1.5;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.04, 4.2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
  );
  group.add(left, right, plane);
  group.scale.setScalar(scale);
  return group;
}

function makeTetra(mirror = false, accent = mat.blue) {
  const group = new THREE.Group();
  const center = new THREE.Vector3(0, 0, 0);
  const points = [
    new THREE.Vector3(mirror ? -1 : 1, 1, 1),
    new THREE.Vector3(mirror ? 1 : -1, -1, 1),
    new THREE.Vector3(mirror ? 1 : -1, 1, -1),
    new THREE.Vector3(mirror ? -1 : 1, -1, -1)
  ];
  const mats = [accent, mat.green, mat.gold, mat.white];
  points.forEach((point, index) => {
    group.add(cylinderBetween(center, point, 0.055, mat.bond));
    const atom = sphere(index === 3 ? 0.22 : 0.34, mats[index]);
    atom.position.copy(point);
    group.add(atom);
  });
  group.add(sphere(0.42, mat.white));
  return group;
}

function makeCip() {
  const group = makeTetra(false, mat.blue);
  const labels = [
    ["1", 1.35, 1.35, 1.35],
    ["2", -1.35, -1.35, 1.35],
    ["3", -1.35, 1.35, -1.35],
    ["4", 1.35, -1.35, -1.35]
  ];
  labels.forEach(([text, x, y, z]) => {
    const sprite = makeTextSprite(text);
    sprite.position.set(x, y, z);
    group.add(sprite);
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.025, 12, 120), mat.gold);
  ring.rotation.x = Math.PI / 2.8;
  group.add(ring);
  return group;
}

function makeTextSprite(text) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const context = c.getContext("2d");
  context.fillStyle = "rgba(255,255,255,0.92)";
  context.beginPath();
  context.arc(64, 64, 48, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#17304b";
  context.font = "700 54px Oxygen";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 64, 66);
  const texture = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(0.55, 0.55, 0.55);
  return sprite;
}

function makeHelix(mirror = false) {
  const group = new THREE.Group();
  const nodesA = [];
  const nodesB = [];
  for (let i = 0; i < 36; i += 1) {
    const t = i / 35;
    const angle = t * Math.PI * 8 * (mirror ? -1 : 1);
    const y = (t - 0.5) * 5.8;
    nodesA.push(new THREE.Vector3(Math.cos(angle) * 0.75, y, Math.sin(angle) * 0.75));
    nodesB.push(new THREE.Vector3(Math.cos(angle + Math.PI) * 0.75, y, Math.sin(angle + Math.PI) * 0.75));
  }
  nodesA.forEach((node, index) => {
    const a = sphere(0.08, mirror ? mat.pink : mat.blue);
    const b = sphere(0.08, mat.white);
    a.position.copy(node);
    b.position.copy(nodesB[index]);
    group.add(a, b);
    if (index > 0) {
      group.add(cylinderBetween(nodesA[index - 1], node, 0.022, mat.bond));
      group.add(cylinderBetween(nodesB[index - 1], nodesB[index], 0.022, mat.bond));
    }
    if (index % 2 === 0) group.add(cylinderBetween(node, nodesB[index], 0.018, mat.bond));
  });
  return group;
}

function makeNetwork(accent = mat.blue) {
  const group = new THREE.Group();
  const nodes = [];
  for (let i = 0; i < 30; i += 1) {
    const angle = i * 1.62;
    const radius = 1 + (i % 6) * 0.22;
    const point = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(i * 0.7) * 1.1, Math.sin(angle) * radius);
    nodes.push(point);
    const dot = sphere(0.07 + (i % 3) * 0.02, i % 2 ? accent : mat.white);
    dot.position.copy(point);
    group.add(dot);
  }
  nodes.forEach((node, index) => {
    if (index > 0) group.add(cylinderBetween(nodes[index - 1], node, 0.012, mat.bond));
    if (index > 5 && index % 3 === 0) group.add(cylinderBetween(nodes[index - 5], node, 0.01, mat.bond));
  });
  return group;
}

function makeProteinCloud() {
  const group = new THREE.Group();
  for (let i = 0; i < 44; i += 1) {
    const bead = sphere(0.09 + (i % 4) * 0.02, i % 3 === 0 ? mat.pink : mat.blue);
    bead.position.set(Math.sin(i * 1.9) * 1.45, Math.cos(i * 1.2) * 1.15, Math.sin(i * 0.7) * 1.2);
    group.add(bead);
    if (i > 0) {
      const previous = group.children[group.children.length - 2];
      group.add(cylinderBetween(previous.position, bead.position, 0.015, mat.bond));
    }
  }
  return group;
}

function makeModel(type) {
  if (type === "cip") return makeCip();
  if (type === "dnaMirror") {
    const group = new THREE.Group();
    const a = makeHelix(false);
    const b = makeHelix(true);
    a.position.x = -1.2;
    b.position.x = 1.2;
    group.add(a, b);
    return group;
  }
  if (type === "polymerase") return makeProteinCloud();
  if (type === "magnet") return makeNetwork(mat.green);
  if (type === "meteor") return makeTetra(false, mat.gold);
  if (type === "polarized") return makeNetwork(mat.blue);
  if (type === "phageShield" || type === "invasive" || type === "immune") return makeNetwork(type === "immune" ? mat.pink : mat.green);
  if (type === "mirrorPeptide" || type === "thalidomide" || type === "dopa" || type === "ethambutol") return makeProteinCloud();
  if (type === "verdict") return makeChiralPair(0.9);
  return makeChiralPair(0.85);
}

const environment = new THREE.Group();
scene.add(environment);
for (let i = 0; i < theme.density; i += 1) {
  const color = theme.colors[i % theme.colors.length];
  const object = i % 3 === 0 ? makeTetra(i % 2 === 0, glass(color, 0.3)) : sphere(0.07 + (i % 4) * 0.035, glass(color, 0.28));
  object.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, -4 - Math.random() * 10);
  object.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  object.userData.speed = 0.001 + Math.random() * 0.003;
  environment.add(object);
}

const moleculeSources = {
  carvonePair: {
    label: "PubChem: (R)-(-)-carvone CID 439570 and (S)-(+)-carvone CID 16724",
    background: 0x315879,
    compounds: [{ cid: 439570, color: "cyan", name: "R-carvone", offset: -2.3 }, { cid: 16724, color: "magenta", name: "S-carvone", offset: 2.3 }]
  },
  bromochlorofluoromethane: {
    label: "PubChem: bromochlorofluoromethane CID 79058, a simple chiral tetrahedral carbon example",
    background: 0x315879,
    compounds: [{ cid: 79058, color: "cyan", name: "CHBrClF" }]
  },
  cipReal: {
    label: "PubChem: bromochlorofluoromethane CID 79058, used here for the CIP ranking demonstration",
    background: 0xc9eefd,
    compounds: [{ cid: 79058, color: "cyan", name: "CHBrClF" }]
  },
  thalidomide: {
    label: "PubChem: (R)-thalidomide CID 75792 and (S)-thalidomide CID 92142",
    background: 0xf7f8fa,
    compounds: [{ cid: 75792, color: "cyan", name: "R-thalidomide", offset: -2.6 }, { cid: 92142, color: "magenta", name: "S-thalidomide", offset: 2.6 }]
  },
  dopa: {
    label: "PubChem: L-DOPA CID 6047 and D-DOPA CID 92222",
    background: 0xf7f8fa,
    compounds: [{ cid: 6047, color: "cyan", name: "L-DOPA", offset: -2.4 }, { cid: 92222, color: "magenta", name: "D-DOPA", offset: 2.4 }]
  },
  ethambutol: {
    label: "PubChem: ethambutol CID 14052 and (R,R)-ethambutol CID 470071",
    background: 0xf7f8fa,
    compounds: [{ cid: 14052, color: "cyan", name: "Ethambutol", offset: -2.5 }, { cid: 470071, color: "magenta", name: "R,R-ethambutol", offset: 2.5 }]
  },
  dnaActual: {
    label: "RCSB PDB: 1BNA, Drew-Dickerson B-DNA dodecamer",
    background: 0x315879,
    pdb: "1BNA",
    style: "cartoon"
  },
  asfvPolX: {
    label: "RCSB PDB: 1JAJ, DNA polymerase X from African swine fever virus",
    background: 0x315879,
    pdb: "1JAJ",
    style: "cartoon"
  },
  alaninePair: {
    label: "PubChem: L-alanine CID 5950 and D-alanine CID 71080, mirror amino acid pair",
    background: 0xf7f8fa,
    compounds: [{ cid: 5950, color: "cyan", name: "L-alanine", offset: -1.6 }, { cid: 71080, color: "magenta", name: "D-alanine", offset: 1.6 }]
  },
  phenylalaninePair: {
    label: "PubChem: L-phenylalanine CID 6140 and D-phenylalanine CID 71567, mirror amino acid pair",
    background: 0xf7f8fa,
    compounds: [{ cid: 6140, color: "cyan", name: "L-phenylalanine", offset: -2.4 }, { cid: 71567, color: "magenta", name: "D-phenylalanine", offset: 2.4 }]
  },
  glucosePair: {
    label: "PubChem: D-glucose CID 5793 and L-glucose CID 79025, mirror sugar pair",
    background: 0x315879,
    compounds: [{ cid: 5793, color: "cyan", name: "D-glucose", offset: -2.1 }, { cid: 79025, color: "magenta", name: "L-glucose", offset: 2.1 }]
  },
  bacteriaMembrane: {
    label: "PubChem: N-acetylmuramic acid CID 439228, a peptidoglycan-related bacterial cell wall component",
    background: 0x315879,
    compounds: [{ cid: 439228, color: "green", name: "N-acetylmuramic acid" }]
  },
  verdict: {
    label: "PubChem: (R)- and (S)-carvone, revisiting chirality as a molecule-scale decision",
    background: 0x24445f,
    compounds: [{ cid: 439570, color: "cyan", name: "R-carvone", offset: -2.3 }, { cid: 16724, color: "magenta", name: "S-carvone", offset: 2.3 }]
  }
};

const viewerPanels = [];

function colorStyle(name) {
  if (name === "magenta") return "#e84f9a";
  if (name === "green") return "#54c889";
  return "#3ea4dc";
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.text();
}

async function loadCompound(viewer, compound) {
  const sdf = await fetchText(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.cid}/SDF?record_type=3d`);
  const model = viewer.addModel(sdf, "sdf");
  model.setStyle({}, {
    stick: { radius: 0.16, color: colorStyle(compound.color), opacity: 0.52 },
    sphere: { scale: 0.28, opacity: 0.9 }
  });
  if (compound.offset) {
    model.selectedAtoms({}).forEach((atom) => {
      atom.x += compound.offset;
    });
  }
}

async function init3DmolPanel(element) {
  const source = moleculeSources[element.dataset.model] || moleculeSources.carvonePair;

  if (!window.$3Dmol) {
    const label = document.createElement("div");
    label.className = "model-label";
    label.textContent = "3Dmol.js did not load. Check internet access and refresh.";
    element.appendChild(label);
    return null;
  }

  const isPair = source.compounds && source.compounds.length > 1;
  if (isPair) {
    element.classList.add("has-pair");
  }

  const viewerRoot = document.createElement("div");
  viewerRoot.className = "viewer-single";
  element.appendChild(viewerRoot);

  const viewer = window.$3Dmol.createViewer(viewerRoot, {
    backgroundColor: source.background || 0x315879,
    antialias: true
  });
  if (viewer.setBackgroundColor) {
    viewer.setBackgroundColor(source.background || 0x315879);
  }
  const label = document.createElement("div");
  label.className = "model-label";
  label.textContent = source.label;
  element.appendChild(label);

  try {
    if (source.pdb) {
      const pdb = await fetchText(`https://files.rcsb.org/download/${source.pdb}.pdb`);
      viewer.addModel(pdb, "pdb");
      viewer.setStyle({}, source.style === "cartoon"
        ? { cartoon: { color: "spectrum", opacity: 0.86 } }
        : { stick: { radius: 0.12 }, sphere: { scale: 0.18 } });
    } else if (isPair) {
      await Promise.all(source.compounds.map((compound) => loadCompound(viewer, compound)));
      source.compounds.forEach((compound) => {
        if (compound.name && compound.offset) {
          viewer.addLabel(compound.name, {
            position: { x: compound.offset, y: -2.1, z: 0 },
            fontColor: "white",
            backgroundColor: "rgba(25,45,65,0.72)",
            inFront: true,
            showBackground: true
          });
        }
      });
    } else {
      await loadCompound(viewer, source.compounds[0]);
    }
    viewer.zoomTo();
    viewer.rotate(18, "y");
    viewer.rotate(-12, "x");
    viewer.render();
  } catch (error) {
    label.textContent = `${source.label}. Structure failed to load from source.`;
  }

  return { element, viewer };
}

document.querySelectorAll("[data-model]").forEach((element) => {
  init3DmolPanel(element).then((panel) => {
    if (panel) viewerPanels.push(panel);
  });
});

let mouseX = 0;
let mouseY = 0;
window.addEventListener("pointermove", (event) => {
  mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
});

function animate(time) {
  const seconds = time * 0.001;
  camera.position.x += (mouseX * 0.42 - camera.position.x) * 0.04;
  camera.position.y += (-mouseY * 0.28 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);
  environment.children.forEach((object, index) => {
    object.rotation.x += object.userData.speed;
    object.rotation.y += object.userData.speed * 1.4;
    object.position.y += Math.sin(seconds + index) * 0.0012;
  });
  renderer.render(scene, camera);

  viewerPanels.forEach((panel) => {
    panel.viewer.rotate(0.18, "y");
    panel.viewer.render();
  });

  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  viewerPanels.forEach((panel) => {
    panel.viewer.resize();
    panel.viewer.render();
  });
});

requestAnimationFrame(animate);
