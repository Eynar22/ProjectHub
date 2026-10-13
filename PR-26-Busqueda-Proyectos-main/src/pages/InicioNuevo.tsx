/* ============================================================================
 * src/pages/InicioNuevo.tsx
 * Portada principal (ruta /). Réplica de la animación de
 * referencia "Pallet Ross":
 *  - Al cargar: el título entra palabra por palabra, una tarjeta sube girando
 *    y el mazo se abre en abanico; luego entran subtítulo, botones y burbujas.
 *  - Al bajar: el abanico se cierra en un mazo fijo, queda una tarjeta, entra
 *    la segunda sección y el mazo se despliega en cascada.
 * Es independiente de Home y del tema global: estilos en InicioNuevo.module.css.
 * Imágenes: public/images/landing (Unsplash) e íconos oficiales de los ODS.
 * ========================================================================= */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Navbar } from '@/shared/components/layout/Navbar';
import { ODS_POR_ID } from '@/shared/constants/ods';
import s from './InicioNuevo.module.css';
import { CaosOrden } from './inicio-nuevo/CaosOrden';
import { ComoFunciona } from './inicio-nuevo/ComoFunciona';
import { Demo } from './inicio-nuevo/Demo';
import { ParaQuien } from './inicio-nuevo/ParaQuien';
import { Impacto } from './inicio-nuevo/Impacto';
import { Bolivia } from './inicio-nuevo/Bolivia';
import { Cierre } from './inicio-nuevo/Cierre';

// "Obras" del mazo: fotos alternadas con íconos de ODS (aportan el color).
const CARTAS = [
  { img: '/images/landing/bolivia-murales.jpg', titulo: 'Arte urbano en El Alto' },
  { ods: 4, color: ODS_POR_ID[4].color },
  { img: '/images/landing/equipos.jpg', titulo: 'Software para cooperativas' },
  { ods: 7, color: ODS_POR_ID[7].color },
  { img: '/images/landing/bolivia-mercado.jpg', titulo: 'Mercados con pago digital' },
  { ods: 11, color: ODS_POR_ID[11].color },
  { img: '/images/landing/profesionales.jpg', titulo: 'Consultoría ambiental' },
  { ods: 6, color: ODS_POR_ID[6].color },
] as const;

/** Texto partido en palabras animables; `grupo` las agrupa para el JS. */
function Palabras({ texto, grupo }: { texto: string; grupo: string }) {
  return (
    <>
      {texto.split(' ').map((w, i) => (
        <span key={i} className={s.w} data-grupo={grupo}>{w} </span>
      ))}
    </>
  );
}

type Pose = { x: number; y: number; rz: number; ry: number; e: number; o: number };

export default function InicioNuevo() {
  const raiz = useRef<HTMLDivElement>(null);
  const recorrido = useRef<HTMLElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const bajo = useRef<HTMLDivElement>(null);
  const cartas = useRef<(HTMLDivElement | null)[]>([]);
  const burbujas = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const r = raiz.current!;
    const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const grupo = (g: string) => [...r.querySelectorAll<HTMLElement>(`[data-grupo="${g}"]`)];
    const titulo = grupo('titulo');
    const subtitulo = grupo('subtitulo');
    const botonesHero = grupo('botones-hero');
    const seccion2 = grupo('seccion2');

    const pintar = (w: HTMLElement, v: number) => {
      w.style.opacity = String(v);
      w.style.filter = `blur(${(1 - v) * 10}px)`;
      w.style.transform = `translateY(${(1 - v) * 6}px)`;
    };

    const N = CARTAS.length;
    const M = (N - 1) / 2;
    // Poses en píxeles desde el centro de la escena. `k` escala según el ancho;
    // la cascada usa proporciones de la pantalla medidas sobre el video de referencia
    // (tarjeta ≈ 20% del ancho, cada una 12,75% más a la derecha y 7,7% más abajo).
    let k = 1, W = innerWidth, H = innerHeight, movil = W < 760;
    const BASE = 180; // lado de la tarjeta en CSS
    const pose = {
      abanico: (i: number): Pose => {
        const d = i - M;
        return movil
          ? { x: d * 0.1 * W, y: 0.06 * H + d * d * 0.004 * H, rz: d * 3, ry: -d * 4, e: (0.3 * W) / BASE, o: 1 }
          : { x: d * 0.088 * W, y: 0.125 * H + d * d * 0.006 * H, rz: d * 2.6, ry: -d * 4, e: (0.14 * W) / BASE, o: 1 };
      },
      mazo: (i: number): Pose => ({ x: (i - M) * 3 * k, y: (movil ? 0.06 : 0.125) * H - i * 2.2 * k, rz: -3 + i * 0.4, ry: 0, e: ((movil ? 0.3 : 0.1) * W) / BASE, o: 1 }),
      unica: (i: number): Pose => ({ x: 0, y: (movil ? 0.28 : 0.15) * H, rz: 0, ry: 0, e: ((movil ? 0.26 : 0.085) * W) / BASE, o: i === N - 1 ? 1 : 0 }),
      cascada: (i: number): Pose => {
        const j = N - 1 - i;
        return movil
          ? { x: (-0.22 + j * 0.2) * W, y: (0.3 + j * 0.035) * H, rz: 0, ry: 0, e: (0.4 * W) / BASE, o: 1 }
          : { x: (-0.026 + j * 0.1275) * W, y: (0.254 + j * 0.077) * H, rz: 0, ry: 0, e: (0.1975 * W) / BASE, o: 1 };
      },
      vuelo: (i: number): Pose => ({ x: -260 * k, y: 560 * k, rz: -28, ry: 0, e: 0.72 * k, o: i === N - 1 ? 1 : 0 }),
    };
    const mezclar = (a: Pose, b: Pose, t: number): Pose => ({
      x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), rz: lerp(a.rz, b.rz, t),
      ry: lerp(a.ry, b.ry, t), e: lerp(a.e, b.e, t), o: lerp(a.o, b.o, t),
    });

    let t0: number | null = null;
    let intro = reducir ? 1 : 0;
    let raf = 0;

    // Posición del mouse (-1..1), suavizada, para el efecto de profundidad.
    let mx = 0, my = 0, mxS = 0, myS = 0;
    const alMover = (ev: MouseEvent) => { mx = (ev.clientX / innerWidth) * 2 - 1; my = (ev.clientY / innerHeight) * 2 - 1; };
    addEventListener('mousemove', alMover, { passive: true });

    const cuadro = (ts: number) => {
      if (t0 === null) t0 = ts;
      if (!reducir) intro = clamp((ts - t0) / 2600);
      W = innerWidth; H = innerHeight; movil = W < 760;
      k = Math.min(1.3, W / 1150);

      const rec = recorrido.current!.getBoundingClientRect();
      const p = clamp(-rec.top / (rec.height - innerHeight));

      bajo.current!.style.top = movil ? `${0.56 * H + 0.17 * W + 20}px` : `${Math.max(0.8 * H, 0.625 * H + 0.08 * W + 24)}px`;

      // Intro por tiempo
      titulo.forEach((w, i) => pintar(w, ease(clamp((intro - i * 0.035) / 0.12))));
      subtitulo.forEach((w, i) => pintar(w, ease(clamp((intro - 0.68 - i * 0.015) / 0.12))));
      botonesHero.forEach((w, i) => pintar(w, ease(clamp((intro - 0.85 - i * 0.04) / 0.1))));

      // Movimiento en reposo: con el abanico (arriba) o la cascada (abajo) quietos,
      // las tarjetas flotan y siguen un poco al mouse. Se apaga durante las transiciones.
      mxS += (mx - mxS) * 0.06; myS += (my - myS) * 0.06;
      const reposo = reducir ? 0 : clamp((intro - 0.8) / 0.2) * Math.max(1 - clamp(p / 0.06), clamp((p - 0.72) / 0.12));
      const seg = ts / 1000;

      cartas.current.forEach((el, i) => {
        if (!el) return;
        let q: Pose;
        if (intro < 0.45) q = mezclar(pose.vuelo(i), pose.unica(i), ease(clamp((intro - 0.05) / 0.4)));
        else if (intro < 0.55) q = mezclar(pose.unica(i), pose.mazo(i), ease(clamp((intro - 0.45) / 0.1)));
        else q = mezclar(pose.mazo(i), pose.abanico(i), easeIO(clamp((intro - 0.55) / 0.25)));

        // Scroll encima de la intro
        if (p > 0) {
          let c: Pose;
          if (p < 0.2) c = mezclar(pose.abanico(i), pose.mazo(i), easeIO(p / 0.2));
          else if (p < 0.3) c = mezclar(pose.mazo(i), pose.unica(i), easeIO((p - 0.2) / 0.1));
          else if (p < 0.36) c = pose.unica(i);
          else c = mezclar(pose.unica(i), pose.cascada(i), easeIO(clamp((p - 0.36) / 0.34)));
          q = intro >= 1 ? c : mezclar(q, c, clamp(p * 6));
        }
        if (reposo > 0) {
          const prof = 0.6 + Math.abs(i - M) / M * 0.8; // las de los extremos se mueven más
          q = {
            ...q,
            x: q.x + mxS * 14 * prof * k * reposo,
            y: q.y + (Math.sin(seg * 1.1 + i * 0.9) * 7 + myS * 8 * prof) * k * reposo,
            rz: q.rz + Math.sin(seg * 0.8 + i * 1.3) * 1.4 * reposo,
            ry: q.ry + mxS * 6 * reposo,
          };
        }
        el.style.transform = `translate(${q.x}px, ${q.y}px) rotateY(${q.ry}deg) rotateZ(${q.rz}deg) scale(${q.e})`;
        el.style.opacity = String(q.o);
      });

      // El hero sube y se desvanece
      const salida = easeIO(clamp(p / 0.2));
      hero.current!.style.transform = `translateY(${-salida * 260}px)`;
      hero.current!.style.opacity = String(1 - salida);

      // Segunda sección según el scroll
      seccion2.forEach((w, i) => pintar(w, ease(clamp((p - 0.22 - i * 0.007) / 0.05))));

      // Burbujas: pegadas al borde superior de una tarjeta (siguen a la tarjeta
      // en la animación y en cualquier tamaño de pantalla).
      // fx = punto del ancho de la tarjeta donde se apoya (0 izquierda, 1 derecha).
      const ubicar = (n: number, carta: number, fx: number, on: boolean) => {
        const b = burbujas.current[n];
        const c = cartas.current[carta];
        const marco = b?.offsetParent as HTMLElement | null;
        if (!b || !c || !marco) return;
        const rc = c.getBoundingClientRect();
        const rm = marco.getBoundingClientRect();
        b.style.left = `${rc.left - rm.left + rc.width * fx}px`;
        b.style.top = `${rc.top - rm.top - b.offsetHeight / 2 - 6}px`;
        b.classList.toggle(s.on, on);
      };
      ubicar(0, 1, 0.45, intro > 0.82 && p < 0.1);          // Empresa: 2ª tarjeta del abanico
      ubicar(1, N - 2, 0.6, intro > 0.9 && p < 0.1);        // Profesional: penúltima
      ubicar(2, N - 1, 0.75, p > 0.74);                     // Propuesta aceptada: 1ª de la cascada
      ubicar(3, N - 3, 0.8, p > 0.78);                      // Equipo: 3ª de la cascada

      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    // El logo de la barra pide repetir la animación de entrada del hero.
    const reiniciar = () => { t0 = null; intro = reducir ? 1 : 0; };
    addEventListener('portada:reiniciar', reiniciar);
    return () => { cancelAnimationFrame(raf); removeEventListener('portada:reiniciar', reiniciar); removeEventListener('mousemove', alMover); };
  }, []);

  return (
    <div ref={raiz} className={s.raiz}>
      <div className={s.marco}>
        <Navbar />

        <section ref={recorrido} className={s.recorrido}>
          <div className={s.escena}>
            <div ref={hero} className={s.hero}>
              <h1><Palabras texto="Publica tu problema." grupo="titulo" /><br /><Palabras texto="Encuentra quién lo resuelve." grupo="titulo" /></h1>
              <div ref={bajo} className={s.bajo}>
                <p><Palabras texto="Las empresas publican problemas reales y los profesionales postulan con su solución." grupo="subtitulo" /></p>
                <div className={s.acciones}>
                  <Link to="/register" className={`${s.btn} ${s.w}`} data-grupo="botones-hero">Crear cuenta</Link>
                  <Link to="/explore" className={`${s.mas} ${s.w}`} data-grupo="botones-hero">Ver proyectos</Link>
                </div>
              </div>
            </div>

            <div id="seccion2" className={s.seccion2}>
              <p className={s.eyebrow}><Palabras texto="Proyectos" grupo="seccion2" /></p>
              <h2>
                <Palabras texto="Publica, postula," grupo="seccion2" /><br />
                <span className={s.color}><Palabras texto="& trabajen juntos en" grupo="seccion2" /></span><br />
                <Palabras texto="un solo lugar." grupo="seccion2" />
              </h2>
              <p><Palabras texto="Cuando la empresa acepta una propuesta se abre el grupo de trabajo: tareas, chat y archivos del proyecto." grupo="seccion2" /></p>
              <div className={`${s.acciones} ${s.accionesIzq}`}>
                <Link to="/register" className={`${s.btn} ${s.w}`} data-grupo="seccion2">Crear cuenta</Link>
                <Link to="/explore" className={`${s.mas} ${s.w}`} data-grupo="seccion2">Ver proyectos</Link>
              </div>
            </div>

            <div className={s.mesa} aria-hidden="true">
              {CARTAS.map((c, i) => (
                <div
                  key={i}
                  ref={el => { cartas.current[i] = el; }}
                  className={`${s.carta} ${'ods' in c ? s.cartaOds : ''}`}
                  style={{ zIndex: i + 1, background: 'ods' in c ? c.color : undefined }}
                >
                  {'ods' in c
                    ? <img src={`/images/ods/${c.ods}.png`} alt="" />
                    : <><img src={c.img} alt="" /><b>{c.titulo}</b></>}
                </div>
              ))}
            </div>

            {[
              { t: 'Empresa', lado: s.izq, color: 'var(--azul)' },
              { t: 'Profesional', lado: s.der, color: 'var(--verde)' },
              { t: 'Propuesta aceptada', lado: s.izq, color: 'var(--rojo)' },
              { t: 'Equipo', lado: s.der, color: 'var(--tinta)' },
            ].map((b, i) => (
              <span key={b.t} ref={el => { burbujas.current[i] = el; }} className={`${s.burbuja} ${b.lado}`} style={{ background: b.color, color: b.color === 'var(--tinta)' ? 'var(--sobre-tinta)' : undefined }} aria-hidden="true">
                {b.t}
              </span>
            ))}

            <span className={s.nota}>Imágenes ilustrativas</span>
          </div>
        </section>

        <CaosOrden />

        <ComoFunciona />

        <ParaQuien />

        <Demo />

        <Impacto />

        <Bolivia />

        <Cierre />

      </div>
    </div>
  );
}
