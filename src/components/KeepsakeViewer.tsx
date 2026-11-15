"use client";
import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { Rotate3d } from "lucide-react";
import { buildKeepsake } from "@/lib/keepsake-meshes";
import { groundKeepsake, hitSilhouette } from "@/lib/keepsake-projection";
import { LABELS, type Keepsake } from "@/lib/keepsake";

export default function KeepsakeViewer({
  model,
  onDraw,
  onReview,
  resetVersion,
}: {
  model: Keepsake;
  onDraw: () => void;
  onReview: () => void;
  resetVersion: number;
}) {
  const ready = useRef(onDraw);
  ready.current = onDraw;
  const host = useRef<HTMLDivElement>(null);
  const target = useRef<SVGPathElement>(null);
  const review = useRef(onReview);
  review.current = onReview;
  const reset = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);
  const { kind, color, aspect, variant, style } = model;
  useEffect(() => {
    const parent = host.current;
    const hit = target.current;
    if (!parent || !hit) return;
    setFailed(false);
    let renderer: T.WebGLRenderer | SVGRenderer;
    try {
      renderer = new T.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch {
      renderer = new SVGRenderer();
      renderer.setQuality("low");
    }
    const element = renderer.domElement;
    element.setAttribute("aria-hidden", "true");
    parent.appendChild(element);
    const scene = new T.Scene();
    const mesh = buildKeepsake({
      version: 1,
      kind,
      color,
      aspect,
      variant,
      style,
    });
    const pivot = new T.Group();
    pivot.add(mesh);
    scene.add(pivot);
    scene.add(new T.HemisphereLight(0xfff7e8, 0xabb1a7, 1.45));
    const key = new T.DirectionalLight(0xfff4db, 2.4);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new T.DirectionalLight(0xddeeff, 1);
    fill.position.set(-3, 2, -2);
    scene.add(fill);
    const bounds = new T.Box3().setFromObject(pivot, true);
    const size = bounds.getSize(new T.Vector3());
    const paperHeight = bounds.min.y;
    const floor = new T.Group();
    // Soft concentric contact shadows also render in the SVG fallback.
    for (let step = 0; step < 7; step++) {
      const shadow = new T.Mesh(
        new T.CircleGeometry(1, 36),
        new T.MeshBasicMaterial({
          color: 0x504431,
          transparent: true,
          opacity: 0.042,
          depthWrite: false,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      const spread = 0.63 - step * 0.05;
      shadow.scale.set(spread, spread, 1);
      shadow.position.y = step * 0.0004;
      floor.add(shadow);
    }
    scene.add(floor);
    floor.position.set(0.07, paperHeight - 0.018, -0.055);
    floor.scale.set(size.x, 1, size.z);
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 60);
    camera.position.set(-2.9, 5.6, 2.1).setLength(4.5);
    camera.lookAt(0, 0, 0);
    const paperNormal = new T.Vector3(0, 1, 0);
    const screenRight = new T.Vector3(1, 0, 0).applyQuaternion(
      camera.quaternion,
    );
    const draw = () => renderer.render(scene, camera);
    const updateHit = () => hit.setAttribute("d", hitSilhouette(pivot, camera));
    const restOnPaper = () => {
      groundKeepsake(pivot, paperHeight, bounds);
      bounds.getSize(size);
      floor.scale.set(size.x, 1, size.z);
      draw();
    };
    const rotate = (yaw: number, tilt: number) => {
      pivot.rotateOnWorldAxis(paperNormal, yaw);
      pivot.rotateOnWorldAxis(screenRight, tilt);
      restOnPaper();
    };
    reset.current = () => {
      pivot.quaternion.identity();
      restOnPaper();
      updateHit();
    };
    let firstFrame = true;
    const resize = () => {
      const w = parent.clientWidth,
        h = parent.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        draw();
        updateHit();
        if (firstFrame) {
          firstFrame = false;
          ready.current();
        }
      }
    };
    // Only the visible mesh accepts a gesture. The transparent canvas and its
    // contact shadow pass pointer, scroll and page-turn input through to the book.
    const events = new AbortController();
    const options = { signal: events.signal };
    let drag: { id: number; x: number; y: number; moved: boolean } | undefined;
    let suppressClick = false;
    hit.addEventListener(
      "pointerdown",
      (e) => {
        if (!e.isPrimary || e.button !== 0 || drag) return;
        suppressClick = false;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
        hit.focus({ preventScroll: true });
        hit.setPointerCapture(e.pointerId);
        hit.dataset.held = "";
        e.stopPropagation();
      },
      options,
    );
    hit.addEventListener(
      "pointermove",
      (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        drag.moved = true;
        drag.x = e.clientX;
        drag.y = e.clientY;
        const speed = Math.PI / Math.max(1, parent.clientHeight);
        rotate(dx * speed, dy * speed);
      },
      options,
    );
    const finish = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      suppressClick = drag.moved || e.type !== "pointerup";
      if (drag.moved) updateHit();
      drag = undefined;
      delete hit.dataset.held;
      if (hit.hasPointerCapture(e.pointerId))
        hit.releasePointerCapture(e.pointerId);
    };
    hit.addEventListener("pointerup", finish, options);
    hit.addEventListener("pointercancel", finish, options);
    hit.addEventListener("lostpointercapture", finish, options);
    hit.addEventListener(
      "click",
      (e) => {
        if (!suppressClick || e.detail === 0) review.current();
        suppressClick = false;
      },
      options,
    );
    hit.addEventListener(
      "keydown",
      (e) => {
        const step = Math.PI / 12;
        switch (e.key) {
          case "ArrowLeft":
            rotate(-step, 0);
            break;
          case "ArrowRight":
            rotate(step, 0);
            break;
          case "ArrowUp":
            rotate(0, -step);
            break;
          case "ArrowDown":
            rotate(0, step);
            break;
          case "Home":
            reset.current();
            break;
          case "Enter":
          case " ":
            review.current();
            break;
          default:
            return;
        }
        if (e.key.startsWith("Arrow")) updateHit();
        e.stopPropagation();
        e.preventDefault();
      },
      options,
    );
    const loss = () => setFailed(true);
    element.addEventListener("webglcontextlost", loss);
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();
    return () => {
      reset.current = () => {};
      events.abort();
      observer.disconnect();
      element.removeEventListener("webglcontextlost", loss);
      const materials = new Set<T.Material>();
      scene.traverse((part) => {
        if (part instanceof T.Mesh) {
          part.geometry.dispose();
          for (const material of [part.material].flat())
            materials.add(material);
        }
      });
      for (const material of materials) material.dispose();
      if (renderer instanceof T.WebGLRenderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
      element.remove();
    };
  }, [kind, color, aspect, variant, style]);
  useEffect(() => {
    if (resetVersion) reset.current();
  }, [resetVersion]);
  return (
    <div className="object-viewer">
      <div className="object-stage">
        <div ref={host} className="object-render" aria-hidden="true" />
        <svg
          className="object-picking"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          <path
            ref={target}
            className="object-hit"
            fill="transparent"
            tabIndex={0}
            role="button"
            data-opf-no-flip=""
            aria-haspopup="dialog"
            aria-label={
              LABELS[kind] +
              " in 3D. Use the arrow keys to rotate or Enter to review."
            }
          />
        </svg>
        <span className="object-rotate-hint" aria-hidden="true">
          <Rotate3d size={18} />
        </span>
      </div>
      {failed && (
        <p role="alert">The graphics context was lost. Reopen the page to view the miniature.</p>
      )}
    </div>
  );
}
