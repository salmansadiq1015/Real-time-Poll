import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { VoteResult } from '../types';
import { Users, Trophy, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

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
  const [activeChartType, setActiveChartType] = useState<'bar' | 'pie'>(chartType);
  const [hoveredResult, setHoveredResult] = useState<number | null>(null);

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
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl">
          <p className="font-semibold text-gray-900">{payload[0].payload.fullName}</p>
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
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Poll Results</h3>
              <p className="text-blue-100">Real-time voting results</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-white">
            <div className="flex items-center bg-white/20 px-4 py-2 rounded-xl">
              <Users className="h-4 w-4 mr-2" />
              <span className="font-semibold">{totalVotes}</span>
              <span className="ml-1 text-blue-100">votes</span>
            </div>
            {totalVotes > 0 && (
              <div className="flex items-center bg-white/20 px-4 py-2 rounded-xl">
                <Trophy className="h-4 w-4 mr-2 text-yellow-300" />
                <span className="font-medium text-sm">Leader: {topResult.option_text.substring(0, 15)}{topResult.option_text.length > 15 ? '...' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {totalVotes === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-12 w-12 text-gray-300" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">No votes yet</h4>
            <p className="text-gray-500 text-lg">Be the first to vote and see the results!</p>
          </div>
        ) : (
          <>
            {/* Chart Type Toggle */}
            {showChart && (
              <div className="flex items-center justify-center mb-8">
                <div className="bg-gray-100 p-1 rounded-xl flex">
                  <button
                    onClick={() => setActiveChartType('bar')}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      activeChartType === 'bar'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Bar Chart
                  </button>
                  <button
                    onClick={() => setActiveChartType('pie')}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      activeChartType === 'pie'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <PieChartIcon className="h-4 w-4 mr-2" />
                    Pie Chart
                  </button>
                </div>
              </div>
            )}

            {/* Chart */}
            {showChart && (
              <div className="mb-8 bg-gray-50 rounded-2xl p-6">
                <ResponsiveContainer width="100%" height={350}>
                  {activeChartType === 'bar' ? (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                        radius={[8, 8, 0, 0]}
                        fill="url(#gradient)"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={120}
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
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Results</h4>
              {results
                .sort((a, b) => b.vote_count - a.vote_count)
                .map((result, index) => (
                  <div
                    key={result.option_index}
                    onMouseEnter={() => setHoveredResult(index)}
                    onMouseLeave={() => setHoveredResult(null)}
                    className={`relative bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border-2 transition-all duration-300 ${
                      hoveredResult === index
                        ? 'border-blue-300 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-800' :
                          'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}>
                          {index === 0 && <Trophy className="h-6 w-6" />}
                          {index !== 0 && (index + 1)}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900 text-lg">
                            {result.option_text}
                          </span>
                          {index === 0 && (
                            <div className="flex items-center mt-1">
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                🏆 Winner
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {result.vote_count}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.percentage}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Animated Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-800' :
                          'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                        style={{ 
                          width: `${result.percentage}%`,
                          animationDelay: `${index * 200}ms`
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}