"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

// We define the TypeScript shape of the data coming from our database
interface Track {
  id: string;
  originalFileName: string;
  createdAt: string;
  fileAsset: {
    compressedAudioUrl: string;
    midiUrl: string;
  };
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await fetch("/api/tracks");
        if (!response.ok) throw new Error("Failed to fetch tracks");
        
        const data = await response.json();
        setTracks(data);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, []);

  return (
    <main className="app-container">
      <div className="relative z-10">
        
        {/* Header Navigation */}
        <header className="mb-8 flex flex-col justify-between gap-6 border-b border-white/10 pb-6 md:mb-12 md:flex-row md:items-end md:pb-8">
          <div>
            <h1 className="ui-title text-3xl sm:text-4xl md:text-5xl">
              The <span className="ui-gradient">Vault</span>
            </h1>
            <p className="ui-muted mt-2">
              {session?.user?.name}'s generated neural basslines.
            </p>
          </div>
          <Link 
            href="/studio"
            className="ui-focus flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-medium transition-all hover:scale-[1.02] hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New Generation
          </Link>
        </header>

        {/* Dashboard Content */}
        {isLoading ? (
          <div className="w-full flex justify-center py-20">
            <svg className="h-10 w-10 animate-spin text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>
        ) : tracks.length === 0 ? (
          <div className="glass-panel mx-auto flex w-full max-w-3xl flex-col items-center justify-center rounded-3xl p-10 text-center md:p-16">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Your Vault is Empty</h3>
            <p className="text-neutral-400 max-w-md">You haven't generated any tracks yet. Head over to the Studio to initialize your first neural bassline.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {tracks.map((track) => (
              <div key={track.id} className="glass-panel ui-card-hover group flex flex-col rounded-2xl p-5 md:p-6">
                
                {/* Card Header: Title and Date */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="max-w-56 truncate text-lg font-bold text-white md:max-w-72" title={track.originalFileName}>
                      {track.originalFileName}
                    </h3>
                    <p className="mt-1 font-mono text-sm text-slate-400">
                      {new Date(track.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                    Processed
                  </span>
                </div>

                {/* Audio Player (From Cloud Bucket) */}
                <div className="mb-6 w-full rounded-xl border border-white/10 bg-black/50 p-3">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">Original Source</span>
                  </div>
                  <audio 
                    controls 
                    src={track.fileAsset.compressedAudioUrl} 
                    className="w-full h-10 outline-none opacity-80 hover:opacity-100 transition-opacity [&::-webkit-media-controls-panel]:bg-neutral-900" 
                  />
                </div>

                {/* Action Footer */}
                <div className="mt-auto">
                  <a
                    href={track.fileAsset.midiUrl}
                    download={`RhythmAI_${track.originalFileName}.mid`}
                    className="ui-focus flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-bold text-black transition-all hover:scale-[1.01] hover:bg-neutral-200 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download MIDI
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}