import { useEffect, useRef } from "react";

interface DigitalRainProps {
  /** Densidad de gotas (por cada 100px de ancho) */
  density?: number;
  /** Multiplicador de velocidad de caída */
  speed?: number;
  /** Opacidad máxima de las gotas */
  maxOpacity?: number;
  /** Colores de las gotas */
  colors?: string[];
  /** Si debe tener resplandor (shadowBlur) */
  glow?: boolean;
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Longitud base de las gotas en px */
  dropLength?: number;
  /** Mostrar sutiles ondas de impacto (splash) al tocar el fondo */
  showSplashes?: boolean;
}

interface Drop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  color: string;
  width: number;
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

export function DigitalRain({
  density = 0.05,
  speed = 1.0,
  maxOpacity = 0.45,
  colors = ["#00D4FF", "#1463FF", "#D946EF", "#70A6FF"],
  glow = true,
  className = "",
  dropLength = 35,
  showSplashes = true,
}: DigitalRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Respetar preferencia de reducción de movimiento del sistema
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    let drops: Drop[] = [];
    let splashes: Splash[] = [];

    function initDrops() {
      if (!canvas) return;
      width = canvas.parentElement?.clientWidth || canvas.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || canvas.clientHeight || 100;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const numDrops = Math.max(8, Math.floor(width * density));
      drops = [];
      for (let i = 0; i < numDrops; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        drops.push({
          x: Math.random() * width,
          y: Math.random() * height * 1.2 - height * 0.2,
          length: dropLength * (0.6 + Math.random() * 0.8),
          speed: (2 + Math.random() * 3.5) * speed,
          opacity: 0.15 + Math.random() * (maxOpacity - 0.15),
          color,
          width: Math.random() > 0.85 ? 1.5 : 1,
        });
      }
    }

    function createSplash(x: number, y: number, color: string) {
      if (!showSplashes || splashes.length > 25) return;
      splashes.push({
        x,
        y,
        radius: 1,
        maxRadius: 4 + Math.random() * 6,
        opacity: 0.5,
        color,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Dibujar y actualizar gotas
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];

        // Crear gradiente de estela para la gota
        const grad = ctx.createLinearGradient(drop.x, drop.y - drop.length, drop.x, drop.y);
        grad.addColorStop(0, "rgba(0, 0, 0, 0)");
        grad.addColorStop(1, drop.color);

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = drop.width;
        ctx.globalAlpha = drop.opacity;

        if (glow) {
          ctx.shadowColor = drop.color;
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.moveTo(drop.x, drop.y - drop.length);
        ctx.lineTo(drop.x, drop.y);
        ctx.stroke();

        // Cabeza luminosa de la gota
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = Math.min(1, drop.opacity * 1.5);
        ctx.arc(drop.x, drop.y, drop.width * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Movimiento de caída con ligera deriva (efecto brisa tecnológica)
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.15;

        // Si sobrepasa la parte inferior
        if (drop.y > height) {
          createSplash(drop.x, height - 2, drop.color);
          drop.y = -Math.random() * 40;
          drop.x = Math.random() * (width + 50);
          drop.speed = (2 + Math.random() * 3.5) * speed;
          drop.opacity = 0.15 + Math.random() * (maxOpacity - 0.15);
        }
      }

      // Dibujar y actualizar salpicaduras
      if (showSplashes) {
        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.radius * 1.5, sp.radius * 0.4, 0, 0, Math.PI * 2);
          ctx.strokeStyle = sp.color;
          ctx.globalAlpha = sp.opacity;
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 2;
          ctx.shadowColor = sp.color;
          ctx.stroke();

          sp.radius += 0.4;
          sp.opacity -= 0.035;

          if (sp.opacity <= 0 || sp.radius >= sp.maxRadius) {
            splashes.splice(i, 1);
          }
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(animate);
    }

    initDrops();
    animationFrameId = requestAnimationFrame(animate);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    let resizeTimer: NodeJS.Timeout;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initDrops();
      }, 150);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [density, speed, maxOpacity, colors, glow, dropLength, showSplashes]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full select-none ${className}`}
    />
  );
}
