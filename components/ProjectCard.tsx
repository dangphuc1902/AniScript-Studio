import React from 'react';
import { Project, VideoType } from '../types';
import { Film, Clapperboard, Calendar, ChevronRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onDelete }) => {
  return (
    <div 
      className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all cursor-pointer group shadow-lg"
      onClick={() => onSelect(project)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${project.type === VideoType.SHORT ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {project.type === VideoType.SHORT ? <Clapperboard size={24} /> : <Film size={24} />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{project.name}</h3>
            <span className="text-xs text-gray-400 uppercase tracking-wider">{project.style}</span>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
          className="text-gray-500 hover:text-red-400 p-2 hover:bg-gray-700 rounded-full transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-gray-400 text-sm line-clamp-2 min-h-[2.5rem]">
          {project.storyIdea || "No story idea yet..."}
        </p>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 border-t border-gray-700 pt-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="font-semibold text-gray-300">{project.characters.length}</span> Characters
          </span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-gray-300">{project.scenes.length}</span> Scenes
          </span>
        </div>
        <div className="flex items-center gap-1 text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Open Project <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};