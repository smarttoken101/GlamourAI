
import React, { useState } from 'react';
import { generateInspirationImage } from '../services/geminiService';
import { SparklesIcon } from './icons/Icons';

const InspirationGallery: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please enter a description for the image.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const imageUrl = await generateInspirationImage(prompt);
      setGeneratedImages(prev => [imageUrl, ...prev]);
    } catch (err: any) {
      setError(`Failed to generate image: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold font-serif text-stone-900">Inspiration Gallery</h2>
        <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">Unleash your creativity. Describe any hairstyle or makeup concept, and our AI will bring it to life.</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg mb-12">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Futuristic braided hairstyle with neon pink glow'"
            className="flex-grow p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                </>
            ) : (
                <>
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Generate
                </>
            )}
          </button>
        </form>
        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
      </div>

      {generatedImages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {generatedImages.map((image, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden group">
              <img src={image} alt={`Generated inspiration ${index + 1}`} className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InspirationGallery;
