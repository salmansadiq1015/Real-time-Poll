import React from 'react';
import { CheckCircle, X, Star, ThumbsUp, ThumbsDown, BarChart3, Zap } from 'lucide-react';

export interface PollTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  question: string;
  options: string[];
  settings: {
    allow_multiple_selections: boolean;
    show_results_before_voting: boolean;
    allow_vote_changes: boolean;
  };
  color: string;
}

export const pollTemplates: PollTemplate[] = [
  {
    id: 'yes-no',
    name: 'Yes/No',
    description: 'Simple binary choice poll',
    icon: CheckCircle,
    question: 'Do you agree with this proposal?',
    options: ['Yes', 'No'],
    settings: {
      allow_multiple_selections: false,
      show_results_before_voting: false,
      allow_vote_changes: true,
    },
    color: 'from-green-500 to-red-500'
  },
  {
    id: 'likert-5',
    name: 'Likert Scale',
    description: '5-point agreement scale',
    icon: BarChart3,
    question: 'How satisfied are you with our service?',
    options: [
      'Strongly Disagree',
      'Disagree', 
      'Neutral',
      'Agree',
      'Strongly Agree'
    ],
    settings: {
      allow_multiple_selections: false,
      show_results_before_voting: false,
      allow_vote_changes: true,
    },
    color: 'from-blue-500 to-purple-500'
  },
  {
    id: 'rating-5',
    name: '5-Star Rating',
    description: 'Star-based rating system',
    icon: Star,
    question: 'How would you rate this product?',
    options: ['⭐ 1 Star', '⭐⭐ 2 Stars', '⭐⭐⭐ 3 Stars', '⭐⭐⭐⭐ 4 Stars', '⭐⭐⭐⭐⭐ 5 Stars'],
    settings: {
      allow_multiple_selections: false,
      show_results_before_voting: false,
      allow_vote_changes: true,
    },
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'thumbs',
    name: 'Thumbs Up/Down',
    description: 'Like/dislike voting',
    icon: ThumbsUp,
    question: 'What do you think about this idea?',
    options: ['👍 Thumbs Up', '👎 Thumbs Down'],
    settings: {
      allow_multiple_selections: false,
      show_results_before_voting: true,
      allow_vote_changes: true,
    },
    color: 'from-green-500 to-red-500'
  },
  {
    id: 'multiple-choice',
    name: 'Multiple Choice',
    description: 'Select multiple options',
    icon: Zap,
    question: 'Which features would you like to see? (Select all that apply)',
    options: [
      'Dark Mode',
      'Mobile App',
      'API Access',
      'Advanced Analytics',
      'Team Collaboration'
    ],
    settings: {
      allow_multiple_selections: true,
      show_results_before_voting: false,
      allow_vote_changes: true,
    },
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'nps',
    name: 'NPS Score',
    description: 'Net Promoter Score (0-10)',
    icon: BarChart3,
    question: 'How likely are you to recommend us to a friend?',
    options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    settings: {
      allow_multiple_selections: false,
      show_results_before_voting: false,
      allow_vote_changes: true,
    },
    color: 'from-indigo-500 to-cyan-500'
  }
];

interface PollTemplatesProps {
  onSelectTemplate: (template: PollTemplate) => void;
  onClose: () => void;
}

export function PollTemplates({ onSelectTemplate, onClose }: PollTemplatesProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose a Template</h2>
              <p className="text-blue-100">Start with a pre-designed poll template</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pollTemplates.map((template, index) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="text-left p-6 bg-white dark:bg-gray-700 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Template Header */}
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${template.color} text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                    <template.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Sample Question */}
                <div className="mb-4">
                  <p className="font-medium text-gray-800 dark:text-gray-200 mb-3 line-clamp-2">
                    {template.question}
                  </p>
                  
                  {/* Sample Options */}
                  <div className="space-y-2">
                    {template.options.slice(0, 3).map((option, optionIndex) => (
                      <div 
                        key={optionIndex}
                        className="text-sm bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg flex items-center"
                      >
                        <span className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium mr-2">
                          {optionIndex + 1}
                        </span>
                        {option}
                      </div>
                    ))}
                    {template.options.length > 3 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                        +{template.options.length - 3} more options
                      </div>
                    )}
                  </div>
                </div>

                {/* Template Features */}
                <div className="flex flex-wrap gap-2">
                  {template.settings.allow_multiple_selections && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      Multiple Choice
                    </span>
                  )}
                  {template.settings.show_results_before_voting && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      Live Results
                    </span>
                  )}
                  {template.settings.allow_vote_changes && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                      Changeable
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Template Option */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Start from Scratch
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create a completely custom poll with your own questions and options
              </p>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-gray-600 to-gray-800 text-white px-6 py-3 rounded-xl font-medium hover:from-gray-700 hover:to-gray-900 transition-all duration-200 transform hover:scale-105"
              >
                Create Custom Poll
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}