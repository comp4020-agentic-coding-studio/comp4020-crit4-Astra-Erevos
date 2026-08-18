import { OrbitEngine } from "../lib/audioEngine";

interface Particle {
  x: number;
  y: number;
  born: number;
  intensity: number;
}

const TAU = Math.PI * 2;

interface Point {
  angle: number;
  distance: number;
}

export function initOrbit(): void {
  const space = document.getElementById("orbit-space");
  const core = document.getElementById("orbit-core");
  const canvas = document.getElementById("orbit-canvas") as HTMLCanvasElement | null;
  const hint = document.getElementById("orbit-hint");
  if (!space || !core || !canvas) return;

  const ctx = canvas.getContext("2d");
  const engine = new OrbitEngine();

  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let maxRadius = 1;

  function measure(): void {
    const rect = space!.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    centerX = width / 2;
    centerY = height / 2;
    maxRadius = Math.min(width, height) * 0.46;
    const ratio = window.devicePixelRatio || 1;
    canvas!.width = width * ratio;
    canvas!.height = height * ratio;
    canvas!.style.width = `${width}px`;
    canvas!.style.height = `${height}px`;
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  measure();
  window.addEventListener("resize", measure);

  function pointFrom(x: number, y: number): Point {
    const dx = x - centerX;
    const dy = y - centerY;
    const angle = (((Math.atan2(dy, dx) + TAU) % TAU) / TAU);
    const distance = Math.min(1, Math.hypot(dx, dy) / maxRadius);
    return { angle, distance };
  }

  function playheadPoint(point: Point): { x: number; y: number } {
    return {
      x: centerX + Math.cos(point.angle * TAU) * point.distance * maxRadius,
      y: centerY + Math.sin(point.angle * TAU) * point.distance * maxRadius,
    };
  }

  const particles: Particle[] = [];
  function spawnParticle(x: number, y: number, intensity: number): void {
    particles.push({ x, y, born: performance.now(), intensity });
    if (particles.length > 140) particles.splice(0, particles.length - 140);
  }

  function dismissHint(): void {
    hint?.setAttribute("data-dismissed", "true");
  }

  // Pointer / touch: the whole space plays, the core is just its visible
  // centre. Down starts the note immediately; move glides its pitch, timbre
  // and brightness; up fades it out instead of cutting it off.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let pointerIntensity = 0;

  space.addEventListener("pointerdown", (event) => {
    space.setPointerCapture(event.pointerId);
    const rect = space.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const point = pointFrom(x, y);
    dragging = true;
    lastX = x;
    lastY = y;
    lastT = performance.now();
    pointerIntensity = 0.35;
    engine.play(point.angle, point.distance, pointerIntensity);
    spawnParticle(x, y, 0.8);
    dismissHint();
    core!.setAttribute("data-active", "true");
  });

  space.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const rect = space.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    const dist = Math.hypot(x - lastX, y - lastY);
    const speed = dist / dt;
    pointerIntensity = pointerIntensity * 0.7 + Math.min(1, speed * 2.2) * 0.3;
    lastX = x;
    lastY = y;
    lastT = now;
    const point = pointFrom(x, y);
    engine.update(point.angle, point.distance, pointerIntensity);
    if (dist > 2) spawnParticle(x, y, pointerIntensity);
  });

  function endPointerGesture(): void {
    if (!dragging) return;
    dragging = false;
    engine.release();
    core!.removeAttribute("data-active");
  }
  space.addEventListener("pointerup", endPointerGesture);
  space.addEventListener("pointercancel", endPointerGesture);

  // Keyboard: the core is the one native focusable control. Enter/Space
  // sound a note at the current virtual position; arrow keys (or WASD) move
  // that position around the field, the same two parameters a drag changes.
  const heldKeys = new Set<string>();
  let keyAngle = 0.2;
  let keyDistance = 0.4;
  const KEY_STEP = 0.05;
  const ANGLE_KEYS: Record<string, number> = { arrowleft: -1, a: -1, arrowright: 1, d: 1 };
  const DISTANCE_KEYS: Record<string, number> = { arrowup: -1, w: -1, arrowdown: 1, s: 1 };

  function triggerKeyboardNote(retrigger: boolean): void {
    const intensity = 0.55;
    if (retrigger) engine.play(keyAngle, keyDistance, intensity);
    else engine.update(keyAngle, keyDistance, intensity);
    const point = playheadPoint({ angle: keyAngle, distance: keyDistance });
    spawnParticle(point.x, point.y, intensity);
    dismissHint();
    core!.setAttribute("data-active", "true");
  }

  core.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === " " || key === "enter") {
      event.preventDefault();
      // The browser repeats keydown on its own OS-driven timer while a key
      // stays held; without this guard every one of those repeats re-ran the
      // logic below, turning a single held key into an auto-repeat-rate
      // retrigger/update loop instead of one stable, sustained input.
      if (event.repeat) return;
      const first = !heldKeys.has(key);
      heldKeys.add(key);
      triggerKeyboardNote(first && heldKeys.size === 1);
      return;
    }
    if (key in ANGLE_KEYS || key in DISTANCE_KEYS) {
      event.preventDefault();
      if (event.repeat) return;
      const first = heldKeys.size === 0;
      heldKeys.add(key);
      if (key in ANGLE_KEYS) keyAngle = (keyAngle + ANGLE_KEYS[key] * KEY_STEP + 1) % 1;
      if (key in DISTANCE_KEYS) keyDistance = Math.min(1, Math.max(0, keyDistance + DISTANCE_KEYS[key] * KEY_STEP));
      triggerKeyboardNote(first);
    }
  });

  core.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    heldKeys.delete(key);
    if (heldKeys.size === 0) {
      engine.release();
      core!.removeAttribute("data-active");
    }
  });

  // Visual loop: a faint field of rings, the core's breathing glow, a moving
  // playhead, and a fading particle trail — the only place a change in the
  // sound is drawn, so a gesture's effect is visible as well as audible.
  function frame(now: number): void {
    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.strokeStyle = "rgba(140, 170, 255, 0.16)";
      ctx.lineWidth = 1;
      for (let r = 0.25; r <= 1; r += 0.25) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * maxRadius, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i];
        const age = (now - particle.born) / 900;
        if (age >= 1) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = (1 - age) * (0.25 + particle.intensity * 0.5);
        const radius = 2 + particle.intensity * 6 + age * 10;
        ctx.beginPath();
        ctx.fillStyle = `rgba(150, 200, 255, ${alpha.toFixed(3)})`;
        ctx.arc(particle.x, particle.y, radius, 0, TAU);
        ctx.fill();
      }

      const active = dragging || heldKeys.size > 0;
      if (active) {
        const point = dragging ? { x: lastX, y: lastY } : playheadPoint({ angle: keyAngle, distance: keyDistance });
        const intensity = dragging ? pointerIntensity : 0.55;
        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.arc(point.x, point.y, 4 + intensity * 4, 0, TAU);
        ctx.fill();
      }
    }

    const active = dragging || heldKeys.size > 0;
    const breathing = active ? (dragging ? pointerIntensity : 0.55) : 0.15 + Math.sin(now / 1400) * 0.08;
    core!.style.setProperty("--intensity", breathing.toFixed(3));

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
