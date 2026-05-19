import React, { useState, useRef, useEffect } from 'react';
import { Users, RotateCcw, Plus, Trash2, Menu, X, ArrowLeftRight } from 'lucide-react';

const App = () => {
  const [formation, setFormation] = useState('3-3-1');
  const [allPlayers, setAllPlayers] = useState([]);
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const boardRef = useRef(null);
  const TEAM_COLOR = '#3b82f6';
  const BENCH_COLOR = '#64748b';

  const formations = {
    '3-3-1': [
      { id: 1, posName: 'そうた', x: 50, y: 92 },
      { id: 2, posName: 'しん', x: 20, y: 68 },
      { id: 3, posName: 'れん', x: 50, y: 68 },
      { id: 4, posName: 'じん', x: 80, y: 68 },
      { id: 5, posName: 'さら', x: 20, y: 40 },
      { id: 6, posName: 'こうすけ', x: 50, y: 40 },
      { id: 7, posName: 'ゆう', x: 80, y: 40 },
      { id: 8, posName: 'みらい', x: 50, y: 15 },
    ],
    '4-2-1': [
      { id: 1, posName: 'そうた', x: 50, y: 92 },
      { id: 2, posName: 'しん', x: 15, y: 68 },
      { id: 3, posName: 'れん', x: 38, y: 70 },
      { id: 4, posName: 'じん', x: 62, y: 70 },
      { id: 5, posName: 'さら', x: 85, y: 68 },
      { id: 6, posName: 'こうすけ', x: 35, y: 40 },
      { id: 7, posName: 'ゆう', x: 65, y: 40 },
      { id: 8, posName: 'みらい', x: 50, y: 15 },
    ]
  };

  const alignBenchPlayers = (players) => {
    const bench = players.filter(p => p.isBench).sort((a, b) => a.x - b.x);
    const count = bench.length;
    if (count === 0) return players;
    const startX = 15, endX = 85;
    const step = count > 1 ? (endX - startX) / (count - 1) : 0;
    const alignedBench = bench.map((p, i) => ({
      ...p,
      x: count === 1 ? 50 : startX + step * i,
      y: 112,
      color: BENCH_COLOR
    }));
    return [...players.filter(p => !p.isBench), ...alignedBench];
  };

  useEffect(() => {
    const starters = formations['3-3-1'].map(p => ({ ...p, name: p.posName, isBench: false, color: TEAM_COLOR }));
    const bench = [
      { id: 101, name: 'るい', x: 25, y: 112, isBench: true, color: BENCH_COLOR },
      { id: 102, name: 'たけはる', x: 50, y: 112, isBench: true, color: BENCH_COLOR },
      { id: 103, name: '控え3', x: 75, y: 112, isBench: true, color: BENCH_COLOR },
    ];
    setAllPlayers([...starters, ...bench]);
  }, []);

  const resetFormation = (type) => {
    setFormation(type);
    const template = formations[type];
    setAllPlayers(prev => {
      const subs = prev.filter(p => p.isBench);
      const starters = prev.filter(p => !p.isBench);
      const newStarters = template.map((slot, i) => ({
        id: slot.id,
        name: starters[i] ? starters[i].name : slot.posName,
        x: slot.x, y: slot.y,
        isBench: false, color: TEAM_COLOR
      }));
      return alignBenchPlayers([...newStarters, ...subs]);
    });
  };

  const handleNameChange = (id, newName) =>
    setAllPlayers(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));

  const addSubstitute = () => {
    const newId = Date.now();
    setAllPlayers(prev => alignBenchPlayers([...prev, {
      id: newId,
      name: `控え${prev.filter(p => p.isBench).length + 1}`,
      x: 50, y: 112, isBench: true, color: BENCH_COLOR
    }]));
  };

  const removeSubstitute = (id) =>
    setAllPlayers(prev => alignBenchPlayers(prev.filter(p => p.id !== id || !p.isBench)));

  const updatePosition = (id, clientX, clientY) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setAllPlayers(prev => prev.map(p =>
      p.id === id ? { ...p, x: Math.max(-5, Math.min(105, x)), y: Math.max(-5, Math.min(130, y)) } : p
    ));
  };

  const handleStart = (id) => setDraggedPlayerId(id);
  const handleMove = (e) => {
    if (draggedPlayerId === null) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX !== undefined) updatePosition(draggedPlayerId, clientX, clientY);
  };
  const handleEnd = () => {
    if (draggedPlayerId === null) return;
    setAllPlayers(prev => {
      const dragged = prev.find(p => p.id === draggedPlayerId);
      if (!dragged) return prev;
      let newState;
      if (dragged.y <= 100) {
        const slots = formations[formation];
        let bestSlot = slots.reduce((best, slot) => {
          const d = Math.hypot(slot.x - dragged.x, slot.y - dragged.y);
          return d < best.d ? { slot, d } : best;
        }, { slot: slots[0], d: Infinity }).slot;
        const occupant = prev.find(p => p.id !== draggedPlayerId && p.x === bestSlot.x && p.y === bestSlot.y);
        if (occupant) {
          newState = prev.map(p => {
            if (p.id === dragged.id) return { ...p, x: bestSlot.x, y: bestSlot.y, isBench: false, color: TEAM_COLOR };
            if (p.id === occupant.id) return { ...p, x: dragged.x, y: 112, isBench: true, color: BENCH_COLOR };
            return p;
          });
        } else {
          newState = prev.map(p => p.id === dragged.id
            ? { ...p, x: bestSlot.x, y: bestSlot.y, isBench: false, color: TEAM_COLOR } : p);
        }
      } else {
        newState = prev.map(p => p.id === dragged.id ? { ...p, isBench: true, color: BENCH_COLOR } : p);
      }
      return alignBenchPlayers(newState);
    });
    setDraggedPlayerId(null);
  };

  return (
    <div
      style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0f172a',
               fontFamily:'sans-serif', overflow:'hidden', userSelect:'none', touchAction:'none' }}
      onMouseMove={handleMove} onTouchMove={handleMove}
      onMouseUp={handleEnd} onTouchEnd={handleEnd}
    >
      {/* Mobile Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px', background:'#fff', borderBottom:'1px solid #e2e8f0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ background:'#2563eb', padding:'6px', borderRadius:'8px' }}>
            <Users size={20} color="#fff" />
          </div>
          <span style={{ fontWeight:'bold', color:'#1e293b', fontSize:'14px' }}>8人制タクティカル</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ padding:'8px', background:'#f1f5f9', border:'none', borderRadius:'8px', cursor:'pointer' }}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Sidebar */}
        <div style={{
          position: isSidebarOpen ? 'fixed' : 'relative',
          top:0, left:0, bottom:0,
          width: isSidebarOpen ? '100%' : '280px',
          background:'#fff', borderRight:'1px solid #e2e8f0',
          overflowY:'auto', padding:'24px', zIndex:40,
          flexShrink:0,
          display: isSidebarOpen ? 'block' : 'none'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'32px' }}>
            <div style={{ background:'#2563eb', padding:'8px', borderRadius:'12px' }}>
              <Users size={24} color="#fff" />
            </div>
            <h1 style={{ margin:0, fontSize:'18px', fontWeight:'900', color:'#1e293b', textTransform:'uppercase' }}>
              Tactical Board
            </h1>
          </div>

          <div style={{ marginBottom:'24px' }}>
            <label style={{ fontSize:'10px', fontWeight:'bold', color:'#94a3b8', letterSpacing:'3px', textTransform:'uppercase', display:'block', marginBottom:'12px' }}>
              FORMATION / システム
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {['3-3-1','4-2-1'].map(type => (
                <button key={type}
                  onClick={() => { resetFormation(type); setIsSidebarOpen(false); }}
                  style={{
                    padding:'12px', borderRadius:'12px', fontWeight:'bold', fontSize:'14px',
                    border: `2px solid ${formation===type ? '#2563eb' : '#f1f5f9'}`,
                    background: formation===type ? '#2563eb' : '#fff',
                    color: formation===type ? '#fff' : '#64748b',
                    cursor:'pointer'
                  }}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:'24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <label style={{ fontSize:'10px', fontWeight:'bold', color:'#94a3b8', letterSpacing:'3px', textTransform:'uppercase' }}>
                STARTERS / 選手名
              </label>
              <button onClick={() => resetFormation(formation)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                <RotateCcw size={20} />
              </button>
            </div>
            {allPlayers.filter(p => !p.isBench).map(player => (
              <div key={`in-${player.id}`}
                style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f8fafc',
                         padding:'4px', borderRadius:'8px', border:'1px solid #f1f5f9', marginBottom:'8px' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:player.color, marginLeft:'8px', flexShrink:0 }}></div>
                <input type="text" value={player.name}
                  onChange={e => handleNameChange(player.id, e.target.value)}
                  style={{ flex:1, background:'transparent', border:'none', padding:'4px 8px',
                           fontSize:'14px', fontWeight:'bold', color:'#334155', outline:'none' }} />
              </div>
            ))}
          </div>

          <div style={{ paddingBottom:'80px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <label style={{ fontSize:'10px', fontWeight:'bold', color:'#94a3b8', letterSpacing:'3px', textTransform:'uppercase' }}>
                SUBSTITUTES / 控え
              </label>
              <button onClick={addSubstitute}
                style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', fontWeight:'bold',
                         background:'#eff6ff', color:'#2563eb', padding:'6px 12px',
                         borderRadius:'20px', border:'none', cursor:'pointer' }}>
                <Plus size={12} /> 選手追加
              </button>
            </div>
            {allPlayers.filter(p => p.isBench).map(sub => (
              <div key={`sub-${sub.id}`}
                style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f8fafc',
                         padding:'4px', borderRadius:'8px', border:'1px solid #f1f5f9', marginBottom:'8px' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'#94a3b8', marginLeft:'8px', flexShrink:0 }}></div>
                <input type="text" value={sub.name}
                  onChange={e => handleNameChange(sub.id, e.target.value)}
                  style={{ flex:1, background:'transparent', border:'none', padding:'4px 8px',
                           fontSize:'14px', color:'#64748b', outline:'none' }} />
                <button onClick={() => removeSubstitute(sub.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', padding:'8px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div style={{
          width:'280px', background:'#fff', borderRight:'1px solid #e2e8f0',
          overflowY:'auto', padding:'24px', flexShrink:0,
          display: isSidebarOpen ? 'none' : 'block'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'32px' }}>
            <div style={{ background:'#2563eb', padding:'8px', borderRadius:'12px' }}>
              <Users size={24} color="#fff" />
            </div>
            <h1 style={{ margin:0, fontSize:'18px', fontWeight:'900', color:'#1e293b', textTransform:'uppercase' }}>
              Tactical Board
            </h1>
          </div>
          <div style={{ marginBottom:'24px' }}>
            <label style={{ fontSize:'10px', fontWeight:'bold', color:'#94a3b8', letterSpacing:'3px', textTransform:'uppercase', display:'block', marginBottom:'12px' }}>
              FORMATION / システム
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {['3-3-1','4-2-1'].map(type => (
                <button key={type} onClick={() => resetFormation(type)}
                  style={{
                    padding:'12px', borderRadius:'12px', fontWeight:'bold', fontSize:'14px',
                    border:`2px solid ${formation===type ? '#2563eb' : '#f1f5f9'}`,
                    background:formation===type ? '#2563eb' : '#fff',
                    color:formation===type ? '#fff' : '#64748b', cursor:'pointer'
                  }}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:'24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <label style={{ fontSize:'10px', fontWeight:'bold', color:'#94a3b8', letterSpacing:'3px', textTransform:'uppercase' }}>
                STARTERS / 選手名
              </label>
              <button onClick={() => resetFormation(formation)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                <RotateCcw size={20} />
              </button>
            </div>
            {allPlayers.filter(p => !p.isBench).map(player => (
              <div key={`in-${player.id}`}
                style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f8fafc',
                         padding:'4px', borderRadius:'8px', border:'1px solid #f1f5f9', marginBottom:'8px' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:player.color, marginLeft:'8px', flexShrink:0 }}></div>
                <input type="text" value={player.name}
                  onChange={e => handleNameChange(player.id, e.target.value)}
                  style={{ flex:1, background:'transparent', border:'none', padding:'4px 8px',
                           fontSize:'14px', fontWeight:'bold', color:'#334155', outline:'none' }} />
              </div>
            ))}
          </div>
          <div style={{ paddingBottom:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <label style={{ fontSize:'10px', fontWeight:'bold', color:'#94a3b8', letterSpacing:'3px', textTransform:'uppercase' }}>
                SUBSTITUTES / 控え
              </label>
              <button onClick={addSubstitute}
                style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', fontWeight:'bold',
                         background:'#eff6ff', color:'#2563eb', padding:'6px 12px',
                         borderRadius:'20px', border:'none', cursor:'pointer' }}>
                <Plus size={12} /> 選手追加
              </button>
            </div>
            {allPlayers.filter(p => p.isBench).map(sub => (
              <div key={`sub-${sub.id}`}
                style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f8fafc',
                         padding:'4px', borderRadius:'8px', border:'1px solid #f1f5f9', marginBottom:'8px' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'#94a3b8', marginLeft:'8px', flexShrink:0 }}></div>
                <input type="text" value={sub.name}
                  onChange={e => handleNameChange(sub.id, e.target.value)}
                  style={{ flex:1, background:'transparent', border:'none', padding:'4px 8px',
                           fontSize:'14px', color:'#64748b', outline:'none' }} />
                <button onClick={() => removeSubstitute(sub.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', padding:'8px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Pitch */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column',
                      alignItems:'center', padding:'40px 20px' }}>
          <div
            ref={boardRef}
            style={{
              position:'relative', width:'100%', maxWidth:'460px',
              aspectRatio:'4/5', maxHeight:'min(65vh, 600px)',
              background:'#16a34a', borderRadius:'24px',
              border:'6px solid #fff',
              boxShadow:'0 0 50px rgba(0,0,0,0.5)',
              flexShrink:0, marginBottom:'100px'
            }}
          >
            {/* Pitch markings */}
            <div style={{ position:'absolute', top:'25%', left:0, width:'100%', height:'2px', background:'rgba(255,255,255,0.4)' }}></div>
            <div style={{ position:'absolute', top:'25%', left:'50%', transform:'translate(-50%,-50%)',
                          width:'120px', height:'120px', border:'2px solid rgba(255,255,255,0.4)',
                          borderRadius:'50%', pointerEvents:'none' }}></div>
            <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
                          width:'65%', height:'20%', border:'2px solid rgba(255,255,255,0.4)',
                          borderBottom:'none', pointerEvents:'none' }}></div>

            {/* Bench zone */}
            <div style={{
              position:'absolute', bottom:'-90px', left:'50%', transform:'translateX(-50%)',
              width:'100%', height:'76px',
              border:'2px dashed rgba(255,255,255,0.2)', borderRadius:'20px',
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents:'none'
            }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', opacity:0.3 }}>
                <ArrowLeftRight size={20} color="#fff" style={{ marginBottom:'4px' }} />
                <span style={{ fontSize:'10px', fontWeight:'bold', color:'#fff', letterSpacing:'4px', textTransform:'uppercase' }}>
                  Substitute Zone
                </span>
              </div>
            </div>

            {/* Players */}
            {allPlayers.map(player => (
              <div key={`icon-${player.id}`}
                onMouseDown={() => handleStart(player.id)}
                onTouchStart={() => handleStart(player.id)}
                style={{
                  position:'absolute',
                  left:`${player.x}%`, top:`${player.y}%`,
                  transform:'translate(-50%,-50%)',
                  zIndex: draggedPlayerId === player.id ? 100 : 20,
                  cursor:'grab',
                  transition: draggedPlayerId === player.id ? 'none' : 'all 0.3s',
                  touchAction:'none'
                }}
              >
                <div style={{
                  width:'52px', height:'52px', borderRadius:'50%',
                  border: player.isBench ? '2px dashed #fff' : '2px solid #fff',
                  background: player.color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
                  opacity: player.isBench ? 0.8 : 1,
                  transform: draggedPlayerId === player.id ? 'scale(1.25)' : 'scale(1)',
                  transition:'transform 0.15s'
                }}>
                  <span style={{
                    color:'#fff', fontWeight:'900', fontSize:'11px',
                    textAlign:'center', lineHeight:'1.2',
                    textShadow:'0 2px 2px rgba(0,0,0,0.5)',
                    padding:'0 4px', userSelect:'none',
                    pointerEvents:'none', wordBreak:'break-all',
                    width:'100%', display:'block', textTransform:'uppercase'
                  }}>
                    {player.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
