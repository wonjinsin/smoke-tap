// Aesthetic A — Minimal Paper (Light)
// 톤: 종이질감 오프화이트, 잉크 블랙, 가는 hairline, 아주 차분한 대비
// 폰트: SF Pro / system, 큰 숫자는 light weight

const paperTokens = {
  bg: '#F5F2EC',      // 따뜻한 오프화이트
  card: '#FBF9F4',
  ink: '#1A1815',
  ink70: 'rgba(26,24,21,0.62)',
  ink40: 'rgba(26,24,21,0.32)',
  ink15: 'rgba(26,24,21,0.12)',
  ink08: 'rgba(26,24,21,0.07)',
  hair: 'rgba(26,24,21,0.10)',
  font: '"SF Pro Text", -apple-system, system-ui, sans-serif',
  display: '"SF Pro Display", -apple-system, system-ui, sans-serif',
};

// ─── 큰 디스플레이 (숫자만) ───
function PaperCountDisplay({ count, tick }) {
  const T = paperTokens;
  const size = 220;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: T.card, border: `1px solid ${T.ink15}`,
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.display, color: T.ink,
    }}>
      {tick > 0 && [0, 1].map((i) => (
        <span key={tick + '-' + i} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1px solid ${T.ink}`, pointerEvents: 'none',
          animation: `paperPulse 700ms ease-out ${i * 120}ms forwards`, opacity: 0,
        }} />
      ))}
      <style>{`@keyframes paperPulse {
        0% { transform: scale(1); opacity: 0.35; }
        100% { transform: scale(1.45); opacity: 0; }
      }`}</style>
      <div style={{ fontSize: 96, fontWeight: 200, letterSpacing: -3, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 12, color: T.ink40, marginTop: 6, letterSpacing: 0.4 }}>오늘</div>
    </div>
  );
}

// ─── + 버튼 (디스플레이 아래) ───
function PaperPlusButton({ onTap }) {
  const T = paperTokens;
  const [pressed, setPressed] = React.useState(false);
  const handle = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 140);
    onTap?.();
  };
  return (
    <button onPointerDown={handle} style={{
      width: 72, height: 72, borderRadius: '50%',
      background: T.ink, color: T.bg,
      border: 'none', cursor: 'pointer', padding: 0, outline: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.display, fontWeight: 200, fontSize: 38, lineHeight: 1,
      transform: pressed ? 'scale(0.92)' : 'scale(1)',
      transition: 'transform 140ms cubic-bezier(.3,.7,.4,1)',
      boxShadow: '0 4px 14px rgba(26,24,21,0.18), 0 1px 3px rgba(26,24,21,0.10)',
    }}>+</button>
  );
}

// ─── (legacy) 탭 버튼 — 다른 화면 호환용, 사용 안 함 ───
function PaperTapButton({ onTap, variant = 'pulse', count }) {
  const [tick, setTick] = React.useState(0);
  const [pressed, setPressed] = React.useState(false);
  const handleTap = () => {
    setTick((t) => t + 1);
    setPressed(true);
    setTimeout(() => setPressed(false), 120);
    onTap?.();
  };
  const T = paperTokens;
  const size = 220;

  if (variant === 'fill') {
    // 링이 매번 채워졌다가 비워짐
    return (
      <button onPointerDown={handleTap} key={tick + '-fill'}
        style={{
          width: size, height: size, borderRadius: '50%', border: 'none',
          background: 'transparent', position: 'relative', cursor: 'pointer',
          padding: 0, outline: 'none',
        }}>
        <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={size/2} cy={size/2} r={size/2 - 2}
            fill={T.card} stroke={T.ink15} strokeWidth="1" />
          <circle cx={size/2} cy={size/2} r={size/2 - 2}
            fill="none" stroke={T.ink} strokeWidth="2"
            strokeDasharray={`${Math.PI * 2 * (size/2-2)}`}
            strokeDashoffset={`${Math.PI * 2 * (size/2-2)}`}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ animation: tick > 0 ? 'paperFill 700ms ease-out' : 'none' }}
          />
        </svg>
        <style>{`@keyframes paperFill {
          0% { stroke-dashoffset: ${Math.PI * 2 * (size/2-2)}; opacity: 1; }
          60% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }`}</style>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: T.display, color: T.ink,
          transform: pressed ? 'scale(0.97)' : 'scale(1)', transition: 'transform 120ms',
        }}>
          <div style={{ fontSize: 90, fontWeight: 200, letterSpacing: -3, lineHeight: 1 }}>{count}</div>
          <div style={{ fontSize: 12, color: T.ink40, marginTop: 6, letterSpacing: 0.4 }}>오늘</div>
        </div>
      </button>
    );
  }

  if (variant === 'fullscreen') {
    // 풀스크린 ripple — 화면 전체 톤이 한 번 바뀜
    return (
      <>
        <button onPointerDown={handleTap}
          style={{
            position: 'absolute', inset: 0, background: 'transparent',
            border: 'none', cursor: 'pointer', padding: 0, zIndex: 1,
          }} />
        {tick > 0 && (
          <div key={tick + '-fs'} style={{
            position: 'absolute', inset: 0, background: T.ink, opacity: 0.06,
            animation: 'paperFsFade 280ms ease-out forwards', pointerEvents: 'none',
          }} />
        )}
        <style>{`@keyframes paperFsFade {
          0% { opacity: 0; } 30% { opacity: 0.10; } 100% { opacity: 0; }
        }`}</style>
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: T.card, border: `1px solid ${T.ink15}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.display, color: T.ink, position: 'relative', zIndex: 2,
          transform: pressed ? 'scale(0.985)' : 'scale(1)', transition: 'transform 120ms',
        }}>
          <div style={{ fontSize: 90, fontWeight: 200, letterSpacing: -3, lineHeight: 1 }}>{count}</div>
          <div style={{ fontSize: 12, color: T.ink40, marginTop: 6, letterSpacing: 0.4 }}>오늘</div>
        </div>
      </>
    );
  }

  // pulse (default) — 동심원이 부드럽게 퍼짐
  return (
    <button onPointerDown={handleTap}
      style={{
        width: size, height: size, borderRadius: '50%', border: 'none',
        background: T.card, boxShadow: `0 0 0 1px ${T.ink15}`,
        cursor: 'pointer', padding: 0, outline: 'none',
        position: 'relative',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms cubic-bezier(.3,.7,.4,1)',
        fontFamily: T.display, color: T.ink,
      }}>
      {tick > 0 && [0, 1].map((i) => (
        <span key={tick + '-' + i} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1px solid ${T.ink}`, pointerEvents: 'none',
          animation: `paperPulse 700ms ease-out ${i * 120}ms forwards`, opacity: 0,
        }} />
      ))}
      <style>{`@keyframes paperPulse {
        0% { transform: scale(1); opacity: 0.35; }
        100% { transform: scale(1.45); opacity: 0; }
      }`}</style>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%',
      }}>
        <div style={{ fontSize: 90, fontWeight: 200, letterSpacing: -3, lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 12, color: T.ink40, marginTop: 6, letterSpacing: 0.4 }}>오늘</div>
      </div>
    </button>
  );
}

// ─── 시간대별 미니 막대그래프 (홈) ───
function PaperHourlyMini({ data }) {
  const max = Math.max(1, ...data);
  const T = paperTokens;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28, width: '100%' }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: v === 0 ? 1 : `${(v / max) * 100}%`,
          background: v === 0 ? T.ink15 : T.ink,
          minHeight: 1,
        }} />
      ))}
    </div>
  );
}

// ─── 홈 화면 ───
function PaperHome({ tapVariant = 'pulse', initialCount }) {
  const T = paperTokens;
  const D = window.SMOKE_DATA;
  const [count, setCount] = React.useState(initialCount ?? D.todayCount);
  const [lastTap, setLastTap] = React.useState(D.lastTimeAgo);
  const [showUndo, setShowUndo] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  const handleTap = () => {
    setCount((c) => c + 1);
    setLastTap('방금');
    setTick((t) => t + 1);
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 4000);
  };
  const handleUndo = () => {
    setCount((c) => Math.max(0, c - 1));
    setShowUndo(false);
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg,
      fontFamily: T.font, color: T.ink, position: 'relative',
      paddingTop: 56, paddingBottom: 60,
      display: 'flex', flexDirection: 'column',
      // subtle paper grain
      backgroundImage: `radial-gradient(${T.ink08} 0.5px, transparent 0.5px)`,
      backgroundSize: '4px 4px',
    }}>
      {/* top: date */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ fontSize: 13, color: T.ink40, letterSpacing: 0.3 }}>4월 29일 수요일</div>
        <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4, letterSpacing: -0.4 }}>오늘</div>
      </div>

      {/* center: display (숫자만) + 그 아래 + 버튼 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', gap: 28 }}>
        <PaperCountDisplay count={count} tick={tick} />
        <PaperPlusButton onTap={handleTap} />
      </div>

      {/* meta row */}
      <div style={{ padding: '12px 24px 16px', textAlign: 'center', minHeight: 18 }}>
        <span style={{ fontSize: 13, color: T.ink70 }}>
          마지막 기록 {lastTap}
        </span>
      </div>

      {/* mini hourly */}
      <div style={{ padding: '0 24px 12px' }}>
        <div style={{
          background: T.card, border: `1px solid ${T.hair}`,
          padding: '14px 16px 10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: T.ink40, letterSpacing: 0.6, textTransform: 'uppercase' }}>시간대별</span>
            <span style={{ fontSize: 11, color: T.ink40, fontVariantNumeric: 'tabular-nums' }}>00 — 24</span>
          </div>
          <PaperHourlyMini data={D.hourly} />
        </div>
      </div>

      {/* tab bar */}
      <PaperTabBar active="home" />

      {/* undo toast */}
      {showUndo && (
        <div style={{
          position: 'absolute', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          background: T.ink, color: T.bg, padding: '10px 14px 10px 16px',
          fontSize: 13, display: 'flex', alignItems: 'center', gap: 14,
          animation: 'paperToastIn 240ms ease-out',
        }}>
          <span>+1 기록됨</span>
          <button onClick={handleUndo} style={{
            background: 'transparent', color: T.bg, border: `1px solid rgba(245,242,236,0.4)`,
            padding: '4px 10px', fontSize: 12, fontFamily: T.font, cursor: 'pointer',
          }}>되돌리기</button>
          <style>{`@keyframes paperToastIn {
            from { opacity: 0; transform: translate(-50%, 8px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }`}</style>
        </div>
      )}
    </div>
  );
}

// ─── 탭바 ───
function PaperTabBar({ active }) {
  const T = paperTokens;
  const items = [
    { id: 'home', label: '오늘' },
    { id: 'stats', label: '통계' },
    { id: 'settings', label: '설정' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 60, paddingBottom: 8,
      background: T.bg, borderTop: `1px solid ${T.hair}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    }}>
      {items.map((it) => (
        <div key={it.id} style={{
          fontSize: 12, letterSpacing: 0.4,
          color: it.id === active ? T.ink : T.ink40,
          fontWeight: it.id === active ? 500 : 400,
          padding: '4px 12px',
          borderTop: it.id === active ? `1px solid ${T.ink}` : '1px solid transparent',
          marginTop: -1,
        }}>{it.label}</div>
      ))}
    </div>
  );
}

// ─── 통계 화면 ───
function PaperStats() {
  const T = paperTokens;
  const D = window.SMOKE_DATA;
  const [range, setRange] = React.useState('week');
  const data = range === 'week' ? D.last7Days : D.last4Weeks;
  const max = Math.max(...data.map(d => d.count));

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg,
      fontFamily: T.font, color: T.ink, position: 'relative',
      paddingTop: 56, paddingBottom: 60,
      backgroundImage: `radial-gradient(${T.ink08} 0.5px, transparent 0.5px)`,
      backgroundSize: '4px 4px',
    }}>
      <div style={{ padding: '20px 24px 24px' }}>
        <div style={{ fontSize: 13, color: T.ink40, letterSpacing: 0.3 }}>관찰</div>
        <div style={{ fontSize: 28, fontWeight: 500, marginTop: 4, letterSpacing: -0.6 }}>통계</div>
      </div>

      {/* segmented */}
      <div style={{ padding: '0 24px 20px', display: 'flex', gap: 0, borderBottom: `1px solid ${T.hair}` }}>
        {[
          { id: 'day', label: '일' },
          { id: 'week', label: '주' },
          { id: 'month', label: '월' },
        ].map((s) => (
          <button key={s.id} onClick={() => setRange(s.id === 'month' ? 'month' : 'week')}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: T.font, fontSize: 13,
              padding: '8px 16px',
              color: ((range === 'week' && s.id === 'week') || (range === 'month' && s.id === 'month'))
                ? T.ink : T.ink40,
              borderBottom: ((range === 'week' && s.id === 'week') || (range === 'month' && s.id === 'month'))
                ? `1px solid ${T.ink}` : '1px solid transparent',
              marginBottom: -1,
              fontWeight: 500,
            }}>{s.label}</button>
        ))}
      </div>

      {/* chart */}
      <div style={{ padding: '24px 24px 20px' }}>
        <div style={{ fontSize: 11, color: T.ink40, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>
          이번 {range === 'week' ? '주' : '달'} 합계
        </div>
        <div style={{ fontSize: 48, fontWeight: 200, letterSpacing: -1.5, lineHeight: 1 }}>
          {data.reduce((a,b) => a + b.count, 0)}
        </div>
      </div>

      <div style={{ padding: '0 24px', height: 180, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div style={{
                width: '100%',
                height: `${(d.count / max) * 100}%`,
                background: i === data.length - 1 ? T.ink : T.ink40,
              }} />
            </div>
            <div style={{ fontSize: 11, color: T.ink40, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{d.count}</div>
            <div style={{ fontSize: 11, color: T.ink70, marginTop: 2 }}>{d.label}</div>
          </div>
        ))}
      </div>

      {/* recent list */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ fontSize: 11, color: T.ink40, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
          최근 기록
        </div>
        <div>
          {D.recentTaps.slice(0, 4).map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 0',
              borderBottom: i < 3 ? `1px solid ${T.hair}` : 'none',
              fontSize: 14,
            }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.time}</span>
              <span style={{ color: T.ink40 }}>{r.ago}</span>
            </div>
          ))}
        </div>
      </div>

      <PaperTabBar active="stats" />
    </div>
  );
}

// ─── 설정 화면 ───
function PaperSettings() {
  const T = paperTokens;
  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 11, color: T.ink40, letterSpacing: 0.6, textTransform: 'uppercase',
        padding: '0 24px 8px',
      }}>{title}</div>
      <div style={{ borderTop: `1px solid ${T.hair}`, borderBottom: `1px solid ${T.hair}`, background: T.card }}>
        {children}
      </div>
    </div>
  );
  const Row = ({ label, value, last, switched }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 24px', borderBottom: last ? 'none' : `1px solid ${T.hair}`,
      fontSize: 15,
    }}>
      <span>{label}</span>
      {switched !== undefined ? (
        <div style={{
          width: 36, height: 20, borderRadius: 10, position: 'relative',
          background: switched ? T.ink : T.ink15,
        }}>
          <div style={{
            position: 'absolute', top: 2, left: switched ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%', background: T.bg,
            transition: 'left 150ms',
          }} />
        </div>
      ) : (
        <span style={{ color: T.ink40, fontSize: 14 }}>{value}</span>
      )}
    </div>
  );

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg,
      fontFamily: T.font, color: T.ink, position: 'relative',
      paddingTop: 56, paddingBottom: 60,
      backgroundImage: `radial-gradient(${T.ink08} 0.5px, transparent 0.5px)`,
      backgroundSize: '4px 4px',
      overflow: 'auto',
    }}>
      <div style={{ padding: '20px 24px 28px' }}>
        <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>설정</div>
      </div>

      <Section title="기록">
        <Row label="실수 방지 — 흔들어 되돌리기" switched={true} />
        <Row label="햅틱 피드백" switched={true} last />
      </Section>

      <Section title="데이터">
        <Row label="iCloud 동기화" value="켜짐" />
        <Row label="기록 시작일" value="2024년 12월" />
        <Row label="CSV로 내보내기" value="" last />
      </Section>

      <Section title="앱">
        <Row label="앱 아이콘" value="기본" />
        <Row label="모양" value="자동" last />
      </Section>

      <div style={{ padding: '8px 24px 24px', fontSize: 11, color: T.ink40, lineHeight: 1.6 }}>
        Smoke Tap은 목표를 설정하지 않습니다.<br />
        숫자는 그저 숫자입니다.
      </div>

      <PaperTabBar active="settings" />
    </div>
  );
}

// ─── 위젯 (홈스크린에 놓인 것처럼) — 숫자 + + 버튼만 ───
// 시계 / 날씨와 동일한 사이즈 (Small, 2x2 = 154×154)
function PaperWidget() {
  const T = paperTokens;
  const D = window.SMOKE_DATA;
  return (
    <div style={{
      width: 154, height: 154, borderRadius: 22,
      background: T.card,
      fontFamily: T.font, color: T.ink,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
      backgroundImage: `radial-gradient(${T.ink08} 0.5px, transparent 0.5px)`,
      backgroundSize: '4px 4px',
      padding: 16,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: T.display, fontSize: 72, fontWeight: 200,
        letterSpacing: -2.5, lineHeight: 1,
        alignSelf: 'flex-start',
      }}>
        {D.todayCount}
      </div>
      <div style={{
        alignSelf: 'flex-end',
        width: 44, height: 44, borderRadius: '50%',
        background: T.ink, color: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.display, fontWeight: 200, fontSize: 26, lineHeight: 1,
        boxShadow: '0 2px 8px rgba(26,24,21,0.20)',
      }}>+</div>
    </div>
  );
}

Object.assign(window, {
  PaperHome, PaperStats, PaperSettings, PaperWidget, paperTokens,
});
