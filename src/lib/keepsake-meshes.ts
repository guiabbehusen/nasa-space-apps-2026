import * as T from "three";
import type { Keepsake } from "./keepsake";

export function buildKeepsake(m: Keepsake) {
  const group = new T.Group();
  const color = new T.Color(m.color);
  const body = new T.MeshStandardMaterial({
    color,
    roughness: 0.73,
    flatShading: true,
  });
  const accent = body.clone();
  accent.color.lerp(new T.Color("#eab582"), 0.5);
  const light = body.clone();
  light.color.lerp(new T.Color("#fff1dd"), 0.72);
  const dark = new T.MeshStandardMaterial({
    color: "#28313b",
    roughness: 0.53,
  });
  const gold = new T.MeshStandardMaterial({
    color: "#d79a44",
    roughness: 0.58,
  });
  const add = (
    geometry: T.BufferGeometry,
    mat: T.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new T.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  const ball = (
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    mat = body,
  ) => {
    const mesh = add(new T.SphereGeometry(1, 10, 7), mat, x, y, z);
    mesh.scale.set(sx, sy, sz);
    return mesh;
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat = body,
  ) => add(new T.BoxGeometry(w, h, d), mat, x, y, z);
  const cylinder = (
    x: number,
    y: number,
    z: number,
    top: number,
    bottom: number,
    h: number,
    mat = body,
  ) => add(new T.CylinderGeometry(top, bottom, h, 10), mat, x, y, z);
  const tip = (
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    mat = accent,
  ) => add(new T.ConeGeometry(r, h, 5), mat, x, y, z);
  const detail = ((m.variant * 5) % 13) / 12;
  const widthFactor = 1.06 + Math.sin(m.variant * 2.4) * 0.1;
  const animal = ["dog", "cat", "teddy bear"].includes(m.kind);
  if (animal) {
    const bear = m.kind === "teddy bear",
      cat = m.kind === "cat";
    const headY = bear ? 1.36 : 1.18,
      headZ = bear ? 0.1 : 0.46;
    ball(0, 0.66, -0.1, 0.47 * widthFactor, 0.63, bear ? 0.42 : 0.64);
    ball(0, headY, headZ, 0.47 * widthFactor, 0.44 + detail * 0.035, 0.42);
    for (const side of [-1, 1]) {
      if (cat)
        tip(side * 0.3, headY + 0.4, headZ, 0.19, 0.45).rotation.z =
          -side * 0.15;
      else if (bear) {
        ball(side * 0.36, headY + 0.34, headZ, 0.21, 0.22, 0.13);
        ball(side * 0.36, headY + 0.34, headZ + 0.07, 0.13, 0.14, 0.09, accent);
      } else {
        const ear = ball(
          side * 0.4,
          headY + 0.04,
          headZ - 0.02,
          0.16,
          0.33 + detail * 0.1,
          0.22,
          accent,
        );
        ear.rotation.z = side * (0.12 + detail * 0.17);
      }
      ball(side * 0.17, headY + 0.08, headZ + 0.38, 0.055, 0.065, 0.045, dark);
      ball(
        side * 0.17 - 0.015,
        headY + 0.1,
        headZ + 0.416,
        0.015,
        0.015,
        0.012,
        light,
      );
      ball(side * 0.28, 0.24, 0.18, 0.19, 0.23, 0.24, light);
      if (bear)
        ball(side * 0.44, 0.82, 0, 0.19, 0.36, 0.2).rotation.z = side * 0.46;
      else ball(side * 0.31, 0.28, -0.49, 0.2, 0.27, 0.25);
    }
    ball(0, headY - 0.09, headZ + 0.37, 0.23, 0.17, cat ? 0.12 : 0.24, light);
    ball(
      0,
      headY - 0.018,
      headZ + (cat ? 0.49 : 0.57),
      0.085,
      0.06,
      0.052,
      dark,
    );
    if (!bear) {
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(0, 0.62, -0.55),
        new T.Vector3(0.19, 0.74, -0.9),
        new T.Vector3(0.32, 1.01 + detail * 0.2, -1.0),
      ]);
      add(
        new T.TubeGeometry(curve, 14, cat ? 0.086 : 0.11, 9, false),
        accent,
        0,
        0,
        0,
      );
    }
  } else if (m.kind === "bird") {
    ball(0, 0.77, 0, 0.48 * widthFactor, 0.52, 0.66);
    ball(0, 1.15, 0.37, 0.35, 0.34, 0.36);
    const beak = tip(0, 1.12, 0.77, 0.13, 0.31, gold);
    beak.rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) {
      ball(s * 0.39, 0.77, -0.08, 0.17, 0.32, 0.48, accent).rotation.x =
        -0.35 - detail * 0.2;
      ball(s * 0.2, 1.23, 0.62, 0.047, 0.052, 0.04, dark);
      cylinder(s * 0.18, 0.22, 0, 0.035, 0.045, 0.3, gold);
      ball(s * 0.18, 0.09, 0.06, 0.1, 0.04, 0.13, gold);
    }
    ball(0, 0.67, -0.6, 0.24, 0.12, 0.48, accent).rotation.x = 0.22;
  } else if (m.kind === "cup" || m.kind === "bottle") {
    const cup = m.kind === "cup";
    const profile = cup
      ? [
          [0, 0],
          [0.37, 0],
          [0.45, 0.1],
          [0.56, 1.08 + detail * 0.12],
          [0.51, 1.12 + detail * 0.12],
          [0.43, 0.18],
          [0, 0.17],
        ]
      : [
          [0, 0],
          [0.36, 0],
          [0.41, 0.09],
          [0.41, 0.98],
          [0.39, 1.17],
          [0.19, 1.45 + detail * 0.12],
          [0.15, 1.62 + detail * 0.12],
          [0.15, 1.77 + detail * 0.12],
          [0, 1.77 + detail * 0.12],
        ];
    add(
      new T.LatheGeometry(
        profile.map(([r, h]) => new T.Vector2(r, h)),
        11,
      ),
      body,
      0,
      0,
      0,
    );
    if (cup) {
      const handle = add(
        new T.TorusGeometry(0.31, 0.084, 12, 32),
        accent,
        0.52,
        0.61,
        0,
      );
      handle.scale.set(0.87, 1.05 + detail * 0.15, 1);
    } else {
      cylinder(0, 1.77 + detail * 0.12, 0, 0.18, 0.18, 0.16, accent);
      cylinder(0, 0.65, 0, 0.417, 0.417, 0.34, light);
    }
  } else if (m.kind === "car") {
    box(0, 0.4, 0, 1.02, 0.36, 1.89, body);
    ball(0, 0.64, -0.08, 0.5, 0.4 * widthFactor, 0.66, accent);
    ball(0, 0.68, -0.04, 0.509, 0.28, 0.52, dark);
    for (const s of [-1, 1])
      for (const z of [-0.59, 0.62]) {
        const wheel = cylinder(s * 0.52, 0.28, z, 0.219, 0.219, 0.11, dark);
        wheel.rotation.z = Math.PI / 2;
        cylinder(s * 0.585, 0.28, z, 0.104, 0.104, 0.04, light).rotation.z =
          Math.PI / 2;
      }
    for (const s of [-1, 1]) box(s * 0.32, 0.45, 0.951, 0.2, 0.1, 0.025, gold);
    box(0, 0.53 + detail * 0.12, -0.8, 0.91, 0.07, 0.17, accent);
  } else {
    ball(0, 0.53, 0, 0.21 * widthFactor, 0.23, 1.1);
    for (const s of [-1, 1]) {
      ball(s * 0.52, 0.53, -0.04, 0.77, 0.055, 0.28, accent).rotation.y =
        s * (0.24 + detail * 0.12);
      ball(s * 0.25, 0.62, -0.8, 0.34, 0.046, 0.16, light).rotation.y =
        s * 0.25;
      ball(s * 0.49, 0.42, 0.04, 0.1, 0.11, 0.26, dark);
    }
    ball(0, 0.77, -0.83, 0.056, 0.28, 0.22, accent);
    ball(0, 0.69, 0.62, 0.14, 0.1, 0.26, dark);
  }
  group.scale.set(Math.pow(m.aspect, 0.17) * widthFactor, 1, 1);
  group.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(group);
  const size = bounds.getSize(new T.Vector3());
  const center = bounds.getCenter(new T.Vector3());
  const scale = 2.35 / Math.max(size.x, size.y, size.z);
  group.scale.multiplyScalar(scale);
  group.position.copy(center).multiplyScalar(-scale);
  return group;
}
