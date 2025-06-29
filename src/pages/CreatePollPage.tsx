import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PollForm } from '../components/PollForm';
import { PollTemplates, PollTemplate } from '../components/PollTemplates';
import { supabase } from '../lib/supabase';
import { CreatePollData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, BookTemplate as Template } from 'lucide-react';
import toast from 'react-hot-toast';

export function CreatePollPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PollTemplate | null>(null);

  const handleCreatePoll = async (pollData: CreatePollData) => {
    if (!user) {
      toast.error('You must be signed in to create a poll');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('polls')
        .insert([
          {
            question: pollData.question,
            options: pollData.options,
            settings: pollData.settings,
            created_by: user.id,
            ends_at: pollData.ends_at || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Poll created successfully!');
      navigate(`/poll/${data.id}`);
    } catch (error: any) {
      console.error('Error creating poll:', error);
      toast.error(error.message || 'Failed to create poll');
    }
  };

  const handleSelectTemplate = (template: PollTemplate) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Template Button */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mr-4 shadow-xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Create Amazing Poll
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Engage your audience with interactive polls
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTemplates(true)}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <Template className="h-5 w-5 mr-2" />
          Choose from Templates
        </button>
      </div>

      <PollForm 
        onSubmit={handleCreatePoll} 
        initialData={selectedTemplate ? {
          question: selectedTemplate.question,
          options: selectedTemplate.options,
          settings: selectedTemplate.settings
        } : undefined}
      />

      {showTemplates && (
        <PollTemplates
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}