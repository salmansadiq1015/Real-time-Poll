import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PollForm } from '../components/PollForm';
import { supabase } from '../lib/supabase';
import { CreatePollData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function CreatePollPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  return (
    <div className="max-w-4xl mx-auto">
      <PollForm onSubmit={handleCreatePoll} />
    </div>
  );
}