import React, { useState } from 'react';
import { Scene, Project } from '../types';
import { generateScenePreview } from '../services/geminiService';
import { PlayCircle, Image as ImageIcon, Edit2, Save, RefreshCw, Wand2, Check, Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

interface StoryboardProps {
  project: Project;
  onUpdateProject: (p: Project) => void;
}

export const Storyboard: React.FC<StoryboardProps> = ({ project, onUpdateProject }) => {
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editPromptValue, setEditPromptValue] = useState("");
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [isZipping, setIsZipping] = useState(false);

  const handleEditClick = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setEditPromptValue(scene.visualPrompt);
  };

  const handleSavePrompt = (sceneId: string) => {
    const updatedScenes = project.scenes.map(s => 
      s.id === sceneId ? { ...s, visualPrompt: editPromptValue } : s
    );
    onUpdateProject({ ...project, scenes: updatedScenes });
    setEditingSceneId(null);
  };

  const handleGenerateImage = async (scene: Scene) => {
    setLoadingImages(prev => ({ ...prev, [scene.id]: true }));
    try {
      const base64Image = await generateScenePreview(scene.visualPrompt);
      const updatedScenes = project.scenes.map(s => 
        s.id === scene.id ? { ...s, generatedImageUrl: base64Image } : s
      );
      onUpdateProject({ ...project, scenes: updatedScenes });
    } catch (error) {
      alert("Failed to generate image. Try again.");
    } finally {
      setLoadingImages(prev => ({ ...prev, [scene.id]: false }));
    }
  };

  const handleDownloadAssets = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      let scriptContent = `Project: ${project.name}\nStyle: ${project.style}\nType: ${project.type}\nStory Idea: ${project.storyIdea}\n\n================================================\n\n`;

      project.scenes.forEach((scene) => {
        const imageName = `scene_${String(scene.sceneNumber).padStart(3, '0')}.png`;
        
        scriptContent += `SCENE ${scene.sceneNumber}\n`;
        scriptContent += `Duration: ${scene.duration}\n`;
        scriptContent += `Script: "${scene.script}"\n`;
        scriptContent += `Visual Prompt: ${scene.visualPrompt}\n`;
        scriptContent += `Generated Image File: ${scene.generatedImageUrl ? imageName : '[Not Generated Yet]'}\n`;
        scriptContent += `------------------------------------------------\n\n`;

        if (scene.generatedImageUrl) {
          // Remove data:image/png;base64, prefix to get clean base64 string
          const base64Data = scene.generatedImageUrl.split(',')[1];
          if (base64Data) {
            zip.file(imageName, base64Data, { base64: true });
          }
        }
      });

      zip.file("script_and_prompts.txt", scriptContent);

      const blob = await zip.generateAsync({ type: "blob" });
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_assets.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export assets.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wand2 className="text-purple-400" /> Storyboard & Prompts
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
            {project.scenes.length} Scenes
          </span>
          <button 
            onClick={handleDownloadAssets}
            disabled={isZipping || project.scenes.length === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-colors"
          >
            {isZipping ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download Assets
          </button>
        </div>
      </div>

      <div className="grid gap-8">
        {project.scenes.map((scene, index) => (
          <div key={scene.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl flex flex-col lg:flex-row">
            
            {/* Visual Column */}
            <div className="w-full lg:w-1/3 bg-gray-900 relative min-h-[250px] flex items-center justify-center border-r border-gray-700">
              {scene.generatedImageUrl ? (
                <>
                  <img src={scene.generatedImageUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handleGenerateImage(scene)}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <RefreshCw size={16} /> Regenerate
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  {loadingImages[scene.id] ? (
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-purple-400 text-sm">Generating Preview...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <ImageIcon size={48} className="text-gray-700" />
                      <button 
                        onClick={() => handleGenerateImage(scene)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg"
                      >
                        Generate Preview
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white px-2 py-1 text-xs font-bold rounded">
                Scene {scene.sceneNumber}
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-gray-300 px-2 py-1 text-xs rounded">
                {scene.duration}
              </div>
            </div>

            {/* Content Column */}
            <div className="w-full lg:w-2/3 p-6 flex flex-col gap-4">
              
              {/* Script Section */}
              <div className="bg-gray-750 rounded-lg p-4 border-l-4 border-blue-500">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1 flex items-center gap-2">
                   <PlayCircle size={12} /> Voiceover / Action
                </h4>
                <p className="text-gray-200 text-lg leading-relaxed font-serif italic">"{scene.script}"</p>
              </div>

              {/* Prompt Section */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wide flex items-center gap-2">
                    <Wand2 size={12} /> Image Generation Prompt
                  </h4>
                  {editingSceneId === scene.id ? (
                    <button 
                      onClick={() => handleSavePrompt(scene.id)}
                      className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1 font-bold"
                    >
                      <Check size={14} /> Save
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleEditClick(scene)}
                      className="text-gray-400 hover:text-white text-xs flex items-center gap-1"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  )}
                </div>

                {editingSceneId === scene.id ? (
                  <textarea
                    value={editPromptValue}
                    onChange={(e) => setEditPromptValue(e.target.value)}
                    className="w-full h-32 bg-gray-900 border border-purple-500/50 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                ) : (
                  <div 
                    onClick={() => handleEditClick(scene)}
                    className="w-full bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg p-3 text-sm text-gray-400 cursor-pointer transition-colors"
                  >
                    {scene.visualPrompt}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};