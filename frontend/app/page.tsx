"use client";

import { useState, useMemo } from "react";
import { calculateShapleyValues, type ShapleyResult } from "shapley";

function getSubsets(players: string[]): string[][] {
  const subsets: string[][] = [];
  for (let mask = 1; mask < 1 << players.length; mask++) {
    subsets.push(players.filter((_, i) => ((mask >> i) & 1) === 1));
  }
  return subsets.sort((a, b) => a.length - b.length);
}

function subsetKey(subset: readonly string[]): string {
  return [...subset].sort().join(",");
}

export default function Page() {
  const [players, setPlayers] = useState<string[]>(["A", "B", "C"]);
  const [newName, setNewName] = useState("");
  const [coalitionValues, setCoalitionValues] = useState<
    Record<string, string>
  >({});
  const [results, setResults] = useState<ShapleyResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subsets = useMemo(() => getSubsets(players), [players]);

  function addPlayer() {
    const name = newName.trim();
    if (!name || players.includes(name)) return;
    setPlayers((p) => [...p, name]);
    setNewName("");
    setCoalitionValues({});
    setResults(null);
  }

  function removePlayer(name: string) {
    setPlayers((p) => p.filter((x) => x !== name));
    setCoalitionValues({});
    setResults(null);
  }

  function setValue(key: string, val: string) {
    setCoalitionValues((v) => ({ ...v, [key]: val }));
    setResults(null);
  }

  function calculate() {
    setError(null);
    try {
      const result = calculateShapleyValues(players, (coalition) => {
        if (coalition.length === 0) return 0;
        return Number(coalitionValues[subsetKey(coalition)] ?? 0);
      });
      setResults(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResults(null);
    }
  }

  return (
    <main>
      <h1>Shapley Value Calculator</h1>

      <section>
        <h2>Players</h2>
        <div className="row">
          <input
            value={newName}
            onChange={(e) => { setNewName(e.target.value); }}
            onKeyDown={(e) => { if (e.key === "Enter") addPlayer(); }}
            placeholder="Player name"
          />
          <button onClick={addPlayer}>Add</button>
        </div>
        <div className="tags">
          {players.map((p) => (
            <span key={p} className="tag">
              {p}
              <button onClick={() => { removePlayer(p); }}>×</button>
            </span>
          ))}
        </div>
      </section>

      {players.length > 0 && (
        <section>
          <h2>Coalition Values</h2>
          <table>
            <thead>
              <tr>
                <th>Coalition</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {subsets.map((subset) => {
                const key = subsetKey(subset);
                return (
                  <tr key={key}>
                    <td>{`{${subset.join(", ")}}`}</td>
                    <td>
                      <input
                        type="number"
                        value={coalitionValues[key] ?? ""}
                        onChange={(e) => { setValue(key, e.target.value); }}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <button
        onClick={calculate}
        disabled={players.length === 0}
        className="calc-btn"
      >
        Calculate
      </button>

      {error && <p className="error">{error}</p>}

      {results && (
        <section style={{ marginTop: 28 }}>
          <h2>Results</h2>
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Shapley Value</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.player}>
                  <td>{r.player}</td>
                  <td>{r.value.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
