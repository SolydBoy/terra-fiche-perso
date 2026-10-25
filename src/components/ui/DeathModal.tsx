import { useState } from 'react'
import { useCharacterStore } from '../../store/characterStore'

type Phase = 'impact' | 'agonie' | 'porte' | 'releve' | 'mort'

function d20() { return Math.floor(Math.random() * 20) + 1 }

function PaBar({ pa }: { pa: number }) {
  return (
    <div className="flex gap-1.5 justify-center my-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
            i <= pa
              ? 'border-red-600 bg-red-900/60 text-red-300'
              : 'border-zinc-800 bg-zinc-900/40 text-zinc-700'
          }`}
        >
          {i <= pa ? '♥' : '○'}
        </div>
      ))}
    </div>
  )
}

export function DeathModal({ onClose }: { onClose: () => void }) {
  const { character, updateField } = useCharacterStore()

  const [phase, setPhase]       = useState<Phase>('impact')
  const [pa, setPa]             = useState(0)
  const [shift, setShift]       = useState(0)   // seuils glissants : +1 par tour
  const [chanceScore, setChanceScore] = useState(0)
  const [chanceInput, setChanceInput] = useState('')
  const [lastRoll, setLastRoll]       = useState<number | null>(null)
  const [impactRoll, setImpactRoll]   = useState<number | null>(null)
  const [stressRoll, setStressRoll]   = useState<number | null>(null)
  const [effect, setEffect]           = useState('')
  const [turnCount, setTurnCount]     = useState(0)
  const [porteRolls, setPorteRolls]   = useState<{ roll: number; survived: boolean }[]>([])

  // ── Phase 1 : Jet d'impact ────────────────────────────────────────────────

  function doImpact() {
    const chance = parseInt(chanceInput, 10)
    if (isNaN(chance) || chance < 1 || chance > 20) return

    setChanceScore(chance)
    const roll    = d20()
    const stress  = d20()
    const startPa = roll > chance ? 1 : 2

    setImpactRoll(roll)
    setStressRoll(stress)
    setPa(startPa)

    // Appliquer le stress
    const newStress = Math.min(200, character.stress + 20 + stress)
    updateField('stress', newStress)

    setEffect(
      roll > chance
        ? `Résultat (${roll}) > chance (${chance}) — vous entrez en agonie avec 1 point.`
        : `Résultat (${roll}) ≤ chance (${chance}) — vous entrez en agonie avec 2 points.`,
    )
  }

  function confirmImpact() {
    setLastRoll(null)
    setEffect('')
    setPhase('agonie')
    setTurnCount(1)
  }

  // ── Phase 2 : Jets d'Agonie (seuils glissants +1 / tour) ────────────────────

  // Seuils du tour courant
  const loseThresh = 8  + shift   // ≤ loseThresh → PA −1
  const gainThresh = 13 + shift   // ≥ gainThresh → PA +1  (entre les deux → statu quo)

  function doAgonie() {
    const roll  = d20()
    let nextPa  = pa
    let eff     = ''

    if (roll <= loseThresh) {
      nextPa = pa - 1
      eff = `${roll} — Affaiblissement. PA −1.`
    } else if (roll < gainThresh) {
      eff = `${roll} — Statu quo. Vous survivez quelques secondes de plus.`
    } else {
      nextPa = pa + 1
      eff = `${roll} — Sursaut de rage. PA +1.`
    }

    setLastRoll(roll)
    setEffect(eff)
    setPa(nextPa)
    setShift((s) => s + 1)   // seuils +1 au prochain tour

    if (nextPa >= 4) {
      const newHp = Math.min(character.hpCurrent + 4, 4)
      updateField('hpCurrent', newHp)
      setTimeout(() => setPhase('releve'), 600)
    } else if (nextPa <= 0) {
      setPa(0)
      setTimeout(() => { setPhase('porte'); setTurnCount(1) }, 600)
    } else {
      setTurnCount((t) => t + 1)
    }
  }

  // ── Phase 3 : Porte de la Mort ────────────────────────────────────────────

  const modChance   = Math.max(0, chanceScore - 10)
  const porteSeuil  = 10 + modChance

  function doPorte() {
    const roll     = d20()
    const survived = roll >= porteSeuil

    setPorteRolls((prev) => [...prev, { roll, survived }])
    setLastRoll(roll)
    setTurnCount((t) => t + 1)

    if (!survived) {
      setEffect(`${roll} — Inférieur au seuil (${porteSeuil}). Votre souffle s'arrête.`)
      setTimeout(() => setPhase('mort'), 800)
    } else {
      const newStress = Math.min(200, character.stress + 5)
      updateField('stress', newStress)
      setEffect(`${roll} — Vous survivez un instant de plus. +5 Stress.`)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.92)' }}>

      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
           style={{ background: '#0a0000', border: '1px solid #7f1d1d' }}>

        {/* En-tête */}
        <div className="relative px-6 pt-6 pb-4 text-center"
             style={{ background: 'linear-gradient(to bottom, #1a0000, transparent)' }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-zinc-600 hover:text-zinc-400 text-xl"
          >×</button>

          {phase === 'impact' && (
            <>
              <p className="text-4xl mb-2">💀</p>
              <h2 className="text-lg font-black text-red-400 uppercase tracking-widest">Mise à zéro</h2>
              <p className="text-xs text-zinc-500 mt-1">Votre personnage s'effondre. Le compte à rebours commence.</p>
            </>
          )}
          {phase === 'agonie' && (
            <>
              <p className="text-4xl mb-2 animate-pulse">🩸</p>
              <h2 className="text-lg font-black text-red-500 uppercase tracking-widest">État d'Agonie</h2>
              <p className="text-xs text-zinc-500 mt-1">Tour {turnCount} — Chaque seconde compte.</p>
            </>
          )}
          {phase === 'porte' && (
            <>
              <p className="text-4xl mb-2 animate-pulse">🕯</p>
              <h2 className="text-lg font-black text-zinc-300 uppercase tracking-widest">La Porte de la Mort</h2>
              <p className="text-xs text-zinc-600 mt-1 italic">
                « …le monde devient un souvenir bruyant. »
              </p>
            </>
          )}
          {phase === 'releve' && (
            <>
              <p className="text-4xl mb-2">⚡</p>
              <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest">Sursaut Miraculeux</h2>
            </>
          )}
          {phase === 'mort' && (
            <>
              <p className="text-5xl mb-2">☠</p>
              <h2 className="text-xl font-black text-zinc-500 uppercase tracking-widest">Il est mort.</h2>
            </>
          )}
        </div>

        {/* Corps */}
        <div className="px-6 pb-6 space-y-4">

          {/* ── IMPACT ── */}
          {phase === 'impact' && impactRoll === null && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Le personnage effectue un <span className="text-red-400 font-semibold">jet d'impact</span> (1d20 privé).
                Comparez-le à votre <span className="text-amber-400 font-semibold">jet de chance du jour</span>.
              </p>
              <div>
                <label className="text-[11px] uppercase tracking-widest text-zinc-500 block mb-1.5">
                  Jet de chance du jour (1–20)
                </label>
                <input
                  type="number"
                  min={1} max={20}
                  placeholder="Votre score de chance…"
                  value={chanceInput}
                  onChange={(e) => setChanceInput(e.target.value)}
                  className="w-full bg-[#0f0000] border border-red-900/60 rounded-lg px-3 py-2
                             text-white text-sm font-mono focus:outline-none focus:border-red-700
                             [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                onClick={doImpact}
                disabled={!chanceInput || isNaN(parseInt(chanceInput, 10))}
                className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest
                           bg-red-900 hover:bg-red-800 disabled:opacity-30 text-red-200
                           border border-red-700 transition-all"
              >
                Lancer le jet d'impact
              </button>
            </div>
          )}

          {phase === 'impact' && impactRoll !== null && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center bg-[#0f0000] rounded-xl p-3 border border-red-900/40">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Jet d'impact</p>
                  <p className="text-4xl font-black text-red-400 font-mono">{impactRoll}</p>
                </div>
                <div className="text-center bg-[#0f0000] rounded-xl p-3 border border-amber-900/40">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Jet de chance</p>
                  <p className="text-4xl font-black text-amber-400 font-mono">{chanceScore}</p>
                </div>
              </div>

              <div className={`rounded-xl p-3 border text-center ${
                impactRoll > chanceScore
                  ? 'bg-orange-900/20 border-orange-800/60'
                  : 'bg-red-900/20 border-red-800/60'
              }`}>
                <p className="text-sm font-bold text-zinc-200">{effect}</p>
                <PaBar pa={pa} />
                <p className="text-xs text-zinc-400 mt-1">Points d'agonie de départ : <span className="text-red-400 font-bold">{pa}</span></p>
              </div>

              <div className="bg-[#0f0000] rounded-xl p-3 border border-zinc-800/40">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Choc — Gain de stress</p>
                <p className="text-xs text-zinc-400">
                  20 + {stressRoll} (dé) = <span className="text-orange-400 font-bold">{20 + (stressRoll ?? 0)} stress</span> appliqué
                </p>
              </div>

              <button
                onClick={confirmImpact}
                className="w-full py-2.5 rounded-xl font-bold text-sm
                           bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 transition-all"
              >
                Commencer l'agonie →
              </button>
            </div>
          )}

          {/* ── AGONIE ── */}
          {phase === 'agonie' && (
            <div className="space-y-3">
              <div className="bg-[#0f0000] rounded-xl p-4 border border-red-900/40 text-center">
                <p className="text-[11px] uppercase tracking-widest text-zinc-600 mb-1">Points d'Agonie</p>
                <PaBar pa={pa} />
                <p className="text-[11px] text-zinc-500 mt-1">
                  PA=4 → <span className="text-amber-400">Relèvement</span> · PA=0 → <span className="text-zinc-400">Porte de la Mort</span>
                </p>
              </div>

              <div className="bg-[#0a0a0a] rounded-xl p-3 border border-zinc-800/40 text-xs space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-red-500 font-mono">
                    1–{loseThresh}
                  </span>
                  <span className="text-zinc-500">Affaiblissement — PA −1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-mono ${loseThresh + 1 >= gainThresh ? 'text-zinc-700 line-through' : 'text-zinc-400'}`}>
                    {loseThresh + 1 < gainThresh ? `${loseThresh + 1}–${gainThresh - 1}` : '—'}
                  </span>
                  <span className={loseThresh + 1 >= gainThresh ? 'text-zinc-700' : 'text-zinc-500'}>Statu quo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-mono ${gainThresh > 20 ? 'text-zinc-700 line-through' : 'text-amber-500'}`}>
                    {gainThresh <= 20 ? `${gainThresh}–20` : '—'}
                  </span>
                  <span className={gainThresh > 20 ? 'text-zinc-700' : 'text-zinc-500'}>Sursaut — PA +1</span>
                </div>
                {shift > 0 && (
                  <p className="text-[10px] text-red-700 text-right pt-0.5">
                    Tour {turnCount} · décalage +{shift}
                  </p>
                )}
              </div>

              {lastRoll !== null && (
                <div className={`rounded-xl p-3 border text-center text-sm font-semibold ${
                  lastRoll <= 8    ? 'bg-red-900/20 border-red-800/50 text-red-400'
                  : lastRoll <= 12 ? 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400'
                  :                  'bg-amber-900/20 border-amber-800/50 text-amber-400'
                }`}>
                  {effect}
                </div>
              )}

              <button
                onClick={doAgonie}
                className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest
                           bg-red-950 hover:bg-red-900 text-red-300
                           border border-red-800 transition-all animate-pulse"
              >
                Jet d'Agonie (1d20)
              </button>
            </div>
          )}

          {/* ── PORTE DE LA MORT ── */}
          {phase === 'porte' && (
            <div className="space-y-3">
              <div className="rounded-xl p-4 border border-zinc-800/60 bg-[#050505] text-center">
                <p className="text-xs text-zinc-500 italic leading-relaxed mb-3">
                  « Ses membres refusent d'obéir, sa vision se rétrécit et le monde devient un souvenir bruyant. »
                </p>
                <p className="text-[11px] uppercase tracking-widest text-zinc-600">Seuil de mort</p>
                <p className="text-3xl font-black text-zinc-400 font-mono mt-1">&lt; {porteSeuil}</p>
                <p className="text-[10px] text-zinc-600 mt-1">
                  10 + mod. chance ({modChance}) · jet de chance du jour : {chanceScore}
                </p>
              </div>

              {porteRolls.length > 0 && (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {porteRolls.map((r, i) => (
                    <div key={i} className={`flex justify-between items-center text-xs px-3 py-1.5 rounded-lg ${
                      r.survived ? 'bg-zinc-900/60 text-zinc-500' : 'bg-red-950/60 text-red-500'
                    }`}>
                      <span>Tour {i + 1}</span>
                      <span className="font-mono font-bold">{r.roll}</span>
                      <span>{r.survived ? 'Survécu · +5 stress' : '☠ Mort'}</span>
                    </div>
                  ))}
                </div>
              )}

              {lastRoll !== null && (
                <div className={`rounded-xl p-3 border text-center text-sm font-semibold ${
                  porteRolls[porteRolls.length - 1]?.survived
                    ? 'bg-zinc-800/30 border-zinc-700/40 text-zinc-400'
                    : 'bg-red-950/40 border-red-900/50 text-red-400'
                }`}>
                  {effect}
                </div>
              )}

              <button
                onClick={doPorte}
                className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest
                           bg-zinc-950 hover:bg-zinc-900 text-zinc-400
                           border border-zinc-700 transition-all"
                style={{ textShadow: '0 0 8px rgba(255,50,50,0.3)' }}
              >
                Jet de survie (1d20)
              </button>
            </div>
          )}

          {/* ── RELÈVEMENT ── */}
          {phase === 'releve' && (
            <div className="space-y-4 text-center">
              <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-5">
                <p className="text-4xl mb-3">⚡</p>
                <p className="text-sm font-black text-amber-400 mb-2">Sursaut miraculeux</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Par une rage ou une volonté indomptable, votre personnage se relève.
                  Il retrouve <span className="text-amber-400 font-bold">4 points de vie</span>, mais reste{' '}
                  <span className="text-orange-400 font-bold">gravement blessé</span> jusqu'au prochain repos long.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl font-bold text-sm
                           bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 transition-all"
              >
                Reprendre
              </button>
            </div>
          )}

          {/* ── MORT ── */}
          {phase === 'mort' && (
            <div className="space-y-4 text-center">
              <div className="rounded-xl p-6 border border-zinc-800/40 bg-[#050505]">
                <p className="text-xs text-zinc-600 italic leading-relaxed">
                  « …son souffle s'arrête. »
                </p>
                <p className="text-4xl my-4">☠</p>
                <p className="text-sm text-zinc-500">Votre personnage est mort.</p>
                <p className="text-[11px] text-zinc-700 mt-2">Certains ne se relèvent jamais complètement de cette expérience.</p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest
                           bg-zinc-900 hover:bg-zinc-800 text-zinc-600 border border-zinc-800 transition-all"
              >
                Fermer
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
