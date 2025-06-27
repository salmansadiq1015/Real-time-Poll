import React, { useState } from 'react';
import { Check, Users, Lock, AlertCircle } from 'lucide-react';
import { Poll, VoteResult } from '../types';
import { PollResults } from './PollResults';

interface VotingInterfaceProps {
  poll: Poll;
  results: VoteResult[];
  totalVotes: number;
  hasVoted: boolean;
  userVote?: number[];
  onVote: (selectedOptions: number[]) => Promise<void>;
  loading: boolean;
  canVote: boolean;
}

export function VotingInterface({
  poll,
  results,
  totalVotes,
  hasVoted,
  userVote = [],
  onVote,
  loading,
  canVote
}: VotingInterfaceProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(userVote);
  const [showResults, setShowResults] = useState(hasVoted || poll.settings.show_results_before_voting);

  const handleOptionSelect = (optionIndex: number) => {
    if (!canVote && !hasVoted) return;

    if (poll.settings.allow_multiple_selections) {
      setSelectedOptions(prev => 
        prev.includes(optionIndex)
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
    } else {
      setSelectedOptions([optionIndex]);
    }
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) return;
    await onVote(selectedOptions);
    setShowResults(true);
  };

  const isActive = !poll.ends_at || new Date(poll.ends_at) > new Date();

  if (!isActive) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <div>
            <p className="text-red-800 font-medium">This poll has ended</p>
            <p className="text-red-600 text-sm">Voting is no longer available</p>
          </div>
        </div>
        <PollResults results={results} totalVotes={totalVotes} />
      </div>
    );
  }

  if (showResults && hasVoted) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-3" />
          <div>
            <p className="text-green-800 font-medium">Thank you for voting!</p>
            <p className="text-green-600 text-sm">
              Your vote for "{userVote.map(i => poll.options[i]).join(', ')}" has been recorded
            </p>
          </div>
        </div>
        <PollResults results={results} totalVotes={totalVotes} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Voting Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Cast Your Vote</h3>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{totalVotes} votes so far</span>
          </div>
        </div>

        {!canVote && !hasVoted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center">
            <Lock className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <p className="text-yellow-800 font-medium">Authentication Required</p>
              <p className="text-yellow-600 text-sm">Please sign in to vote on this poll</p>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {poll.options.map((option, index) => {
            const isSelected = selectedOptions.includes(index);
            const voteCount = results.find(r => r.option_index === index)?.vote_count || 0;
            
            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={!canVote && !hasVoted}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                } ${(!canVote && !hasVoted) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-gray-900 font-medium">{option}</span>
                  </div>
                  {poll.settings.show_results_before_voting && (
                    <span className="text-sm text-gray-500">{voteCount} votes</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {poll.settings.allow_multiple_selections && (
          <p className="text-sm text-gray-600 mb-4">
            You can select multiple options for this poll
          </p>
        )}

        {canVote && !hasVoted && (
          <button
            onClick={handleSubmitVote}
            disabled={selectedOptions.length === 0 || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting Vote...
              </div>
            ) : (
              `Submit Vote${selectedOptions.length > 1 ? 's' : ''}`
            )}
          </button>
        )}
      </div>

      {/* Show results if enabled */}
      {poll.settings.show_results_before_voting && (
        <PollResults results={results} totalVotes={totalVotes} />
      )}
    </div>
  );
}