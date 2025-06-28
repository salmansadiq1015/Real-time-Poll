import React, { useState } from 'react';
import { Check, Users, Lock, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
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
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

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
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 flex items-center animate-fadeIn">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="text-red-800 font-semibold text-lg">This poll has ended</p>
            <p className="text-red-600">Voting is no longer available, but you can view the results</p>
          </div>
        </div>
        <PollResults results={results} totalVotes={totalVotes} />
      </div>
    );
  }

  if (showResults && hasVoted) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 flex items-center animate-fadeIn">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <Check className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-green-800 font-semibold text-lg">Thank you for voting!</p>
            <p className="text-green-600">
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
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Cast Your Vote</h3>
                <p className="text-blue-100">Make your voice heard</p>
              </div>
            </div>
            <div className="flex items-center text-white bg-white/20 px-4 py-2 rounded-xl">
              <Users className="h-4 w-4 mr-2" />
              <span className="font-semibold">{totalVotes}</span>
              <span className="ml-1 text-blue-100">votes</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!canVote && !hasVoted && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6 flex items-center animate-fadeIn">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <Lock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-yellow-800 font-semibold">Authentication Required</p>
                <p className="text-yellow-600">Please sign in to vote on this poll</p>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {poll.options.map((option, index) => {
              const isSelected = selectedOptions.includes(index);
              const voteCount = results.find(r => r.option_index === index)?.vote_count || 0;
              const isHovered = hoveredOption === index;
              
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  onMouseEnter={() => setHoveredOption(index)}
                  onMouseLeave={() => setHoveredOption(null)}
                  disabled={!canVote && !hasVoted}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 transform ${
                    isSelected
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg scale-105'
                      : isHovered
                      ? 'border-blue-300 bg-blue-50 shadow-md scale-102'
                      : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-25'
                  } ${(!canVote && !hasVoted) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-102'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500 shadow-lg' 
                          : isHovered
                          ? 'border-blue-400 bg-blue-100'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                        {!isSelected && (
                          <span className={`text-sm font-medium ${
                            isHovered ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <span className={`font-medium transition-colors duration-200 ${
                        isSelected 
                          ? 'text-blue-700' 
                          : isHovered
                          ? 'text-blue-600'
                          : 'text-gray-900'
                      }`}>
                        {option}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {poll.settings.show_results_before_voting && (
                        <div className={`text-sm transition-colors duration-200 ${
                          isSelected ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          <TrendingUp className="h-4 w-4 inline mr-1" />
                          {voteCount} votes
                        </div>
                      )}
                      
                      {isSelected && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {poll.settings.allow_multiple_selections && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-700 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                You can select multiple options for this poll
              </p>
            </div>
          )}

          {canVote && !hasVoted && (
            <button
              onClick={handleSubmitVote}
              disabled={selectedOptions.length === 0 || loading}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-4 px-8 rounded-2xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Submitting Your Vote...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Check className="h-5 w-5 mr-2" />
                  Submit Vote{selectedOptions.length > 1 ? 's' : ''} ({selectedOptions.length})
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Show results if enabled */}
      {poll.settings.show_results_before_voting && (
        <PollResults results={results} totalVotes={totalVotes} />
      )}
    </div>
  );
}