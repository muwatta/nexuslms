import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  handleLoginSuccess,
  getDashboardRouteByRole,
} from "../utils/authUtils";

function Particle({ index }: { index: number }) {
  const GLYPHS = ["◈", "◇", "⬡", "△", "◎", "✦", "⬢", "◆"];
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${10 + ((index * 37 + 13) % 80)}%`,
    top: `${5 + ((index * 53 + 7) % 90)}%`,
    fontSize: `${14 + ((index * 11) % 18)}px`,
    color:
      index % 3 === 0
        ? "rgba(212,175,55,0.15)"
        : index % 3 === 1
          ? "rgba(255,255,255,0.06)"
          : "rgba(180,140,40,0.10)",
    animation: `drift ${8 + ((index * 1.3) % 6)}s ease-in-out ${(index * 0.7) % 4}s infinite alternate`,
    pointerEvents: "none",
    userSelect: "none",
  };
  return <span style={style}>{GLYPHS[index % GLYPHS.length]}</span>;
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<"user" | "pass" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error || data.detail || "Invalid credentials. Please try again.",
        );
        return;
      }
      await handleLoginSuccess(data.user);
      const route = getDashboardRouteByRole(
        data.user?.role || "",
        data.user?.department,
        data.user?.instructor_type,
      );
      window.location.href = route || "/";
    } catch {
      setError("Connection failed. Please check your network.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lr { min-height:100vh; display:flex; font-family:'DM Sans',sans-serif; background:#0a0a0f; overflow:hidden; position:relative; }

        /* LEFT */
        .ll {
          flex:1; display:flex; flex-direction:column; justify-content:space-between;
          padding:3rem; position:relative; overflow:hidden;
        }
        .ll::before {
          content:''; position:absolute; inset:0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(180,130,20,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 70%, rgba(120,80,180,0.12) 0%, transparent 60%),
            linear-gradient(160deg,#0e0c1a 0%,#0a0a0f 50%,#100e08 100%);
          z-index:0;
        }
        .ll::after {
          content:''; position:absolute; top:0; right:0; width:1px; height:100%;
          background:linear-gradient(to bottom,transparent 0%,rgba(212,175,55,0.5) 30%,rgba(212,175,55,0.7) 50%,rgba(212,175,55,0.5) 70%,transparent 100%);
        }
        .lc { position:relative; z-index:1; }

        .brand { display:flex; align-items:center; gap:.75rem; opacity:0; transform:translateY(-12px); transition:opacity .7s ease,transform .7s ease; }
        .brand.vis { opacity:1; transform:translateY(0); }
        .seal {
          width:44px; height:44px; border:1.5px solid rgba(212,175,55,.6); border-radius:50%;
          display:flex; align-items:center; justify-content:center; font-size:20px;
          background:rgba(212,175,55,.06); position:relative;
        }
        .seal::after { content:''; position:absolute; inset:3px; border:1px solid rgba(212,175,55,.2); border-radius:50%; }
        .bname { font-family:'Cormorant Garamond',serif; font-size:1.5rem; font-weight:600; color:#f5f0e8; letter-spacing:.03em; }
        .bname span { color:#d4af37; }

        .ht { margin-top:5rem; opacity:0; transform:translateY(20px); transition:opacity .8s ease .2s,transform .8s ease .2s; }
        .ht.vis { opacity:1; transform:translateY(0); }
        .ov {
          font-size:.7rem; font-weight:500; letter-spacing:.25em; color:#d4af37;
          text-transform:uppercase; margin-bottom:1.25rem;
          display:flex; align-items:center; gap:.75rem;
        }
        .ov::before { content:''; display:inline-block; width:32px; height:1px; background:#d4af37; }
        .htitle { font-family:'Cormorant Garamond',serif; font-size:clamp(2.4rem,4vw,3.8rem); font-weight:300; color:#f5f0e8; line-height:1.1; margin-bottom:1.5rem; }
        .htitle em { font-style:italic; color:#d4af37; }
        .hbody { font-size:.9rem; font-weight:300; color:rgba(245,240,232,.55); line-height:1.8; max-width:340px; }

        .sr { display:flex; gap:2.5rem; margin-top:4rem; opacity:0; transform:translateY(16px); transition:opacity .8s ease .4s,transform .8s ease .4s; }
        .sr.vis { opacity:1; transform:translateY(0); }
        .snum { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#d4af37; line-height:1; }
        .slbl { font-size:.72rem; font-weight:300; color:rgba(245,240,232,.4); letter-spacing:.08em; margin-top:.3rem; }
        .sdiv { width:1px; background:rgba(212,175,55,.2); align-self:stretch; }

        /* RIGHT */
        .rr {
          width:480px; min-width:400px; display:flex; flex-direction:column;
          justify-content:center; padding:3rem 3.5rem;
          background:rgba(15,13,25,.97); position:relative; z-index:1;
        }

        .fc { opacity:0; transform:translateX(24px); transition:opacity .8s ease .15s,transform .8s ease .15s; }
        .fc.vis { opacity:1; transform:translateX(0); }

        .fg { font-size:.7rem; font-weight:500; letter-spacing:.2em; text-transform:uppercase; color:#d4af37; margin-bottom:.6rem; }
        .ft { font-family:'Cormorant Garamond',serif; font-size:2.4rem; font-weight:300; color:#f5f0e8; margin-bottom:.4rem; }
        .fs { font-size:.85rem; font-weight:300; color:rgba(245,240,232,.45); margin-bottom:2.5rem; }

        .ig { margin-bottom:1.25rem; position:relative; }
        .il { display:block; font-size:.72rem; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:rgba(245,240,232,.5); margin-bottom:.5rem; transition:color .2s; }
        .ig.foc .il { color:#d4af37; }
        .iw { position:relative; }
        .if {
          width:100%; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1);
          border-radius:8px; padding:.85rem 1rem .85rem 2.75rem;
          font-family:'DM Sans',sans-serif; font-size:.9rem; color:#f5f0e8;
          outline:none; transition:border-color .2s,background .2s,box-shadow .2s;
        }
        .if::placeholder { color:rgba(245,240,232,.2); }
        .if:focus { border-color:rgba(212,175,55,.6); background:rgba(212,175,55,.04); box-shadow:0 0 0 3px rgba(212,175,55,.08); }
        .ii { position:absolute; left:.9rem; top:50%; transform:translateY(-50%); color:rgba(245,240,232,.3); font-size:.95rem; pointer-events:none; transition:color .2s; }
        .ig.foc .ii { color:#d4af37; }
        .eb { position:absolute; right:.9rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:rgba(245,240,232,.3); font-size:.9rem; padding:.2rem; transition:color .2s; }
        .eb:hover { color:#d4af37; }

        .err { background:rgba(220,60,60,.12); border:1px solid rgba(220,60,60,.3); border-radius:8px; padding:.75rem 1rem; font-size:.82rem; color:#f08080; margin-bottom:1.25rem; display:flex; align-items:center; gap:.5rem; }

        .fm { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.75rem; }
        .rl { display:flex; align-items:center; gap:.5rem; cursor:pointer; font-size:.82rem; color:rgba(245,240,232,.45); user-select:none; }
        .rl input[type="checkbox"] { display:none; }
        .cc { width:16px; height:16px; border:1px solid rgba(255,255,255,.2); border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; transition:border-color .2s,background .2s; flex-shrink:0; }
        .rl:has(input:checked) .cc { border-color:#d4af37; background:rgba(212,175,55,.15); color:#d4af37; }
        .fl { font-size:.82rem; color:rgba(212,175,55,.7); text-decoration:none; transition:color .2s; }
        .fl:hover { color:#d4af37; }

        .sb {
          width:100%; padding:.95rem;
          background:linear-gradient(135deg,#c9a227 0%,#d4af37 50%,#b8902a 100%);
          border:none; border-radius:8px;
          font-family:'DM Sans',sans-serif; font-size:.88rem; font-weight:500;
          letter-spacing:.08em; text-transform:uppercase; color:#0a0a0f;
          cursor:pointer; position:relative; overflow:hidden;
          transition:opacity .2s,transform .15s,box-shadow .2s;
          box-shadow:0 4px 24px rgba(212,175,55,.25);
        }
        .sb:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 32px rgba(212,175,55,.4); }
        .sb:active:not(:disabled) { transform:translateY(0); }
        .sb:disabled { opacity:.65; cursor:not-allowed; }
        .sb::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,transparent 30%,rgba(255,255,255,.15) 50%,transparent 70%); transform:translateX(-100%); transition:transform .5s ease; }
        .sb:hover::before { transform:translateX(100%); }

        .sp { display:inline-block; width:14px; height:14px; border:2px solid rgba(10,10,15,.3); border-top-color:#0a0a0f; border-radius:50%; animation:spin .7s linear infinite; margin-right:.5rem; vertical-align:middle; }

        .dv { display:flex; align-items:center; gap:1rem; margin:1.75rem 0; }
        .dl { flex:1; height:1px; background:rgba(255,255,255,.08); }
        .dt { font-size:.75rem; color:rgba(245,240,232,.3); letter-spacing:.05em; }

        .socr { display:flex; gap:.75rem; margin-bottom:2rem; }
        .socb { flex:1; padding:.7rem; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:8px; font-family:'DM Sans',sans-serif; font-size:.82rem; color:rgba(245,240,232,.6); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem; transition:border-color .2s,background .2s,color .2s; }
        .socb:hover { border-color:rgba(212,175,55,.3); background:rgba(212,175,55,.05); color:#f5f0e8; }

        .ff { text-align:center; font-size:.82rem; color:rgba(245,240,232,.35); }
        .ff a { color:#d4af37; text-decoration:none; font-weight:500; }
        .ff a:hover { text-decoration:underline; }

        @keyframes drift { from{transform:translateY(0) rotate(0deg)} to{transform:translateY(-20px) rotate(15deg)} }
        @keyframes spin  { to{transform:rotate(360deg)} }

        @media(max-width:768px){
          .ll{display:none;}
          .rr{width:100%;min-width:unset;padding:2rem 1.5rem;}
        }
      `}</style>

      <div className="lr">
        {/* LEFT */}
        <div className="ll">
          {Array.from({ length: 16 }, (_, i) => (
            <Particle key={i} index={i} />
          ))}
          <div className="lc">
            <div className={`brand ${mounted ? "vis" : ""}`}>
              <div className="seal">☽</div>
              <div className="bname">
                Muwatta<span> Academy</span>
              </div>
            </div>
            <div className={`ht ${mounted ? "vis" : ""}`}>
              <div className="ov">Islamic Learning Platform</div>
              <h1 className="htitle">
                Knowledge is the
                <br />
                <em>light of the soul</em>
              </h1>
              <p className="hbody">
                A comprehensive learning management system built for Western,
                Arabic, and Programming departments — cultivating excellence in
                every student.
              </p>
            </div>
            <div className={`sr ${mounted ? "vis" : ""}`}>
              <div>
                <div className="snum">3</div>
                <div className="slbl">Departments</div>
              </div>
              <div className="sdiv" />
              <div>
                <div className="snum">∞</div>
                <div className="slbl">Courses</div>
              </div>
              <div className="sdiv" />
              <div>
                <div className="snum">One</div>
                <div className="slbl">Platform</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rr">
          <div className={`fc ${mounted ? "vis" : ""}`}>
            <div className="fg">Welcome back</div>
            <h2 className="ft">Sign in</h2>
            <p className="fs">Continue your learning journey</p>

            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="err">
                  <span>⚠</span> {error}
                </div>
              )}

              <div className={`ig ${focused === "user" ? "foc" : ""}`}>
                <label className="il">Username</label>
                <div className="iw">
                  <span className="ii">◉</span>
                  <input
                    className="if"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocused("user")}
                    onBlur={() => setFocused(null)}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className={`ig ${focused === "pass" ? "foc" : ""}`}>
                <label className="il">Password</label>
                <div className="iw">
                  <span className="ii">◈</span>
                  <input
                    className="if"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("pass")}
                    onBlur={() => setFocused(null)}
                    autoComplete="current-password"
                    style={{ paddingRight: "2.75rem" }}
                  />
                  <button
                    type="button"
                    className="eb"
                    onClick={() => setShowPass((p) => !p)}
                    tabIndex={-1}
                  >
                    {showPass ? "◎" : "◉"}
                  </button>
                </div>
              </div>

              <div className="fm">
                <label className="rl">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <div className="cc">{remember ? "✓" : ""}</div>
                  Remember me
                </label>
                <Link to="/forgot-password" className="fl">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="sb" disabled={loading}>
                {loading && <span className="sp" />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="dv">
              <div className="dl" />
              <span className="dt">or continue with</span>
              <div className="dl" />
            </div>

            <div className="socr">
              <button className="socb">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
              <button className="socb">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>

            <div className="ff">
              Don't have an account? <Link to="/register">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
