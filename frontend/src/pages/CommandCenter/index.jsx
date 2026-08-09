import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { 
  Brain, LayoutDashboard, Network, Activity, 
  Cpu, Settings, FileCode, Terminal, Loader2
} from 'lucide-react';
import { tasksAPI } from '../../apis';
import { useAuth } from '../../context/AuthContext';

/**
 * AgentCard - Displays individual agent orchestration state with looping video background
 */
const AgentCard = ({ name, videoUrl, status, load, logs, delay = 0 }) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, 
        { opacity: 0, x: -50, filter: 'blur(10px)' },
        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 1.2, ease: "power4.out", delay }
      );
    });
    return () => ctx.revert();
  }, [delay]);

  return (
    <article 
      ref={cardRef}
      className="neural-card glass rounded-tr-none flex h-64 group relative overflow-hidden transition-all hover:border-white/30"
      style={{ clipPath: 'polygon(0% 0%, 90% 0%, 100% 10%, 100% 100%, 0% 100%)' }}
    >
      <div className="w-1/2 relative overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
          src={videoUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A1A1C]" />
      </div>
      <div className="w-1/2 p-6 flex flex-col justify-between relative z-10">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-lavender/10 flex items-center justify-center">
              <Cpu className="text-lavender w-4 h-4" />
            </div>
            <h3 className="font-mono text-lg uppercase tracking-tight text-white">{name}</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
              <span>Inference Load</span>
              <span className="text-sage">{status}</span>
            </div>
            <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
              <div 
                className="h-full bg-sage shadow-[0_0_12px_rgba(107,142,118,0.6)] transition-all duration-[2000ms] ease-neural-flow" 
                style={{ width: `${load}%` }} 
              />
            </div>
          </div>
        </div>
        <div className="bg-black/60 backdrop-blur-md p-3 rounded border border-white/5 overflow-hidden font-mono text-[10px] text-white/40 group-hover:text-white/60 transition-colors">
          {logs.map((log, i) => (
            <div key={i} className="flex space-x-2 mb-0.5 last:mb-0">
              <span className="text-lavender select-none">{'>>'}</span>
              <span className="truncate">{log}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-30 transition-opacity">
        <img 
          src="https://cdn.jsdelivr.net/npm/game-icons-transparent@latest/svgs/lorc/corner-explosion.svg" 
          className="w-8 h-8 invert"
          alt="decoration"
        />
      </div>
    </article>
  );
};

/**
 * ArtifactBento - Staggered grid of generated assets and system states
 */
const ArtifactBento = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".bento-item", {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.5
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="flex-1 p-8 grid grid-cols-2 gap-4 auto-rows-[160px] custom-scrollbar overflow-y-auto bg-black/10"
    >
      <div className="col-span-2 mb-4 bento-item">
        <h2 className="font-mono uppercase tracking-[0.3em] text-lavender text-sm font-medium">
          Artifact Repository
        </h2>
      </div>

      {/* Bento Box 1: Large Preview */}
      <div className="bento-item col-span-1 row-span-2 glass p-1 neural-border group relative overflow-hidden">
        <div className="absolute top-3 left-3 text-[10px] font-mono text-white/20 z-10">01</div>
        <div className="h-full w-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <img 
              className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
              src="https://images.unsplash.com/photo-1721244654392-9c912a6eb236?auto=format&w=800&q=90&fit=crop"
              alt="Blueprint"
            />
          </div>
          <div className="p-5 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent absolute inset-0">
            <span className="text-[9px] font-mono text-lavender uppercase tracking-widest mb-1">Architecture Protocol</span>
            <h4 className="text-sm font-semibold text-white group-hover:text-lavender transition-colors">TSK-092: Core Blueprint</h4>
          </div>
        </div>
      </div>

      {/* Bento Box 2: Info Square */}
      <div className="bento-item col-span-1 row-span-1 glass p-6 neural-border flex flex-col justify-between group relative hover:bg-white/[0.03] transition-colors">
        <div className="absolute top-3 left-3 text-[10px] font-mono text-white/20">02</div>
        <FileCode className="text-sage w-8 h-8 group-hover:scale-110 transition-transform" />
        <div>
          <h4 className="text-xs font-mono uppercase tracking-widest text-white/60">Schema Update</h4>
          <p className="text-[10px] text-white/30 mt-1 font-mono">v4.2.1 deployment pending</p>
        </div>
      </div>

      {/* Bento Box 3: Status Strip */}
      <div className="bento-item col-span-1 row-span-1 bg-lavender/10 border border-lavender/30 p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-3 left-3 text-[10px] font-mono text-lavender/40">03</div>
        <div className="flex items-center space-x-2">
          <Activity className="text-lavender w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase text-lavender tracking-wider">Critical Task</span>
        </div>
        <p className="text-[10px] text-lavender font-mono animate-pulse">NEURAL_DRIFT_DETECTED</p>
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-lavender/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
      </div>

      {/* Bento Box 4: Task Queue */}
      <div className="bento-item col-span-1 row-span-2 glass p-1 neural-border group overflow-hidden relative">
        <div className="absolute top-3 left-3 text-[10px] font-mono text-white/20 z-10">04</div>
        <div className="h-full w-full flex flex-col">
          <div className="p-5 flex-1">
            <h4 className="text-xs font-mono uppercase tracking-widest mb-5 text-white/60 group-hover:text-white transition-colors">Task Queue</h4>
            <ul className="space-y-4">
              {[
                { name: 'Data Extraction', val: '92%', color: 'text-sage' },
                { name: 'Pattern Sync', val: 'WAIT', color: 'text-white/20' },
                { name: 'Latent Space Map', val: 'RUN', color: 'text-lavender' }
              ].map((item, i) => (
                <li key={i} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-white/40">{item.name}</span>
                  <span className={item.color}>{item.val}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="h-1/2 bg-white/5 p-2 overflow-hidden">
            <img 
              className="w-full h-full object-cover opacity-20 group-hover:opacity-60 group-hover:scale-105 transition-all duration-1000"
              src="https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&w=800&fit=crop"
              alt="Queue"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default function CommandCenterPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksAPI.stats()
      .then(res => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-charcoal overflow-hidden select-none">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Vertical Control Strip */}
        <aside className="w-20 glass flex flex-col items-center py-8 space-y-8 z-30 border-r border-white/5">
          <div className="w-12 h-12 bg-white flex items-center justify-center rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Brain className="text-black w-6 h-6" />
          </div>
          <nav className="flex flex-col space-y-5">
            {[
              { icon: LayoutDashboard, active: true },
              { icon: Network, active: false },
              { icon: Activity, active: false },
              { icon: Cpu, active: false }
            ].map((btn, i) => (
              <button 
                key={i} 
                className={`w-12 h-12 flex items-center justify-center rounded-sm transition-all duration-300 ${
                  btn.active ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-white/30 hover:text-white hover:bg-white/5'
                }`}
              >
                <btn.icon className="w-5 h-5" />
              </button>
            ))}
          </nav>
          <div className="mt-auto">
            <button className="w-12 h-12 flex items-center justify-center text-white/30 hover:text-white transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex overflow-hidden">
          {/* Agent Orchestration Column */}
          <section className="w-1/2 flex flex-col p-10 border-r border-white/5 custom-scrollbar overflow-y-auto">
            <header className="mb-12 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="font-mono uppercase tracking-[0.4em] text-lavender text-xs font-bold opacity-80">
                  Active Neural Nodes
                </h2>
                <p className="text-[11px] text-white/30 font-medium">Real-time inference & synthesis protocol v4.2</p>
              </div>
              <div className="px-4 py-1.5 bg-sage/5 border border-sage/20 rounded-full flex items-center space-x-2.5 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-sage rounded-full animate-ping" />
                <span className="text-[10px] font-mono text-sage uppercase tracking-widest font-bold">
                  DENSITY: {loading ? '...' : (stats?.total || '98.4%')}
                </span>
              </div>
            </header>
            
            <div className="space-y-8 pb-10">
              <AgentCard 
                name="Vesper-Alpha"
                videoUrl="https://videos.pexels.com/video-files/12920672/12920672-hd_1280_720_30fps.mp4"
                status="Stable"
                load={75}
                logs={["ANALYZING_CORE_PROTOCOL_V4...", "SYNCING_ARTIFACT_CACHE...", "STATE: SYNTHESIZING"]}
                delay={0.2}
              />
              <AgentCard 
                name="Kinesis-Prime"
                videoUrl="https://videos.pexels.com/video-files/30162924/12934302_640_360_30fps.mp4"
                status="Optimal"
                load={50}
                logs={["REFRAMING_ARCHITECTURE...", "MAPPING_NEURAL_NODES...", "STATE: OPTIMIZING"]}
                delay={0.4}
              />
            </div>
          </section>

          {/* Artifact Repository Section */}
          <ArtifactBento />
        </main>
      </div>

      {/* Persistent System Ticker */}
      <footer className="h-10 glass border-t border-white/10 flex items-center px-8 overflow-hidden z-40">
        <div className="flex items-center space-x-5 pr-8 border-r border-white/10 mr-8 flex-shrink-0">
          <span className="text-[9px] font-mono text-lavender uppercase tracking-[0.2em] font-bold">System Output</span>
          <span className="w-1.5 h-1.5 bg-lavender rounded-full shadow-[0_0_10px_rgba(136,117,184,1)] animate-pulse" />
        </div>
        
        <div className="flex-1 overflow-hidden relative group">
          <div className="animate-marquee inline-block whitespace-nowrap font-mono text-[9px] text-white/30 uppercase tracking-[0.15em] space-x-16 py-1 group-hover:text-white/60 transition-colors cursor-default group-hover:[animation-play-state:paused]">
            <span>[SYNC_START] :: ALL_SYSTEMS_GO_VERIFIED :: CORE_TEMP_32C :: AGENT_VESPER_OPTIMIZED :: SYNCSPACE_PROTOCOL_V4.2.1 ::</span>
            <span>[TASK_RESOLVED] :: TSK-081_COMPLETED_SUCCESSFULLY :: CACHE_WIPE_IN_PROGRESS :: ARTIFACT_SYNC_100% ::</span>
            <span>[ALERT] :: MINOR_NEURAL_DRIFT_DETECTED_IN_SECTOR_7 :: AUTO_COMPENSATION_PROTOCOL_TRIGGERED ::</span>
            <span>[DATA] :: TOTAL_ARTIFACTS_SYNTHESIZED_14.2K :: LATENCY_STABLE_4MS :: CPU_DENSITY_NOMINAL ::</span>
          </div>
        </div>

        <div className="pl-8 border-l border-white/10 ml-8 flex-shrink-0 flex items-center space-x-3">
          <div className="w-1.5 h-1.5 bg-sage rounded-full" />
          <span className="text-[10px] font-mono text-white/20 tabular-nums">
            {new Date().toISOString().split('T')[0].replace(/-/g, '.')} // {new Date().toLocaleTimeString('en-GB', { hour12: false })}
          </span>
        </div>
      </footer>
    </div>
  );
}
