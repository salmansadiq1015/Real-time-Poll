import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Copy, Calendar, User, Settings, ArrowLeft, QrCode, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Poll, VoteResult } from '../types';
import { VotingInterface } from '../components/VotingInterface';
import { QRCodeModal } from '../components/QRCodeModal';
import { ExportModal } from '../components/ExportModal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function PollPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [activeViewers, setActiveViewers] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetchPoll();
    checkUserVote();
    fetchResults();

    // Set up real-time subscriptions for votes
    const votesChannel = supabase
      .channel(`poll-votes-${id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'votes', 
          filter: `poll_id=eq.${id}` 
        },
        (payload) => {
          console.log('New vote received:', payload);
          // Immediately fetch updated results
          fetchResults();
          // Update total votes count
          setTotalVotes(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'votes', 
          filter: `poll_id=eq.${id}` 
        },
        (payload) => {
          console.log('Vote updated:', payload);
          // Fetch updated results when vote is changed
          fetchResults();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'votes', 
          filter: `poll_id=eq.${id}` 
        },
        (payload) => {
          console.log('Vote deleted:', payload);
          // Fetch updated results when vote is deleted
          fetchResults();
          setTotalVotes(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe((status) => {
        console.log('Votes subscription status:', status);
      });

    // Set up presence for active viewers
    const presenceChannel = supabase
      .channel(`poll-presence-${id}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        setActiveViewers(Object.keys(newState).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setActiveViewers(prev => prev + newPresences.length);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setActiveViewers(prev => Math.max(0, prev - leftPresences.length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user?.id || 'anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [id, user]);

  const fetchPoll = async () => {
    if (!id) return;

    try {
      // Try to fetch with profiles join first
      let { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          profiles(email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Poll not found');
          navigate('/');
          return;
        }
        
        // If profiles join fails, try without it
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('polls')
          .select('*')
          .eq('id', id)
          .single();

        if (fallbackError) {
          if (fallbackError.code === 'PGRST116') {
            toast.error('Poll not found');
            navigate('/');
            return;
          }
          throw fallbackError;
        }

        data = fallbackData;
      }

      setPoll({
        ...data,
        creator_email: data.profiles?.email || 'Unknown',
      });
    } catch (error) {
      console.error('Error fetching poll:', error);
      toast.error('Failed to load poll');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkUserVote = async () => {
    if (!id) return;

    try {
      let hasUserVoted = false;
      let userSelectedOptions: number[] = [];

      if (user) {
        // Check for authenticated user vote
        const { data } = await supabase
          .from('votes')
          .select('selected_options')
          .eq('poll_id', id)
          .eq('user_id', user.id)
          .single();

        if (data) {
          hasUserVoted = true;
          userSelectedOptions = data.selected_options || [];
        }
      } else {
        // Check localStorage for anonymous vote
        const voteKey = `poll_${id}_voted`;
        const savedVote = localStorage.getItem(voteKey);
        if (savedVote) {
          hasUserVoted = true;
          userSelectedOptions = JSON.parse(savedVote);
        }
      }

      setHasVoted(hasUserVoted);
      setUserVote(userSelectedOptions);
    } catch (error) {
      console.error('Error checking user vote:', error);
    }
  };

  const fetchResults = async () => {
    if (!id) return;

    try {
      // First try the RPC function
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_poll_results', { poll_uuid: id });

      if (!rpcError && rpcData) {
        setResults(rpcData);
        const total = rpcData.reduce((sum: number, result: VoteResult) => sum + result.vote_count, 0);
        setTotalVotes(total);
        return;
      }

      // Fallback: calculate results manually
      await calculateResultsManually();
    } catch (error) {
      console.error('Error fetching results:', error);
      await calculateResultsManually();
    }
  };

  const calculateResultsManually = async () => {
    if (!id || !poll) return;

    try {
      const { data: votes, error } = await supabase
        .from('votes')
        .select('selected_options')
        .eq('poll_id', id);

      if (error) throw error;

      const optionCounts: { [key: number]: number } = {};
      let totalVoteCount = 0;

      // Initialize counts
      poll.options.forEach((_, index) => {
        optionCounts[index] = 0;
      });

      // Count votes
      votes?.forEach(vote => {
        if (vote.selected_options && Array.isArray(vote.selected_options)) {
          vote.selected_options.forEach((optionIndex: number) => {
            if (optionCounts[optionIndex] !== undefined) {
              optionCounts[optionIndex]++;
            }
          });
          totalVoteCount++;
        }
      });

      // Build results
      const manualResults: VoteResult[] = poll.options.map((option, index) => ({
        option_index: index,
        option_text: option,
        vote_count: optionCounts[index] || 0,
        percentage: totalVoteCount > 0 ? Math.round(((optionCounts[index] || 0) / totalVoteCount) * 100 * 10) / 10 : 0
      }));

      setResults(manualResults);
      setTotalVotes(totalVoteCount);
    } catch (error) {
      console.error('Error calculating results manually:', error);
    }
  };

  const handleVote = async (selectedOptions: number[]) => {
    if (!poll || !id) return;

    setVoting(true);
    try {
      const voteData: any = {
        poll_id: id,
        selected_options: selectedOptions,
      };

      if (user) {
        voteData.user_id = user.id;
      } else {
        // Generate IP hash for anonymous users (simplified)
        const ipHash = await generateIPHash();
        voteData.ip_hash = ipHash;
      }

      const { error } = await supabase
        .from('votes')
        .insert([voteData]);

      if (error) throw error;

      // Save to localStorage for anonymous users
      if (!user) {
        const voteKey = `poll_${id}_voted`;
        localStorage.setItem(voteKey, JSON.stringify(selectedOptions));
      }

      setHasVoted(true);
      setUserVote(selectedOptions);
      toast.success('Vote submitted successfully!');
      
      // Don't manually refresh results here - let real-time subscription handle it
      // The real-time subscription will automatically update the results
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      toast.error(error.message || 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const generateIPHash = async (): Promise<string> => {
    // Simple hash generation for demo purposes
    const data = new TextEncoder().encode(navigator.userAgent + Date.now());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: poll?.question,
          url,
        });
      } catch (error) {
        // Fallback to clipboard
        await copyToClipboard(url);
      }
    } else {
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Poll link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  const isActive = !poll.ends_at || new Date(poll.ends_at) > new Date();
  const canVote = user !== null || !hasVoted;
  const pollUrl = window.location.href;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Polls
      </button>

      {/* Poll Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-colors duration-300">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{poll.question}</h1>
            
            <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>Created by {poll.creator_email || 'Anonymous'}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{new Date(poll.created_at).toLocaleDateString()}</span>
              </div>
              
              {poll.ends_at && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Ends {new Date(poll.ends_at).toLocaleDateString()}</span>
                </div>
              )}

              {activeViewers > 0 && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span>{activeViewers} viewing now</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowQRCode(true)}
              className="flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all duration-200 transform hover:scale-105"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </button>

            <button
              onClick={() => setShowExport(true)}
              className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-200 transform hover:scale-105"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
            
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isActive 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {isActive ? 'Active' : 'Ended'}
            </div>
          </div>
        </div>

        {/* Poll Settings Display */}
        {(poll.settings.allow_multiple_selections || poll.settings.show_results_before_voting || poll.settings.allow_vote_changes) && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Settings className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Poll Settings</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {poll.settings.allow_multiple_selections && (
                <p>• Multiple selections allowed</p>
              )}
              {poll.settings.show_results_before_voting && (
                <p>• Results visible before voting</p>
              )}
              {poll.settings.allow_vote_changes && (
                <p>• Vote changes allowed</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Voting Interface */}
      <div data-export="poll-results">
        <VotingInterface
          poll={poll}
          results={results}
          totalVotes={totalVotes}
          hasVoted={hasVoted}
          userVote={userVote}
          onVote={handleVote}
          loading={voting}
          canVote={canVote}
        />
      </div>

      {/* Modals */}
      <QRCodeModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        pollUrl={pollUrl}
        pollTitle={poll.question}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        poll={poll}
        results={results}
        totalVotes={totalVotes}
      />
    </div>
  );
}