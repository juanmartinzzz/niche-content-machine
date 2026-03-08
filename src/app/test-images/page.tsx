'use client';

import React, { useState } from 'react';
import { PillList, JsonTreeViewer, Button } from '@/components/interaction';
import { PillOption } from '@/components/interaction/types';

const visualStyleOptions: PillOption[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'retro', label: 'Retro' },
  { id: 'bold', label: 'Bold' },
  { id: 'playful', label: 'Playful' },
];

export default function TestImagesPage() {
  const [jsonInput, setJsonInput] = useState(`{
  "text": "Pineapple belongs on pizza - fight me!",
  "author": "Chef Mario",
  "topic": "Food Wars"
}`);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['minimal']);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setError('');
      setGeneratedImages([]);

      // Parse JSON input
      let inputData;
      try {
        inputData = JSON.parse(jsonInput);
      } catch (parseError) {
        setError('Invalid JSON format');
        return;
      }

      // Use selected style or fallback to first one
      const visualStyle = selectedStyles[0] || 'minimal';

      // Call API
      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...inputData,
          visualStyle: visualStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate images');
      }

      const result = await response.json();
      setGeneratedImages(result.images);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Hot Take Image Generator
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="space-y-6">
            {/* JSON Input */}
            <JsonTreeViewer
              label="Template Data (JSON)"
              placeholder={`Enter JSON template data (e.g., { "text": "your message", "author": "name" })...`}
              value={jsonInput}
              onChange={setJsonInput}
            />

            {/* Visual Style Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visual Style
              </label>
              <PillList
                options={visualStyleOptions}
                selected={selectedStyles}
                onChange={setSelectedStyles}
                variant="single"
                size="sm"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating...' : 'Generate Images'}
            </Button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Generated Images
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((imageDataUrl, index) => (
                <div key={index} className="flex flex-col items-center">
                  <img
                    src={imageDataUrl}
                    alt={`Generated hot take ${index + 1}`}
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = imageDataUrl;
                      link.download = `hot-take-${selectedStyles[0]}-${index + 1}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}