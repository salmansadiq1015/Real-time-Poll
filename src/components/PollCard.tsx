import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Poll } from '../types'
import { Users, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

interface PollCardProps {
  poll: Poll
}

export function PollCard({ poll }: PollCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const isActive = !poll.ends_at || new Date(poll.ends_at) > new Date()
  const timeLeft = poll.ends_at ? Math.max(0, new Date(poll.ends_at).getTime() - new Date().getTime()) : null
  const daysLeft = timeLeft ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : null

  return (
    <Link 
      to={`/poll/${poll.id}`} 
      className="block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 ease-out transform ${
        isHovered 
          ? 'shadow-2xl border-blue-200 scale-105 -translate-y-2' 
          : 'hover:shadow-lg hover:border-blue-100 hover:scale-102'
      }`}>
        {/* Status Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 transition-all duration-200 ${
              isActive 
                ? 'bg-green-100 text-green-700 shadow-sm' 
                : 'bg-red-100 text-red-700 shadow-sm'
            }`}>
              {isActive ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Ended
                </>
              )}
            </div>
            
            <h3 className={`text-lg font-semibold text-gray-900 mb-2 line-clamp-2 transition-colors duration-200 ${
              isHovered ? 'text-blue-600' : 'group-hover:text-blue-600'
            }`}>
              {poll.question}
            </h3>
            
            <p className="text-sm text-gray-500 mb-4 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs text-white font-medium">
                  {(poll.creator_email || 'A')[0].toUpperCase()}
                </span>
              </div>
              Created by {poll.creator_email || 'Anonymous'}
            </p>
          </div>
        </div>

        {/* Options Preview */}
        <div className="space-y-2 mb-4">
          {poll.options.slice(0, 3).map((option, index) => (
            <div 
              key={index} 
              className={`text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg transition-all duration-200 ${
                isHovered ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <div className="flex items-center">
                <span className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium mr-2">
                  {index + 1}
                </span>
                {option}
              </div>
            </div>
          ))}
          {poll.options.length > 3 && (
            <div className="text-sm text-gray-500 text-center py-2 bg-gray-50 rounded-lg">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              +{poll.options.length - 3} more options
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span className="font-medium">{poll.vote_count || 0}</span>
              <span className="ml-1">votes</span>
            </div>
            {poll.ends_at && isActive && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}</span>
              </div>
            )}
          </div>
          
          <div className={`transition-transform duration-200 ${
            isHovered ? 'translate-x-1' : ''
          }`}>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">→</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}