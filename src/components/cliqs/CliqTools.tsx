'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  CalendarIcon, 
  Gamepad2Icon, 
  VideoIcon, 
  GraduationCapIcon, 
  BotIcon
} from 'lucide-react';

export default function CliqTools({ cliqId }: { cliqId: string }) {
  const router = useRouter();

  const tools = [
    {
      icon: CalendarIcon,
      label: 'Calendar',
      onClick: () => router.push(`/calendar?cliqId=${cliqId}`),
    },
    {
      icon: Gamepad2Icon,
      label: 'Games',
      onClick: () => console.log('Games clicked'),
    },
    {
      icon: VideoIcon,
      label: 'Video Chat',
      onClick: () => console.log('Video Chat clicked'),
    },
    {
      icon: GraduationCapIcon,
      label: 'Homework Help',
      onClick: () => console.log('Homework Help clicked'),
    },
    {
      icon: BotIcon,
      label: 'Help (Pip)',
      onClick: () => console.log('Help clicked'),
    },
  ];

  return (
    <>
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Cliq Tools</h2>
      
      {/* Tools Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 justify-items-center mt-4">
        {/* Regular Tools */}
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.label}
              onClick={tool.onClick}
              className="p-4 rounded-2xl bg-white border border-gray-200 text-gray-800 flex flex-col items-center w-24 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <IconComponent className="h-6 w-6 mb-2 text-black" />
              <span className="text-sm font-medium text-center">{tool.label}</span>
            </button>
          );
        })}
        
      </div>
    </>
  );
}

