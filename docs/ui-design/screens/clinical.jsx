// Aesthetic B — Clinical Cool
// 톤: 의료/측정 기기처럼 정확하고 객관적
// 차가운 회색, 가는 격자, 모노스페이스 숫자, 절제된 청록 액센트

const clinTokens = {
  bg: '#FAFBFC',
  card: '#FFFFFF',
  ink: '#0E1116',
  ink70: 'rgba(14,17,22,0.62)',
  ink40: 'rgba(14,17,22,0.36)',
  ink20: 'rgba(14,17,22,0.16)',
  hair: 'rgba(14,17,22,0.08)',
  grid: 'rgba(14,17,22,0.05)',
  accent: 'oklch(0.55 0.08 220)',  // 차분한 청록
  font: '"SF Pro Text", -apple-system, system-ui, sans-serif',
  mono: '"SF Mono", "JetBrains Mono", ui-monospace, Menlo, monospace',
};

// ─── 탭 버튼 ───
function ClinTapButton({ onTap, variant = 'pulse', count }) {
  const [tick, setTick] = React.useState(0);
  const [pressed, setPressed] = React.useState(false);
  const handle = () => {
    setTick(t => t + 1);
    setPressed(true);
    setTimeout(() => setPressed(false), 100);
    onTap?.();
  };
  const T = clinTokens;
  const size = 220;

  if (variant === 'fill') {
    return (
      <button onPointerDown={handle} key={tick + '-fill'} style={{
        width: size, height: size, borderRadius: '50%', border: 'none',
        background: 'transparent', cursor: 'pointer', padding: 0, position: 'relative', outline: 'none',
      }}>
        <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={size/2} cy={size/2} r={size/2 - 1} fill={T.card} stroke={T.ink20} strokeWidth="1" />
          <circle cx={size/2} cy={size/2} r={size/2 - 1} fill="none" stroke={T.accent} strokeWidth="3"
            strokeDasharray={`${Math.PI * 2 * (size/2-1)}`}
            strokeDashoffset={`${Math.PI * 2 * (size/2-1)}`}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ animation: tick > 0 ? 'clinFill 800ms ease-out' : 'none' }} />
        </svg>
        <style>{`@keyframes clinFill {
          0% { stroke-dashoffset: ${Math.PI * 2 * (size/2-1)}; opacity: 1; }
          70% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }`}</style>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: T.ink,
          transform: pressed ? 'scale(0.97)' : 'scale(1)', transition: 'transform 100ms',
        }}>
          <div style={{ fontFamily: T.mono, fontSize: 86, fontWeight: 300, letterSpacing: -3, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {String(count).padStart(2, '0')}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink40, marginTop: 8, letterSpacing: 1.4 }}>EVENTS · TODAY</div>
        </div>
      </button>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <>
        <button onPointerDown={handle} style={{
          position: 'absolute', inset: 0, background: 'transparent',
          border: 'none', cursor: 'pointer', padding: 0, zIndex: 1,
        }} />
        {tick > 0 && (
          <div key={tick + '-fs'} style={{
            position: 'absolute', inset: 0, background: T.accent, opacity: 0,
            animation: 'clinFs 280ms ease-out forwards', pointerEvents: 'none',
          }} />
        )}
        <style>{`@keyframes clinFs {
          0% { opacity: 0; } 30% { opacity: 0.08; } 100% { opacity: 0; }
        }`}</style>
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: T.card, border: `1px solid ${T.ink20}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: T.ink, position: 'relative', zIndex: 2,
          transform: pressed ? 'scale(0.985)' : 'scale(1)', transition: 'transform 100ms',
          boxShadow: 'inset 0 0 0 6px rgba(255,255,255,0.5)',
        }}>
          <div style={{ fontFamily: T.mono, fontSize: 86, fontWeight: 300, letterSpacing: -3, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {String(count).padStart(2, '0')}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink40, marginTop: 8, letterSpacing: 1.4 }}>EVENTS · TODAY</div>
        </div>
      </>
    );
  }

  // pulse - 십자선이 짧게 깜빡임 (의료적)
  return (
    <button onPointerDown={handle} style={{
      width: size, height: size, borderRadius: '50%', border: `1px solid ${T.ink20}`,
      background: T.card, cursor: 'pointer', padding: 0, position: 'relative', outline: 'none',
      transform: pressed ? 'scale(0.98)' : 'scale(1)', transition: 'transform 100ms',
      color: T.ink,
    }}>
      {tick > 0 && (
        <span key={tick} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `2px solid ${T.accent}`, pointerEvents: 'none',
          animation: 'clinPulse 600ms ease-out forwards', opacity: 0,
        }} />
      )}
      <style>{`@keyframes clinPulse {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(1.18); opacity: 0; }
      }`}</style>
      {/* 측정 마크 */}
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 1, height: 8, background: T.ink20 }} />
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 1, height: 8, background: T.ink20 }} />
      <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', height: 1, width: 8, background: T.ink20 }} />
      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', height: 1, width: 8, background: T.ink20 }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontFamily: T.mono, fontSize: 86, fontWeight: 300, letterSpacing: -3, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {String(count).padStart(2, '0')}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink40, marginTop: 8, letterSpacing: 1.4 }}>EVENTS · TODAY</div>
      </div>
    </button>
  );
}

// ─── 시간대 미니 그래프 ───
function ClinHourly({ data }) {
  const max = Math.max(1, ...data);
  const T = clinTokens;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 32, width: '100%' }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, position: 'relative',
          height: '100%', display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{
            width: '100%',
            height: v === 0 ? 1 : `${(v / max) * 100}%`,
            background: v === 0 ? T.ink20 : T.accent,
            minHeight: 1,
          }} />
        </div>
      ))}
    </div>
  );
}

// ─── 탭바 ───
function ClinTabBar({ active }) {
  const T = clinTokens;
  const items = [
    { id: 'home', label: 'LOG' },
    { id: 'stats', label: 'DATA' },
    { id: 'settings', label: 'SETUP' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 60, paddingBottom: 8,
      background: T.card, borderTop: `1px solid ${T.hair}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      fontFamily: T.mono,
    }}>
      {items.map((it) => (
        <div key={it.id} style={{
          fontSize: 10, letterSpacing: 1.4,
          color: it.id === active ? T.accent : T.ink40,
          fontWeight: 500,
          padding: '8px 12px',
          position: 'relative',
        }}>
          {it.id === active && (
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 16, height: 2, background: T.accent }} />
          )}
          {it.label}
        </div>
      ))}
    </div>
  );
}

// ─── 홈 ───
function ClinHome({ tapVariant = 'pulse', initialCount }) {
  const T = clinTokens;
  const D = window.SMOKE_DATA;
  const [count, setCount] = React.useState(initialCount ?? D.todayCount);
  const [showUndo, setShowUndo] = React.useState(false);
  const [lastTime, setLastTime] = React.useState(D.lastTimeAgo);

  const handle = () => {
    setCount(c => c + 1);
    setLastTime('00:00:00 ago');
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 4000);
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg,
      fontFamily: T.font, color: T.ink, position: 'relative',
      paddingTop: 56, paddingBottom: 60,
      display: 'flex', flexDirection: 'column',
      backgroundImage: `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    }}>
      {/* header — 측정기 라벨 스타일 */}
      <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink40, letterSpacing: 1.4 }}>SMOKE.TAP · v1.0</div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.ink70, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>2026-04-29 · WED</div>
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: 1, color: T.accent,
          padding: '4px 8px', border: `1px solid ${T.accent}`, borderRadius: 2,
        }}>● REC</div>
      </div>

      {/* center button */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <ClinTapButton onTap={handle} variant={tapVariant} count={count} />
      </div>

      {/* meta strip */}
      <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 11, color: T.ink40 }}>
        <span>LAST<span style={{ color: T.ink, marginLeft: 8, fontVariantNumeric: 'tabular-nums' }}>{D.recentTaps[0].time}</span></span>
        <span>Δ<span style={{ color: T.ink, marginLeft: 8 }}>{lastTime}</span></span>
      </div>

      {/* hourly */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{
          background: T.card, border: `1px solid ${T.hair}`,
          padding: '12px 14px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginBottom: 8,
            fontFamily: T.mono, fontSize: 10, color: T.ink40, letterSpacing: 1,
          }}>
            <span>HOURLY DISTRIBUTION</span>
            <span>n={D.hourly.reduce((a,b)=>a+b,0)}</span>
          </div>
          <ClinHourly data={D.hourly} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 6,
            fontFamily: T.mono, fontSize: 9, color: T.ink40,
          }}>
            <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
          </div>
        </div>
      </div>

      <ClinTabBar active="home" />

      {showUndo && (
        <div style={{
          position: 'absolute', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          background: T.ink, color: T.bg, padding: '10px 14px',
          fontFamily: T.mono, fontSize: 11, letterSpacing: 0.5,
          display: 'flex', alignItems: 'center', gap: 12, borderRadius: 2,
          animation: 'clinToastIn 240ms ease-out',
        }}>
          <span>+1 LOGGED</span>
          <button onClick={() => { setCount(c => Math.max(0, c - 1)); setShowUndo(false); }}
            style={{
              background: 'transparent', color: T.bg, border: '1px solid rgba(255,255,255,0.4)',
              padding: '3px 8px', fontFamily: T.mono, fontSize: 10, letterSpacing: 1, cursor: 'pointer',
              borderRadius: 2,
            }}>UNDO</button>
          <style>{`@keyframes clinToastIn {
            from { opacity: 0; transform: translate(-50%, 6px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }`}</style>
        </div>
      )}
    </div>
  );
}

// ─── 통계 ───
function ClinStats() {
  const T = clinTokens;
  const D = window.SMOKE_DATA;
  const [range, setRange] = React.useState('week');
  const data = range === 'week' ? D.last7Days : D.last4Weeks;
  const max = Math.max(...data.map(d => d.count));
  const total = data.reduce((a,b)=>a+b.count, 0);

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg,
      fontFamily: T.font, color: T.ink, position: 'relative',
      paddingTop: 56, paddingBottom: 60,
      backgroundImage: `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      overflow: 'auto',
    }}>
      <div style={{ padding: '18px 20px 16px' }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink40, letterSpacing: 1.4 }}>DATA</div>
        <div style={{ fontSize: 26, fontWeight: 500, marginTop: 4, letterSpacing: -0.5 }}>관찰 결과</div>
      </div>

      {/* segmented */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', border: `1px solid ${T.ink20}`, borderRadius: 2, fontFamily: T.mono }}>
          {[
            { id: 'day', label: 'DAY' },
            { id: 'week', label: 'WEEK' },
            { id: 'month', label: 'MONTH' },
          ].map((s, i) => {
            const sel = (range === 'week' && s.id === 'week') || (range === 'month' && s.id === 'month');
            return (
              <button key={s.id}
                onClick={() => setRange(s.id === 'month' ? 'month' : 'week')}
                style={{
                  flex: 1, padding: '8px 0',
                  background: sel ? T.ink : 'transparent',
                  color: sel ? T.bg : T.ink70,
                  border: 'none', borderLeft: i > 0 ? `1px solid ${T.ink20}` : 'none',
                  fontFamily: T.mono, fontSize: 11, letterSpacing: 1, cursor: 'pointer',
                }}>{s.label}</button>
            );
          })}
        </div>
      </div>

      {/* big number */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          background: T.card, border: `1px solid ${T.hair}`, padding: '16px',
        }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink40, letterSpacing: 1, marginBottom: 4 }}>
            {range === 'week' ? 'TOTAL · 7D' : 'TOTAL · 4W'}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontFamily: T.mono, fontSize: 44, fontWeight: 300, letterSpacing: -1.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {total}
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.ink40, letterSpacing: 0.5 }}>events</span>
          </div>

          {/* chart */}
          <div style={{ marginTop: 18, height: 120, display: 'flex', alignItems: 'flex-end', gap: 6, position: 'relative' }}>
            {/* y-axis hint */}
            <div style={{
              position: 'absolute', top: 0, bottom: 16, left: 0, right: 0,
              borderTop: `1px dashed ${T.hair}`, borderBottom: `1px dashed ${T.hair}`,
              pointerEvents: 'none',
            }} />
            {data.map((d, i) => (
              <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: `${(d.count / max) * 100}%`,
                    background: i === data.length - 1 ? T.accent : T.ink70,
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                      fontFamily: T.mono, fontSize: 9, color: T.ink70, fontVariantNumeric: 'tabular-nums',
                    }}>{d.count}</div>
                  </div>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink40, marginTop: 6 }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* breakdown rows */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink40, letterSpacing: 1, marginBottom: 8 }}>
          RECENT EVENTS
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.hair}` }}>
          {D.recentTaps.slice(0, 5).map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 14px', borderBottom: i < 4 ? `1px solid ${T.hair}` : 'none',
              fontFamily: T.mono, fontSize: 12,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.time}</span>
              </span>
              <span style={{ color: T.ink40, fontSize: 11 }}>{r.ago}</span>
            </div>
          ))}
        </div>
      </div>

      <ClinTabBar active="stats" />
    </div>
  );
}

// ─── 설정 ───
function ClinSettings() {
  const T = clinTokens;
  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: T.mono, fontSize: 10, color: T.ink40, letterSpacing: 1.2,
        padding: '0 20px 8px',
      }}>{title}</div>
      <div style={{ background: T.card, borderTop: `1px solid ${T.hair}`, borderBottom: `1px solid ${T.hair}` }}>
        {children}
      </div>
    </div>
  );
  const Row = ({ label, value, last, switched, mono }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 20px', borderBottom: last ? 'none' : `1px solid ${T.hair}`,
      fontSize: 14,
    }}>
      <span>{label}</span>
      {switched !== undefined ? (
        <div style={{
          width: 34, height: 18, position: 'relative', borderRadius: 1,
          background: switched ? T.accent : T.ink20,
        }}>
          <div style={{
            position: 'absolute', top: 2, left: switched ? 18 : 2,
            width: 14, height: 14, background: T.bg, borderRadius: 1,
            transition: 'left 150ms',
          }} />
        </div>
      ) : (
        <span style={{ color: T.ink70, fontSize: 13, fontFamily: mono ? T.mono : T.font }}>{value}</span>
      )}
    </div>
  );

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg,
      fontFamily: T.font, color: T.ink, position: 'relative',
      paddingTop: 56, paddingBottom: 60,
      backgroundImage: `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      overflow: 'auto',
    }}>
      <div style={{ padding: '18px 20px 24px' }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink40, letterSpacing: 1.4 }}>SETUP</div>
        <div style={{ fontSize: 26, fontWeight: 500, marginTop: 4, letterSpacing: -0.5 }}>설정</div>
      </div>

      <Section title="LOGGING">
        <Row label="흔들어 되돌리기" switched={true} />
        <Row label="햅틱 피드백" switched={true} />
        <Row label="위젯 동기화" switched={true} last />
      </Section>

      <Section title="DATA">
        <Row label="iCloud" value="ON · 30s" mono />
        <Row label="기록 시작" value="2024-12-03" mono />
        <Row label="총 기록 수" value="1,247" mono />
        <Row label="CSV 내보내기" value="→" last />
      </Section>

      <Section title="SYSTEM">
        <Row label="버전" value="1.0.0" mono />
        <Row label="모양" value="자동" last />
      </Section>

      <div style={{
        padding: '4px 20px 24px', fontFamily: T.mono, fontSize: 10, color: T.ink40,
        lineHeight: 1.7, letterSpacing: 0.3,
      }}>
        // SMOKE.TAP DOES NOT TRACK GOALS<br />
        // NUMBERS ARE OBSERVATIONS, NOT JUDGMENTS
      </div>

      <ClinTabBar active="settings" />
    </div>
  );
}

// ─── 위젯 ───
function ClinWidget() {
  const T = clinTokens;
  const D = window.SMOKE_DATA;
  return (
    <div style={{
      width: 320, height: 154, borderRadius: 22,
      background: T.card, padding: 14,
      fontFamily: T.font, color: T.ink,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column',
      backgroundImage: `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`,
      backgroundSize: '20px 20px',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.ink40, letterSpacing: 1.2 }}>SMOKE.TAP · TODAY</div>
        <div style={{
          fontFamily: T.mono, fontSize: 8, color: T.accent, letterSpacing: 1,
          padding: '2px 5px', border: `1px solid ${T.accent}`, borderRadius: 2,
        }}>● LIVE</div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 56, fontWeight: 300, letterSpacing: -2, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {String(D.todayCount).padStart(2, '0')}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.ink40, letterSpacing: 1, marginTop: 4 }}>EVENTS</div>
        </div>

        <div style={{ flex: 1, height: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <ClinHourly data={D.hourly} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: T.mono, fontSize: 8, color: T.ink40 }}>
            <span>00</span><span>12</span><span>24</span>
          </div>
        </div>

        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontSize: 26, fontWeight: 300, lineHeight: 1 }}>+</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ClinHome, ClinStats, ClinSettings, ClinWidget, clinTokens,
});
