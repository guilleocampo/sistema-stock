import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

interface LoginResponse {
  token: string;
  usuario: { id: number; username: string; rol: 'ADMIN' | 'VENDEDOR' };
}

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Partículas en el fondo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; r: number; dx: number; dy: number; o: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        o: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${p.o})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      login(res.data.token, res.data.usuario);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      {/* Fondo animado */}
      <canvas ref={canvasRef} style={styles.canvas} />

      {/* Gradiente de fondo con malla */}
      <div style={styles.bgMesh} />

      {/* Card central */}
      <div
        style={{
          ...styles.card,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Glow detrás del card */}
        <div style={styles.cardGlow} />

        {/* Ícono y encabezado */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <span style={styles.icon}>🛒</span>
          </div>
          <h1 style={styles.title}>Zambonitos</h1>
          <div style={styles.titleAccent}>Polirubros</div>
          <p style={styles.subtitle}>Sistema de Gestión</p>
        </div>

        {/* Divisor */}
        <div style={styles.divider} />

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Usuario</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresá tu usuario"
                autoComplete="username"
                required
                style={styles.input}
                onFocus={(e) => Object.assign(e.currentTarget.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.currentTarget.style, styles.inputBlur)}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={styles.input}
                onFocus={(e) => Object.assign(e.currentTarget.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.currentTarget.style, styles.inputBlur)}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btn,
              ...(loading ? styles.btnLoading : {}),
            }}
            onMouseEnter={(e) => { if (!loading) Object.assign(e.currentTarget.style, styles.btnHover); }}
            onMouseLeave={(e) => { if (!loading) Object.assign(e.currentTarget.style, styles.btn); }}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Ingresar
              </>
            )}
          </button>
        </form>

        {/* Footer del card */}
        <p style={styles.cardFooter}>Quiosco · Librería · Regalería</p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes errorIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at 20% 50%, #1a1205 0%, #0d0d0d 40%, #050810 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  bgMesh: {
    position: 'absolute',
    inset: 0,
    background: `
      radial-gradient(circle at 15% 85%, rgba(245,158,11,0.12) 0%, transparent 50%),
      radial-gradient(circle at 85% 15%, rgba(59,130,246,0.07) 0%, transparent 50%)
    `,
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    margin: '20px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: 20,
    padding: '40px 36px 32px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
  },
  cardGlow: {
    position: 'absolute',
    top: -60,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 200,
    height: 200,
    background: 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
    borderRadius: '50%',
  },
  header: {
    textAlign: 'center',
    marginBottom: 28,
  },
  iconWrap: {
    width: 64,
    height: 64,
    background: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.2) 100%)',
    border: '1px solid rgba(245,158,11,0.4)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 8px 24px rgba(245,158,11,0.2)',
  },
  icon: {
    fontSize: 28,
    lineHeight: 1,
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  titleAccent: {
    fontSize: 16,
    fontWeight: 400,
    color: '#f59e0b',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    marginTop: 4,
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  subtitle: {
    margin: '10px 0 0',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 400,
  },
  divider: {
    height: 1,
    background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.3), transparent)',
    marginBottom: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    color: 'rgba(245,158,11,0.6)',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 14px 12px 42px',
    fontSize: 15,
    color: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  inputFocus: {
    borderColor: 'rgba(245,158,11,0.6)',
    background: 'rgba(245,158,11,0.05)',
    boxShadow: '0 0 0 3px rgba(245,158,11,0.1)',
  },
  inputBlur: {
    borderColor: 'rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    boxShadow: 'none',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: 500,
    animation: 'errorIn 0.25s ease',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    padding: '14px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#1a0e00',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  btnHover: {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    boxShadow: '0 6px 28px rgba(245,158,11,0.5)',
    transform: 'translateY(-1px)',
  },
  btnLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
    transform: 'none',
  },
  spinner: {
    width: 18,
    height: 18,
    border: '2px solid rgba(26,14,0,0.3)',
    borderTopColor: '#1a0e00',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  cardFooter: {
    margin: '24px 0 0',
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
};
