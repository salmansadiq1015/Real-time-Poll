import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, BarChart3, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Poll } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PollCard } from '../components/PollCard';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPolls: 0,
    totalVotes: 0,
    averageVotes: 0,
  });

  useEffect(() => {
    if (user) {
      fetchUserPolls();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserPolls = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get vote counts for each poll
      const pollsWithVotes = await Promise.all(
        (data || []).map(async (poll) => {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('poll_id', poll.id);

          return {
            ...poll,
            creator_email: user.email,
            vote_count: count || 0,
          };
        })
      );

      setPolls(pollsWithVotes);
    } catch (error) {
      console.error('Error fetching user polls:', error);
      toast.error('Failed to load your polls');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Get user's polls
      const { data: userPolls } = await supabase
        .from('polls')
        .select('id')
        .eq('created_by', user.id);

      if (!userPolls || userPolls.length === 0) {
        setStats({ totalPolls: 0, totalVotes: 0, averageVotes: 0 });
        return;
      }

      // Get votes for user's polls
      const { count: totalVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .in('poll_id', userPolls.map(p => p.id));

      setStats({
        totalPolls: userPolls.length,
        totalVotes: totalVotes || 0,
        averageVotes: userPolls.length > 0 ? Math.round((totalVotes || 0) / userPolls.length) : 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId)
        .eq('created_by', user?.id);

      if (error) throw error;

      setPolls(prev => prev.filter(poll => poll.id !== pollId));
      toast.success('Poll deleted successfully');
      
      // Refresh stats
      fetchUserStats();
    } catch (error: any) {
      console.error('Error deleting poll:', error);
      toast.error(error.message || 'Failed to delete poll');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user.email}</h1>
            <div className="flex items-center text-blue-100 mt-1">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.totalPolls}</div>
            <div className="text-blue-100">Polls Created</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.totalVotes}</div>
            <div className="text-blue-100">Total Votes</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.averageVotes}</div>
            <div className="text-blue-100">Avg Votes per Poll</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Polls</h2>
        <Link
          to="/create"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Poll
        </Link>
      </div>

      {/* Polls Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
          <p className="text-gray-500 mb-6">Create your first poll to get started!</p>
          <Link
            to="/create"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="relative group">
              <PollCard poll={poll} />
              <button
                onClick={() => handleDeletePoll(poll.id)}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all transform hover:scale-110"
                title="Delete poll"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}