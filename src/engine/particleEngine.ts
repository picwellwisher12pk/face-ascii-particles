import type { Particle, VisualizerConfig } from '../types/visualizer';
import type { SampledPoint } from './pixelSampler';

export class ParticleEngine {
  private particles: Particle[] = [];

  public updateParticles(
    points: SampledPoint[],
    mouseX: number | null,
    mouseY: number | null,
    config: VisualizerConfig
  ): Particle[] {
    // Reallocate or reuse particle pool
    const targetLength = points.length;
    if (this.particles.length > targetLength) {
      this.particles.length = targetLength;
    }

    const repelRadius = config.mouseRepelRadius;
    const repelRadiusSq = repelRadius * repelRadius;
    const repelStrength = config.mouseRepelStrength;
    const returnSpeed = Math.max(0.01, config.particleReturnSpeed);
    const jitter = config.floatJitter;

    for (let i = 0; i < targetLength; i++) {
      const pt = points[i];
      let p = this.particles[i];

      if (!p) {
        p = {
          x: pt.x,
          y: pt.y,
          originX: pt.x,
          originY: pt.y,
          vx: 0,
          vy: 0,
          radius: (pt.brightness / 255) * config.particleSize,
          r: pt.r,
          g: pt.g,
          b: pt.b,
          a: pt.brightness / 255,
          brightness: pt.brightness,
        };
        this.particles[i] = p;
        const sizeVar = config.sizeVariation !== undefined ? config.sizeVariation : 1.8;
        const dynamicScale = 1.0 + (pt.brightness / 255 - 0.5) * sizeVar;
        const finalRadius = Math.max(0.6, config.particleSize * Math.max(0.2, dynamicScale));
        p.originX = pt.x;
        p.originY = pt.y;
        p.r = pt.r;
        p.g = pt.g;
        p.b = pt.b;
        p.brightness = pt.brightness;
        p.radius = finalRadius;
        p.a = Math.min(1, Math.max(0.1, pt.brightness / 255));
      }

      // Physics: Mouse repulsion
      if (mouseX !== null && mouseY !== null) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const distSq = dx * dx + dy * dy;

        if (distSq < repelRadiusSq && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const force = ((repelRadius - dist) / repelRadius) * repelStrength;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // Spring restitution back to authentic anchor coordinate
      const homeDx = p.originX - p.x;
      const homeDy = p.originY - p.y;
      p.vx += homeDx * returnSpeed;
      p.vy += homeDy * returnSpeed;

      // Friction / damping
      p.vx *= 0.82;
      p.vy *= 0.82;

      // Subtle organic float jitter
      if (jitter > 0) {
        p.vx += (Math.random() - 0.5) * jitter;
        p.vy += (Math.random() - 0.5) * jitter;
      }

      p.x += p.vx;
      p.y += p.vy;
    }

    return this.particles;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }
}
