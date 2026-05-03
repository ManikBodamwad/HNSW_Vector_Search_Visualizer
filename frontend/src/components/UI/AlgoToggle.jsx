export default function AlgoToggle({ algo, setAlgo }) {
  const isHnsw = algo === 'hnsw';
  return (
    <div>
      <div className="algo-toggle">
        <button
          id="algo-hnsw-btn"
          className={`algo-btn ${isHnsw ? 'active' : ''}`}
          onClick={() => setAlgo('hnsw')}
        >
          HNSW
        </button>
        <button
          id="algo-brute-btn"
          className={`algo-btn ${!isHnsw ? 'active-brute' : ''}`}
          onClick={() => setAlgo('brute')}
        >
          Brute Force
        </button>
      </div>
      <div className="algo-info">
        {isHnsw ? (
          <>
            <div className="algo-complexity">O(log N)</div>
            <div className="algo-desc">Navigates layered graph — skips most nodes</div>
          </>
        ) : (
          <>
            <div className="algo-complexity" style={{ color: '#EF4444' }}>O(N)</div>
            <div className="algo-desc">Checks every single node — no shortcuts</div>
          </>
        )}
      </div>
    </div>
  );
}
