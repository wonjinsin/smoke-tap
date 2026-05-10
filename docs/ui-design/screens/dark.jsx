// Aesthetic C — Dark Monochrome (OLED)
// 톤: 순수 검정 배경(OLED 친화), 한밤 사용 부담 없음
// 폰트: 산세리프, 큰 숫자는 ultralight, 액센트는 절제된 따뜻한 호박색

const darkTokens = {
  bg: '#000000',
  card: '#0E0E10',
  card2: '#16161A',
  ink: '#F2F0EA',
  ink70: 'rgba(242,240,234,0.62)',
  ink40: 'rgba(242,240,234,0.36)',
  ink20: 'rgba(242,240,234,0.16)',
  ink08: 'rgba(242,240,234,0.07)',
  hair: 'rgba(242,240,234,0.10)',
  accent: 'oklch(0.78 0.10 75)', // 따뜻한 호박색
  font: '"SF Pro Text", -apple-system, system-ui, sans-serif',
  display: '"SF Pro Display", -apple-system, system-ui, sans-serif',
};

// ─── 탭 버튼 ───
function DarkTapButton({ onTap, variant = 'pulse', count }) {
  const [tick, setTick] = React.useState(0);
  const [pressed, setPressed] = React.useState(false);
  const handle = () => {
    setTick(t => t + 1);
    setPressed(true);
    setTimeout(() => setPressed(false), 120);
    onTap?.();
  };
  const T = darkTokens;
  const size = 220;

  if (variant === 'fill') {
    return (
      <button onPointerDown={handle} key={tick + '-fill'} style={{
        width: size, height: size, borderRadius: '50%', border: 'none',
        background: 'transparent', cursor: 'pointer', padding: 0, position: 'relative', outline: 'none',
      }}>
        <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={size/2} cy={size/2} r={size/2 - 2} fill={T.card} stroke={T.ink20} strokeWidth="1" />
          <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none" stroke={T.accent} strokeWidth="2"
            strokeDasharray={`${Math.PI * 2 * (size/2-2)}`}
            strokeDashoffset={`${Math.PI * 2 * (size/2-2)}`}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ animation: tick > 0 ? 'darkFill 700ms ease-out' : 'none' }} />
        </svg>
        <style>{`@keyframes darkFill {
          0% { stroke-dashoffset: ${Math.PI * 2 * (size/2-2)}; opacity: 1; }
          70% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }`}</style>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: T.ink, fontFamily: T.display,
          transform: pressed ? 'scale(0.97)' : 'scale(1)', transition: 'transform 120ms',
        }}>
          <div style={{ fontSize: 92, fontWeight: 100, letterSpacing: -3, lineHeight: 1 }}>{count}</div>
          <div style={{ fontSize: 11, color: T.ink40, marginTop: 6, letterSpacing: 1.2, textTransform: 'uppercase' }}>오늘</div>
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
            animation: 'darkFs 320ms ease-out forwards', pointerEvents: 'none',
          }} />
        )}
        <style>{`@keyframes darkFs {
          0% { opacity: 0; } 30% { opacity: 0.10; } 100% { opacity: 0; }
        }`}</style>
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: T.card, border: `1px solid ${T.ink20}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: T.ink, position: 'relative', zIndex: 2, fontFamily: T.display,
          transform: pressed ? 'scale(0.985)' : 'scale(1)', transition: 'transform 120ms',
        }}>
          <div style={{ fontSize: 92, fontWeight: 100, letterSpacing: -3, lineHeight: 1 }}>{count}</div>
          <div style={{ fontSize: 11, color: T.ink40, marginTop: 6, letterSpacing: 1.2, textTransform: 'uppercase' }}>오늘</div>
        </div>
      </>
    );
  }

  // pulse — 따뜻한 호박색 동심원이 부드럽게
  return (
    <button onPointerDown={handle} style={{
      width: size, height: size, borderRadius: '50%',
      border: `1px solid ${T.ink20}`,
      background: T.card, cursor: 'pointer', padding: 0, outline: 'none',
      position: 'relative', color: T.ink, fontFamily: T.display,
      transform: pressed ? 'scale(0.97)' : 'scale(1)',
      transition: 'transform 120ms cubic-bezier(.3,.7,.4,1)',
    }}>
      {tick > 0 && [0, 1].map(i => (
        <span key={tick + '-' + i} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1px solid ${T.accent}`, pointerEvents: 'none',
          animation: `darkPulse 750ms ease-out ${i * 130}ms forwards`, opacity: 0,
        }} />
      ))}
      <style>{`@keyframes darkPulse {
        0% { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(1.45); opacity: 0; }
      }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ fontSize: 92, fontWeight: 100, letterSpacing: -3, lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 11, color: T.ink40, marginTop: 6, letterSpacing: 1.2, textTransform: 'uppercase' }}>오늘</div>
      </div>
    </button>
  );
}

function DarkHourly({ data }) {
  const max = Math.max(1, ...data);
  const T = darkTokens;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28, width: '100%' }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: v === 0 ? 1 : `${(v / max) * 100}%`,
          background: v === 0 ? T.ink20 : T.accent,
          minHeight: 1, borderRadius: 0.5,
        }} />
      ))}
    </div>
  );
}

function DarkTabBar({ active }) {
  const T = darkTokens;
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
          borderTop: it.id === active ? `1px solid ${T.accent}` : '1px solid transparent',
          marginTop: -1,
        }}>{it.label}</div>
      ))}
    </div>
  );
}

function DarkHome({ tapVariant = 'pulse', initialCount }) {
  const T = darkTokens;
  const D = window.SMOKE_DATA;
  const [count, setCount] = React.useState(initialCount ?? D.todayCount);
  const [lastTap, setLastTap] = React.useState(D.lastTimeAgo);
  const [showUndo, setShowUndo] = React.useState(false);

  const handle = () => {
    setCount(c => c + 1);
    setLastTap('방금');
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 4000);
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg,
      fontFamily: T.font, color: T.ink, position: 'relative',
      paddingTop: 56, paddingBottom: 60,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ fontSize: 13, color: T.ink40, letterSpacing: 0.3 }}>4월 29일 수요일</div>
        <div style={{ fontSize: 22, fontWeight: 500, marginTop: 4, letterSpacing: -0.4 }}>오늘</div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <DarkTapButton onTap={handle} variant={tapVariant} count={count} />
      </div>

      <div style={{ padding: '0 24px 16px', textAlign: 'center', minHeight: 18 }}>
        <span style={{ fontSize: 13, color: T.ink70 }}>마지막 기록 {lastTap}</span>
      </div>

      <div style={{ padding: '0 24px 12px' }}>
        <div style={{
          background: T.card, border: `1px solid ${T.hair}`, borderRadius: 14,
          padding: '14px 16px 12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: T.ink40, letterSpacing: 0.6, textTransform: 'uppercase' }}>시간대별</span>
            <span style={{ fontSize: 11, color: T.ink40, fontVariantNumeric: 'tabular-nums' }}>00 — 24</span>
          </div>
          <DarkHourly data={D.hourly} />
        </div>
      </div>

      <DarkTabBar active="home" />

      {showUndo && (
        <div style={{
          position: 'absolute', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          background: T.card2, color: T.ink, padding: '10px 14px',
          fontSize: 13, display: 'flex', alignItems: 'center', gap: 14,
          borderRadius: 999, border: `1px solid ${T.hair}`,
          animation: 'darkToastIn 240ms ease-out',
        }}>
          <span>+1 기록됨</span>
          <button onClick={() => { setCount(c => Math.max(0, c - 1)); setShowUndo(false); }}
            style={{
              background: 'transparent', color: T.accent, border: 'none',
              fontSize: 13, fontFamily: T.font, cursor: 'pointer', fontWeight: 500,
            }}>되돌리기</button>
          <style>{`@keyframes darkToastIn {
            from { opacity: 0; transform: translate(-50%, 8px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }`}</style>
        </div>
      )}
    </div>
  );
}

function DarkStats() {
  const T = darkTokens;
  const D = window.SMOKE_DATA;
  const [range, setRange] = React.useState('week');
  const data = range === 'week' ? D.last7Days : D.last4Weeks;
  const max = Math.max(...data.map(d => d.count));

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg,
      fontFamily: T.font, color: T.ink, position: 'relative',
      paddingTop: 56, paddingBottom: 60, overflow: 'auto',
    }}>
      <div style={{ padding: '20px 24px 24px' }}>
        <div style={{ fontSize: 13, color: T.ink40, letterSpacing: 0.3 }}>관찰</div>
        <div style={{ fontSize: 28, fontWeight: 500, marginTop: 4, letterSpacing: -0.6 }}>통계</div>
      </div>

      <div style={{ padding: '0 24px 20px' }}>
        <div style={{ display: 'flex', background: T.card, padding: 3, borderRadius: 10 }}>
          {[
            { id: 'day', label: '일' },
            { id: 'week', label: '주' },
            { id: 'month', label: '월' },
          ].map((s) => {
            const sel = (range === 'week' && s.id === 'week') || (range === 'month' && s.id === 'month');
            return (
              <button key={s.id}
                onClick={() => setRange(s.id === 'month' ? 'month' : 'week')}
                style={{
                  flex: 1, padding: '7px 0',
                  background: sel ? T.card2 : 'transparent',
                  color: sel ? T.ink : T.ink40,
                  border: 'none', borderRadius: 7,
                  fontFamily: T.font, fontSize: 13, fontWeight: sel ? 500 : 400, cursor: 'pointer',
                }}>{s.label}</button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 24px 20px' }}>
        <div style={{ fontSize: 11, color: T.ink40, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>
          이번 {range === 'week' ? '주' : '달'} 합계
        </div>
        <div style={{ fontFamily: T.display, fontSize: 52, fontWeight: 100, letterSpacing: -1.5, lineHeight: 1 }}>
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
                background: i === data.length - 1 ? T.accent : T.ink40,
                borderRadius: 2,
              }} />
            </div>
            <div style={{ fontSize: 11, color: T.ink70, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{d.count}</div>
            <div style={{ fontSize: 11, color: T.ink40, marginTop: 2 }}>{d.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ fontSize: 11, color: T.ink40, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
          최근 기록
        </div>
        <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.hair}` }}>
          {D.recentTaps.slice(0, 4).map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
              borderBottom: i < 3 ? `1px solid ${T.hair}` : 'none',
              fontSize: 14,
            }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.time}</span>
              <span style={{ color: T.ink40 }}>{r.ago}</span>
            </div>
          ))}
        </div>
      </div>

      <DarkTabBar active="stats" />
    </div>
  );
}

function DarkSettings() {
  const T = darkTokens;
  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 11, color: T.ink40, letterSpacing: 0.6, textTransform: 'uppercase',
        padding: '0 24px 8px',
      }}>{title}</div>
      <div style={{ background: T.card, borderRadius: 14, margin: '0 16px', border: `1px solid ${T.hair}`, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
  const Row = ({ label, value, last, switched }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 16px', borderBottom: last ? 'none' : `1px solid ${T.hair}`,
      fontSize: 15,
    }}>
      <span>{label}</span>
      {switched !== undefined ? (
        <div style={{
          width: 36, height: 20, borderRadius: 10, position: 'relative',
          background: switched ? T.accent : T.ink20,
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
      paddingTop: 56, paddingBottom: 60, overflow: 'auto',
    }}>
      <div style={{ padding: '20px 24px 28px' }}>
        <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>설정</div>
      </div>

      <Section title="기록">
        <Row label="흔들어 되돌리기" switched={true} />
        <Row label="햅틱 피드백" switched={true} last />
      </Section>

      <Section title="데이터">
        <Row label="iCloud 동기화" value="켜짐" />
        <Row label="기록 시작일" value="2024년 12월" />
        <Row label="CSV로 내보내기" value="" last />
      </Section>

      <Section title="앱">
        <Row label="앱 아이콘" value="기본" />
        <Row label="모양" value="다크" last />
      </Section>

      <div style={{ padding: '4px 24px 24px', fontSize: 11, color: T.ink40, lineHeight: 1.6 }}>
        Smoke Tap은 목표를 설정하지 않습니다.<br />
        숫자는 그저 숫자입니다.
      </div>

      <DarkTabBar active="settings" />
    </div>
  );
}

function DarkWidget() {
  const T = darkTokens;
  const D = window.SMOKE_DATA;
  return (
    <div style={{
      width: 320, height: 154, borderRadius: 22,
      background: T.card, padding: 16,
      fontFamily: T.font, color: T.ink,
      boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column',
      border: `1px solid ${T.hair}`,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, color: T.ink40, letterSpacing: 0.5, textTransform: 'uppercase' }}>SMOKE TAP · 오늘</div>
        <div style={{ fontSize: 10, color: T.ink40 }}>{D.lastTimeAgo}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
        <div style={{ fontFamily: T.display, fontSize: 64, fontWeight: 100, letterSpacing: -2, lineHeight: 1 }}>
          {D.todayCount}
        </div>
        <div style={{ flex: 1, height: 56, display: 'flex', alignItems: 'flex-end' }}>
          <DarkHourly data={D.hourly} />
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: T.bg, fontSize: 28, fontWeight: 300, lineHeight: 1 }}>+</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  DarkHome, DarkStats, DarkSettings, DarkWidget, darkTokens,
});
