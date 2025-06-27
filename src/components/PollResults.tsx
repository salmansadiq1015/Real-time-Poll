import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { VoteResult } from '../types';
import { Users, Trophy, TrendingUp } from 'lucide-react';

interface PollResultsProps {
  results: VoteResult[];
  totalVotes: number;
  showChart?: boolean;
  chartType?: 'bar' | 'pie';
}

const COLORS = [
  '#3B82F6', '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444',
  '#EC4899', '#10B981', '#F97316', '#6366F1', '#84CC16'
];

export function PollResults({ results, totalVotes, showChart = true, chartType = 'bar' }: PollResultsProps) {
  const chartData = results.map((result, index) => ({
    name: result.option_text.length > 20 
      ? result.option_text.substring(0, 20) + '...' 
      : result.option_text,
    fullName: result.option_text,
    votes: result.vote_count,
    percentage: result.percentage,
    color: COLORS[index % COLORS.length],
  }));

  const topResult = results.reduce((prev, current) => 
    (prev.vote_count > current.vote_count) ? prev : current
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].payload.fullName}</p>
          <p className="text-blue-600">
            <span className="font-medium">{payload[0].value} votes</span>
            <span className="text-gray-500 ml-2">({payload[0].payload.percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Poll Results</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{totalVotes} votes</span>
          </div>
          {totalVotes > 0 && (
            <div className="flex items-center">
              <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
              <span>Leader: {topResult.option_text}</span>
            </div>
          )}
        </div>
      </div>

      {totalVotes === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No votes yet</p>
          <p className="text-gray-400">Be the first to vote!</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          {showChart && (
            <div className="mb-8">
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="votes" 
                      radius={[4, 4, 0, 0]}
                      fill="#3B82F6"
                    />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="votes"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-4">
            {results
              .sort((a, b) => b.vote_count - a.vote_count)
              .map((result, index) => (
                <div
                  key={result.option_index}
                  className="relative bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                        index === 2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-800' :
                        'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900 flex-1">
                        {result.option_text}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {result.vote_count} votes
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.percentage}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                        index === 2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-800' :
                        'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}