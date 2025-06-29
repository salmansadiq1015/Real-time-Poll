import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, TrendingUp, Clock, Users, Sparkles, Zap, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Poll } from '../types';
import { PollCard } from '../components/PollCard';
import { useAuth } from '../contexts/AuthContext';

export function HomePage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ended' | 'mine'>('all');
  const [stats, setStats] = useState({ totalPolls: 0, totalVotes: 0, activePolls: 0 });

  useEffect(() => {
    fetchPolls();
    fetchStats();
  }, [filterStatus, user]);

  useEffect(() => {
    // Real-time subscription for new polls
    const pollsChannel = supabase
      .channel('polls-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'polls' },
        (payload) => {
          console.log('New poll created:', payload);
          const newPoll = payload.new as Poll;
          // Add the new poll to the beginning of the list
          setPolls(prev => [{ ...newPoll, vote_count: 0, creator_email: 'Unknown' }, ...prev]);
          setStats(prev => ({ 
            ...prev, 
            totalPolls: prev.totalPolls + 1,
            activePolls: prev.activePolls + 1
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'polls' },
        (payload) => {
          console.log('Poll updated:', payload);
          const updatedPoll = payload.new as Poll;
          setPolls(prev => prev.map(poll => 
            poll.id === updatedPoll.id 
              ? { ...updatedPoll, vote_count: poll.vote_count, creator_email: poll.creator_email }
              : poll
          ));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'polls' },
        (payload) => {
          console.log('Poll deleted:', payload);
          const deletedPoll = payload.old as Poll;
          setPolls(prev => prev.filter(poll => poll.id !== deletedPoll.id));
          setStats(prev => ({ 
            ...prev, 
            totalPolls: Math.max(0, prev.totalPolls - 1),
            activePolls: Math.max(0, prev.activePolls - 1)
          }));
        }
      )
      .subscribe((status) => {
        console.log('Polls subscription status:', status);
      });

    // Real-time subscription for vote updates
    const votesChannel = supabase
      .channel('votes-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          console.log('New vote:', payload);
          const newVote = payload.new as any;
          // Update the vote count for the specific poll
          setPolls(prev => prev.map(poll => 
            poll.id === newVote.poll_id 
              ? { ...poll, vote_count: (poll.vote_count || 0) + 1 }
              : poll
          ));
          setStats(prev => ({ 
            ...prev, 
            totalVotes: prev.totalVotes + 1
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'votes' },
        (payload) => {
          console.log('Vote deleted:', payload);
          const deletedVote = payload.old as any;
          // Update the vote count for the specific poll
          setPolls(prev => prev.map(poll => 
            poll.id === deletedVote.poll_id 
              ? { ...poll, vote_count: Math.max(0, (poll.vote_count || 0) - 1) }
              : poll
          ));
          setStats(prev => ({ 
            ...prev, 
            totalVotes: Math.max(0, prev.totalVotes - 1)
          }));
        }
      )
      .subscribe((status) => {
        console.log('Votes subscription status:', status);
      });

    return () => {
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('id, ends_at');

      if (pollsError) {
        console.error('Error fetching polls for stats:', pollsError);
        return;
      }

      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('id');

      if (votesError) {
        console.error('Error fetching votes for stats:', votesError);
        // Don't return here, still show poll stats even if votes fail
      }

      const now = new Date();
      const activePolls = pollsData?.filter(poll => 
        !poll.ends_at || new Date(poll.ends_at) > now
      ).length || 0;

      setStats({
        totalPolls: pollsData?.length || 0,
        totalVotes: votesData?.length || 0,
        activePolls
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPolls = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('polls')
        .select(`
          *,
          profiles(email)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus === 'active') {
        query = query.or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`);
      } else if (filterStatus === 'ended') {
        query = query.lt('ends_at', new Date().toISOString());
      } else if (filterStatus === 'mine' && user) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching polls:', error);
        // Try fallback query without profiles join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('polls')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          throw fallbackError;
        }
        
        // Get vote counts for each poll
        const pollsWithVotes = await Promise.all(
          (fallbackData || []).map(async (poll) => {
            try {
              const { count } = await supabase
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('poll_id', poll.id);

              return {
                ...poll,
                creator_email: 'Unknown',
                vote_count: count || 0,
              };
            } catch (voteError) {
              console.error('Error fetching vote count for poll:', poll.id, voteError);
              return {
                ...poll,
                creator_email: 'Unknown',
                vote_count: 0,
              };
            }
          })
        );

        setPolls(pollsWithVotes);
        return;
      }

      // Get vote counts for each poll
      const pollsWithVotes = await Promise.all(
        (data || []).map(async (poll) => {
          try {
            const { count } = await supabase
              .from('votes')
              .select('*', { count: 'exact', head: true })
              .eq('poll_id', poll.id);

            return {
              ...poll,
              creator_email: poll.profiles?.email || 'Unknown',
              vote_count: count || 0,
            };
          } catch (voteError) {
            console.error('Error fetching vote count for poll:', poll.id, voteError);
            return {
              ...poll,
              creator_email: poll.profiles?.email || 'Unknown',
              vote_count: 0,
            };
          }
        })
      );

      setPolls(pollsWithVotes);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPolls = polls.filter(poll =>
    poll.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl text-white p-8 sm:p-12 lg:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-500"></div>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mr-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                Create Amazing Polls
              </h1>
            </div>
            
            <p className="text-xl sm:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Get real-time feedback from your audience with beautiful, interactive polls that engage and inspire
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              {user ? (
                <Link
                  to="/create"
                  className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 flex items-center shadow-xl hover:shadow-2xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Poll
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Get Started Free
                </Link>
              )}
              
              <Link
                to="#polls"
                className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <Target className="h-5 w-5 mr-2 inline" />
                Explore Polls
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            icon: TrendingUp,
            label: 'Total Polls',
            value: stats.totalPolls,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-100'
          },
          {
            icon: Users,
            label: 'Total Votes',
            value: stats.totalVotes,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-100'
          },
          {
            icon: Clock,
            label: 'Active Polls',
            value: stats.activePolls,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-100'
          }
        ].map((stat, index) => (
          <div 
            key={stat.label}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center">
              <div className={`p-4 ${stat.bgColor} rounded-2xl`}>
                <stat.icon className={`h-8 w-8 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div id="polls" className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search polls by question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-lg"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="pl-12 pr-8 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 appearance-none bg-white text-lg font-medium min-w-48"
          >
            <option value="all">All Polls</option>
            <option value="active">🟢 Active Polls</option>
            <option value="ended">🔴 Ended Polls</option>
            {user && <option value="mine">👤 My Polls</option>}
          </select>
        </div>
      </div>

      {/* Polls Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-100 rounded-lg"></div>
                <div className="h-8 bg-gray-100 rounded-lg"></div>
                <div className="h-8 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <TrendingUp className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            {searchTerm ? 'No polls found' : 'No polls yet'}
          </h3>
          <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
            {searchTerm 
              ? 'Try adjusting your search terms or browse all polls' 
              : user 
                ? 'Create the first poll to get started and engage your audience!' 
                : 'Sign up to create amazing polls and gather valuable feedback'
            }
          </p>
          {!searchTerm && (
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {user ? (
                <Link
                  to="/create"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Poll
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-2xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPolls.map((poll, index) => (
            <div
              key={poll.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PollCard poll={poll} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}