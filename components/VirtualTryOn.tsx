import React, { useState, useCallback, ChangeEvent } from 'react';
import { editImage } from '../services/geminiService';
import { blobToBase64 } from '../utils/image';
import { UploadIcon, SparklesIcon } from './icons/Icons';

const VirtualTryOn: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string>('');

  const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = async () => {
    if (!originalImageFile || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const base64Data = await blobToBase64(originalImageFile);
      const result = await editImage(base64Data, originalImageFile.type, prompt);
      setEditedImage(result);
    } catch (err: any) {
      setError(`Failed to edit image: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestion = async () => {
    if (!originalImageFile) {
      setError('Please upload an image to get a suggestion.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const base64Data = await blobToBase64(originalImageFile);
      // Let Gemini suggest a new look
      const suggestionPrompt = "Analyze this person's face shape and features. Suggest a flattering hairstyle and makeup look that would suit them. Then, apply that look to the image.";
      const result = await editImage(base64Data, originalImageFile.type, suggestionPrompt);
      setEditedImage(result);
      setPrompt("AI Suggested Look");
    } catch (err: any) {
      setError(`Failed to generate suggestion: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="container mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold font-serif text-stone-900">Virtual Beauty Studio</h2>
        <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">Upload your photo and describe your dream look, or let our AI surprise you with a stunning transformation!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="w-full space-y-6 bg-white p-8 rounded-2xl shadow-lg lg:col-span-2">
          <div className="space-y-2">
            <label htmlFor="image-upload" className="text-lg font-medium text-stone-700">1. Upload Your Photo</label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-stone-300 border-dashed rounded-lg cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadIcon className="w-10 h-10 mb-3 text-stone-400" />
                        <p className="mb-2 text-sm text-stone-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-stone-500">PNG, JPG or WEBP</p>
                    </div>
                    <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="prompt" className="text-lg font-medium text-stone-700">2. Describe Your Look</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Give me a short bob with platinum blonde highlights and a smokey eye makeup look.'"
              className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow duration-200"
              rows={3}
              disabled={!originalImage || isLoading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSubmit}
              disabled={!originalImage || !prompt || isLoading}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Generate My Look
            </button>
            <button
              onClick={handleSuggestion}
              disabled={!originalImage || isLoading}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-stone-300 text-base font-medium rounded-md text-stone-700 bg-white hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:bg-stone-200 disabled:cursor-not-allowed transition-colors"
            >
              Suggest a Look for Me
            </button>
          </div>
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-3">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2 text-stone-800">Original</h3>
            <div className="w-full min-h-96 bg-stone-200 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden">
              {originalImage ? (
                <img src={originalImage} alt="Original" className="object-contain w-full h-full" />
              ) : (
                <p className="text-stone-500">Your photo here</p>
              )}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2 text-stone-800">Your New Look</h3>
            <div className="w-full min-h-96 bg-stone-200 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                    <p className="mt-4 text-stone-600">Creating magic...</p>
                </div>
              ) : editedImage ? (
                <img src={editedImage} alt="Edited" className="object-contain w-full h-full" />
              ) : (
                <p className="text-stone-500">AI transformation here</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;