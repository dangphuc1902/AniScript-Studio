import React, { useState, useEffect } from 'react';
import { Project, VideoType, AnimationStyle, Scene, Character, INITIAL_CHARACTERS_JSON, ProjectIdea } from './types';
import { generateStoryScenes, generateProjectIdea } from './services/geminiService';
import { ProjectCard } from './components/ProjectCard';
import { CharacterManager } from './components/CharacterManager';
import { Storyboard } from './components/Storyboard';
import { Plus, Video, LayoutGrid, ArrowLeft, Loader2, Save, BrainCircuit, Sparkles, CheckCircle2 } from 'lucide-react';

// --- Local Storage Helper ---
const STORAGE_KEY = 'aniscript_projects';
const loadProjects = (): Project[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};
const saveProjectsToStorage = (projects: Project[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [view, setView] = useState<'dashboard' | 'create' | 'workspace'>('dashboard');

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<VideoType>(VideoType.SHORT);
  const [newProjectStyle, setNewProjectStyle] = useState<AnimationStyle>(AnimationStyle.DISNEY_PIXAR);
  const [storyIdea, setStoryIdea] = useState('');
  const [customCharacters, setCustomCharacters] = useState<Character[] | null>(null);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [brainstormTopic, setBrainstormTopic] = useState('');
  const [recommendedIdea, setRecommendedIdea] = useState<ProjectIdea | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const handleCreateProject = () => {
    // Use custom characters from AI recommendation if available, otherwise default
    const initialChars = customCharacters || JSON.parse(INITIAL_CHARACTERS_JSON).characters;
    
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName || 'Untitled Project',
      type: newProjectType,
      style: newProjectStyle,
      createdAt: Date.now(),
      characters: initialChars,
      scenes: [],
      storyIdea: storyIdea
    };
    const updated = [newProject, ...projects];
    setProjects(updated);
    saveProjectsToStorage(updated);
    setCurrentProject(newProject);
    setView('workspace');
    
    // Reset form
    setNewProjectName('');
    setStoryIdea('');
    setCustomCharacters(null);
    setRecommendedIdea(null);
    setBrainstormTopic('');
  };

  const updateProject = (updated: Project) => {
    const newProjects = projects.map(p => p.id === updated.id ? updated : p);
    setProjects(newProjects);
    saveProjectsToStorage(newProjects);
    setCurrentProject(updated);
  };

  const handleDeleteProject = (id: string) => {
    if(!confirm("Are you sure you want to delete this project?")) return;
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    saveProjectsToStorage(newProjects);
    if(currentProject?.id === id) {
      setCurrentProject(null);
      setView('dashboard');
    }
  };

  const handleGenerateScript = async () => {
    if (!currentProject || !currentProject.storyIdea) return;
    setIsGenerating(true);
    try {
      const scenes = await generateStoryScenes(
        currentProject.storyIdea,
        currentProject.characters,
        currentProject.style,
        currentProject.type
      );
      updateProject({
        ...currentProject,
        scenes: scenes
      });
    } catch (e) {
      alert("Error generating script. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiBrainstorm = async () => {
    setIsBrainstorming(true);
    setRecommendedIdea(null);
    try {
      const idea = await generateProjectIdea(brainstormTopic);
      setRecommendedIdea(idea);
    } catch (e) {
      alert("Failed to brainstorm ideas. Please try again.");
    } finally {
      setIsBrainstorming(false);
    }
  };

  const applyRecommendedIdea = () => {
    if (!recommendedIdea) return;
    setNewProjectName(recommendedIdea.name);
    setNewProjectType(recommendedIdea.type);
    setNewProjectStyle(recommendedIdea.style);
    setStoryIdea(recommendedIdea.storyIdea);
    setCustomCharacters(recommendedIdea.characters);
  };

  // --- Render Views ---

  const renderDashboard = () => (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AniScript Studio
          </h1>
          <p className="text-gray-400 mt-2">AI-Powered Storyboarding & Prompt Engineering</p>
        </div>
        <button 
          onClick={() => {
            setView('create');
            setCustomCharacters(null); // Reset characters on new project
            setRecommendedIdea(null);
          }}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-purple-900/50 flex items-center gap-2 transition-transform hover:scale-105"
        >
          <Plus size={20} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(p => (
          <ProjectCard 
            key={p.id} 
            project={p} 
            onSelect={(proj) => { setCurrentProject(proj); setView('workspace'); }}
            onDelete={handleDeleteProject}
          />
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-20 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
            <Video size={48} className="mx-auto text-gray-700 mb-4" />
            <h3 className="text-xl text-gray-500 font-semibold">No projects yet</h3>
            <p className="text-gray-600">Create your first animation storyboard.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateWizard = () => (
    <div className="container mx-auto px-4 py-8 max-w-3xl min-h-screen flex flex-col justify-center">
      <button onClick={() => setView('dashboard')} className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 w-fit">
        <ArrowLeft size={18} /> Back to Dashboard
      </button>
      
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="text-3xl font-bold text-white mb-6">Create New Project</h2>

        {/* AI Brainstorming Section */}
        <div className="mb-8 bg-gray-900/50 border border-purple-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit className="text-purple-400" size={20} />
            <h3 className="font-bold text-gray-200">AI Brainstorm & Recommendation</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Stuck? Enter a topic (or leave blank) and let AI suggest a full project plan including characters and style.
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={brainstormTopic}
              onChange={(e) => setBrainstormTopic(e.target.value)}
              placeholder="Topic e.g. 'Cyberpunk Cats', 'Mystery', or leave empty for trends"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-purple-500 outline-none text-sm"
            />
            <button 
              onClick={handleAiBrainstorm}
              disabled={isBrainstorming}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              {isBrainstorming ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Recommend Idea
            </button>
          </div>

          {recommendedIdea && (
            <div className="mt-4 bg-gray-800 border border-gray-700 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-white text-lg">{recommendedIdea.name}</h4>
                  <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span className="bg-gray-700 px-2 py-0.5 rounded">{recommendedIdea.type.split(' ')[0]}</span>
                    <span className="bg-gray-700 px-2 py-0.5 rounded">{recommendedIdea.style}</span>
                    <span className="bg-gray-700 px-2 py-0.5 rounded">{recommendedIdea.characters.length} Chars</span>
                  </div>
                </div>
                <button 
                  onClick={applyRecommendedIdea}
                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <CheckCircle2 size={14} /> Use This
                </button>
              </div>
              <p className="text-gray-300 text-sm italic border-l-2 border-purple-500 pl-3 py-1 bg-gray-900/30">
                {recommendedIdea.storyIdea}
              </p>
            </div>
          )}
        </div>
        
        {/* Manual Input Form */}
        <div className="space-y-6 border-t border-gray-700 pt-6">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Project Name</label>
            <input 
              type="text" 
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="e.g., The Lost Puppy"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Video Format</label>
              <select 
                value={newProjectType}
                onChange={e => setNewProjectType(e.target.value as VideoType)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {Object.values(VideoType).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Art Style</label>
              <select 
                value={newProjectStyle}
                onChange={e => setNewProjectStyle(e.target.value as AnimationStyle)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {Object.values(AnimationStyle).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Initial Story Idea (Optional)</label>
            <textarea 
              value={storyIdea}
              onChange={e => setStoryIdea(e.target.value)}
              placeholder="A brief summary of what happens..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white h-24 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          
          {customCharacters && (
            <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-full">
                <CheckCircle2 size={16} className="text-purple-400" />
              </div>
              <div className="text-sm">
                <p className="text-white font-medium">Character Set Loaded</p>
                <p className="text-gray-400">{customCharacters.length} characters ready from recommendation.</p>
              </div>
            </div>
          )}

          <button 
            onClick={handleCreateProject}
            disabled={!newProjectName}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-4 rounded-xl font-bold text-lg transition-colors mt-4"
          >
            Start Creating
          </button>
        </div>
      </div>
    </div>
  );

  const renderWorkspace = () => {
    if (!currentProject) return null;
    return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-20">
          <div className="container mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('dashboard')} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{currentProject.name}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="bg-gray-800 px-2 py-0.5 rounded text-purple-400">{currentProject.type.split(' ')[0]}</span>
                  <span>•</span>
                  <span>{currentProject.style}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:inline">Auto-saved to LocalStorage</span>
              <button className="bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 border border-gray-700">
                <Save size={14} /> Saved
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-950 p-4">
          <div className="container mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left Panel: Inputs & Characters */}
            <div className="xl:col-span-4 space-y-6">
              {/* Plot Section */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-3">Story Plot</h3>
                <textarea
                  value={currentProject.storyIdea}
                  onChange={(e) => updateProject({ ...currentProject, storyIdea: e.target.value })}
                  className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 mb-4"
                  placeholder="Describe your story here..."
                />
                <button
                  onClick={handleGenerateScript}
                  disabled={isGenerating || !currentProject.storyIdea}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-lg font-bold shadow-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <LayoutGrid size={18} />}
                  {currentProject.scenes.length > 0 ? "Regenerate Scenes" : "Generate Scenes"}
                </button>
              </div>

              {/* Characters Section */}
              <CharacterManager 
                characters={currentProject.characters} 
                onUpdate={(chars) => updateProject({ ...currentProject, characters: chars })}
              />
            </div>

            {/* Right Panel: Storyboard */}
            <div className="xl:col-span-8">
              {currentProject.scenes.length > 0 ? (
                <Storyboard 
                  project={currentProject} 
                  onUpdateProject={updateProject} 
                />
              ) : (
                <div className="bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-xl h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-gray-800 p-4 rounded-full mb-4">
                    <LayoutGrid size={48} className="text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-300 mb-2">Storyboard Empty</h3>
                  <p className="text-gray-500 max-w-md">
                    Enter your story idea on the left and click "Generate Scenes" to let AI create your script and visual prompts.
                  </p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    );
  };

  return (
    <>
      {view === 'dashboard' && renderDashboard()}
      {view === 'create' && renderCreateWizard()}
      {view === 'workspace' && renderWorkspace()}
    </>
  );
};

export default App;