import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { CreatePollData, PollSettings } from '../types';

interface PollFormProps {
  onSubmit: (data: CreatePollData) => Promise<void>;
  loading?: boolean;
}

interface FormData {
  question: string;
  options: { value: string }[];
  settings: PollSettings;
  ends_at?: string;
}

export function PollForm({ onSubmit, loading = false }: PollFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      question: '',
      options: [{ value: '' }, { value: '' }],
      settings: {
        allow_multiple_selections: false,
        show_results_before_voting: false,
        allow_vote_changes: false,
      },
      ends_at: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const watchedOptions = watch('options');

  const handleFormSubmit = async (data: FormData) => {
    const pollData: CreatePollData = {
      question: data.question.trim(),
      options: data.options.map(opt => opt.value.trim()).filter(opt => opt.length > 0),
      settings: data.settings,
      ends_at: data.ends_at || undefined,
    };

    await onSubmit(pollData);
  };

  const addOption = () => {
    if (fields.length < 10) {
      append({ value: '' });
    }
  };

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Poll</h2>
        <p className="text-gray-600">
          Create an engaging poll and get real-time responses from your audience
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Poll Question */}
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            Poll Question *
          </label>
          <textarea
            {...register('question', {
              required: 'Poll question is required',
              minLength: {
                value: 10,
                message: 'Question must be at least 10 characters long',
              },
              maxLength: {
                value: 300,
                message: 'Question must be less than 300 characters',
              },
            })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            placeholder="What would you like to ask your audience?"
          />
          {errors.question && (
            <p className="mt-1 text-sm text-red-600">{errors.question.message}</p>
          )}
        </div>

        {/* Poll Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Answer Options *
          </label>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <input
                  {...register(`options.${index}.value`, {
                    required: 'Option cannot be empty',
                    maxLength: {
                      value: 100,
                      message: 'Option must be less than 100 characters',
                    },
                  })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={`Option ${index + 1}`}
                />
                {fields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {fields.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3 w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Another Option
            </button>
          )}
          
          {errors.options && (
            <p className="mt-1 text-sm text-red-600">All options are required</p>
          )}
        </div>

        {/* Advanced Settings Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <SettingsIcon className="h-5 w-5 mr-2" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Poll Settings</h3>
            
            {/* Poll Settings Checkboxes */}
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  {...register('settings.allow_multiple_selections')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Allow multiple selections per vote
                </span>
              </label>

              <label className="flex items-center">
                <input
                  {...register('settings.show_results_before_voting')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Show results before voting
                </span>
              </label>

              <label className="flex items-center">
                <input
                  {...register('settings.allow_vote_changes')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Allow users to change their vote
                </span>
              </label>
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="ends_at" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                Poll End Date (Optional)
              </label>
              <input
                {...register('ends_at')}
                type="datetime-local"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty for polls that never expire
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Poll...
            </div>
          ) : (
            'Create Poll'
          )}
        </button>
      </form>
    </div>
  );
}