import React, { useState } from 'react';
import { Character, INITIAL_CHARACTERS_JSON } from '../types';
import { User, Sparkles, Upload, Save, Trash2 } from 'lucide-react';

interface CharacterManagerProps {
  characters: Character[];
  onUpdate: (chars: Character[]) => void;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({ characters, onUpdate }) => {
  const [jsonInput, setJsonInput] = useState(INITIAL_CHARACTERS_JSON);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [error, setError] = useState<string | null>(null);

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed.characters)) {
        onUpdate([...characters, ...parsed.characters]); // Append or replace depending on UX preference. Here appending.
        setError(null);
        alert(`Successfully imported ${parsed.characters.length} characters.`);
      } else {
        setError("Invalid JSON format: missing 'characters' array.");
      }
    } catch (e) {
      setError("Invalid JSON syntax.");
    }
  };

  const removeCharacter = (id: string) => {
    onUpdate(characters.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="text-purple-400" /> Characters
        </h2>
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button 
            onClick={() => setViewMode('visual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'visual' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Visual List
          </button>
          <button 
            onClick={() => setViewMode('json')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'json' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            JSON Import
          </button>
        </div>
      </div>

      {viewMode === 'json' ? (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">Paste JSON Schema</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-64 bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-green-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button 
            onClick={handleImportJson}
            className="mt-4 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Upload size={18} /> Import Characters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <div key={char.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 relative group">
               <button 
                onClick={() => removeCharacter(char.id)}
                className="absolute top-3 right-3 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {char.name.charAt(0)}
                </div>
                <h3 className="font-bold text-lg text-white">{char.name}</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-300"><span className="text-gray-500 font-semibold">Desc:</span> {char.description}</p>
                <p className="text-sm text-gray-300"><span className="text-gray-500 font-semibold">Features:</span> {char.features}</p>
                {char.personality && <p className="text-sm text-gray-300"><span className="text-gray-500 font-semibold">Personality:</span> {char.personality}</p>}
              </div>
            </div>
          ))}
          {characters.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-700 rounded-xl">
              <p className="text-gray-500 mb-4">No characters added yet.</p>
              <button onClick={() => setViewMode('json')} className="text-purple-400 hover:underline">Import JSON to get started</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};