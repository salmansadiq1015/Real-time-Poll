import React from 'react'
import { Link } from 'react-router-dom'
import { Poll } from '../types'
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'

interface PollCardProps {
  poll: Poll
}

export function PollCard({ poll }: PollCardProps) {
  const isActive = !poll.ends_at || new Date(poll.ends_at) > new Date()
  const timeLeft = poll.ends_at ? Math.max(0, new Date(poll.ends_at).getTime() - new Date().getTime()) : null
  const daysLeft = timeLeft ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : null

  return (
    <Link to={`/poll/${poll.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-blue-200 group-hover:scale-105">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {poll.question}
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Created by {poll.creator_email || 'Anonymous'}
            </p>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isActive ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Ended
              </>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {poll.options.slice(0, 3).map((option, index) => (
            <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              {option}
            </div>
          ))}
          {poll.options.length > 3 && (
            <div className="text-sm text-gray-500 text-center py-1">
              +{poll.options.length - 3} more options
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{poll.vote_count || 0} votes</span>
          </div>
          {poll.ends_at && isActive && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}