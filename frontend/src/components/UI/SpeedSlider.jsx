export default function SpeedSlider({ speed, setSpeed }) {
  // speed = ms delay per step (50 = fast, 500 = slow)
  // Slider value is inverted: high slider = fast = low ms
  const sliderVal = 550 - speed; // 50ms→500, 500ms→50

  const handleChange = e => {
    setSpeed(550 - Number(e.target.value));
  };

  const label = speed <= 100 ? 'Fast' : speed <= 250 ? 'Medium' : 'Slow';

  return (
    <div className="speed-section">
      <div className="speed-row">
        <span className="speed-label">Animation Speed</span>
        <span className="speed-val">{label} · {speed}ms</span>
      </div>
      <input
        id="speed-slider"
        type="range"
        min={50}
        max={500}
        step={10}
        value={sliderVal}
        onChange={handleChange}
      />
      <div className="speed-row" style={{ marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Slow</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Fast</span>
      </div>
    </div>
  );
}
