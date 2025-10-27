
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audio';
import { TranscriptEntry } from '../types';
import { MicrophoneIcon, StopIcon } from './icons/Icons';

const AIAssistant: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');

  const stopConversation = useCallback(() => {
    if (sessionRef.current) {
        sessionRef.current.then(session => session.close());
        sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
    nextStartTimeRef.current = 0;
  }, []);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setTranscript([]);
    
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      sessionRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are an expert hairstylist and makeup artist named Alex. Be friendly, helpful, and creative. Give style advice and answer questions.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: async () => {
            try {
              mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
              const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current);
              audioProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
              
              audioProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                if (sessionRef.current) {
                  sessionRef.current.then((session) => {
                     session.sendRealtimeInput({ media: pcmBlob });
                  });
                }
              };

              source.connect(audioProcessorRef.current);
              audioProcessorRef.current.connect(inputAudioContextRef.current!.destination);
              setIsConnecting(false);
              setIsActive(true);
            } catch (err) {
              setError('Microphone access denied. Please allow microphone access to use the AI Assistant.');
              stopConversation();
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle transcription
            if (message.serverContent?.outputTranscription) {
                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.inputTranscription) {
                currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
                const userInput = currentInputTranscriptionRef.current.trim();
                const modelOutput = currentOutputTranscriptionRef.current.trim();
                setTranscript(prev => {
                    const newTranscript = [...prev];
                    if (userInput) newTranscript.push({ source: 'user', text: userInput });
                    if (modelOutput) newTranscript.push({ source: 'model', text: modelOutput });
                    return newTranscript;
                });
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
            }

            // Handle audio playback
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const outputCtx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(source => source.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            stopConversation();
          },
          onerror: (e) => {
            setError(`An error occurred: ${e.type}`);
            stopConversation();
          },
        },
      });
    } catch (err: any) {
      setError(`Failed to start session: ${err.message}`);
      setIsConnecting(false);
    }
  }, [stopConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);


  return (
    <div className="container mx-auto max-w-4xl">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold font-serif text-stone-900">AI Stylist Assistant</h2>
        <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">Have a real-time conversation with Alex, your personal AI stylist. Ask for advice, explore ideas, or just chat about the latest trends.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex justify-center mb-6">
          {!isActive && !isConnecting && (
            <button onClick={startConversation} className="flex items-center justify-center w-24 h-24 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500">
              <MicrophoneIcon className="w-10 h-10" />
            </button>
          )}
          {isConnecting && (
             <div className="flex items-center justify-center w-24 h-24 bg-stone-200 text-stone-600 rounded-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-600"></div>
            </div>
          )}
          {isActive && (
            <button onClick={stopConversation} className="flex items-center justify-center w-24 h-24 bg-stone-600 text-white rounded-full shadow-lg hover:bg-stone-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-600">
               <StopIcon className="w-10 h-10" />
            </button>
          )}
        </div>
        <div className="text-center text-stone-600 mb-8 h-6">
          {isConnecting && "Connecting..."}
          {isActive && <span className="text-green-600 font-semibold animate-pulse">Listening...</span>}
          {!isActive && !isConnecting && "Tap the microphone to start"}
        </div>
        
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        
        <div className="h-96 bg-stone-50 rounded-lg p-4 overflow-y-auto space-y-4 border border-stone-200">
          {transcript.length === 0 && !isConnecting && (
            <div className="flex items-center justify-center h-full">
                <p className="text-stone-500">Your conversation will appear here.</p>
            </div>
          )}
          {transcript.map((entry, index) => (
            <div key={index} className={`flex ${entry.source === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md px-4 py-2 rounded-xl ${entry.source === 'user' ? 'bg-rose-500 text-white' : 'bg-stone-200 text-stone-800'}`}>
                <p>{entry.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
