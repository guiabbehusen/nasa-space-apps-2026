import * as T from "three";

// Work from the rotated vertices so a tilted ear, wheel or handle can be the
// point touching the page. Only the height of the pivot may change.
export function groundKeepsake(
  pivot: T.Group,
  paperHeight: number,
  bounds: T.Box3,
) {
  bounds.setFromObject(pivot, true);
  pivot.position.y += paperHeight - bounds.min.y;
}

// A transparent SVG hit target shares the renderer's camera. The paper, the
// shadow and gaps such as a cup handle remain available to the book itself.
export function hitSilhouette(object: T.Object3D, camera: T.Camera) {
  const triangles: string[] = [];
  const vertex = new T.Vector3();
  const transform = new T.Matrix4();
  object.updateWorldMatrix(true, true);
  camera.updateMatrixWorld();
  object.traverse((part) => {
    if (!(part instanceof T.Mesh)) return;
    transform
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .multiply(part.matrixWorld);
    const { index, attributes } = part.geometry;
    const positions = attributes.position;
    const points = Array.from({ length: positions.count }, (_, i) => {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(transform);
      const x = Math.round((1 + vertex.x) * 500);
      const y = Math.round((1 - vertex.y) * 500);
      return { x, y, point: x + " " + y };
    });
    const count = index?.count ?? positions.count;
    for (let i = 0; i < count; i += 3) {
      const a = points[index ? index.getX(i) : i];
      const b = points[index ? index.getX(i + 1) : i + 1];
      const c = points[index ? index.getX(i + 2) : i + 2];
      // All front-facing triangles have the same winding, so their fills unite.
      if ((b.x - a.x) * (c.y - a.y) < (b.y - a.y) * (c.x - a.x)) {
        triangles.push("M" + a.point + "L" + b.point + " " + c.point + "Z");
      }
    }
  });
  return triangles.join("");
}
