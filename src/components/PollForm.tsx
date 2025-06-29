import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Calendar, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { CreatePollData, PollSettings } from '../types';

interface PollFormProps {
  onSubmit: (data: CreatePollData) => Promise<void>;
  loading?: boolean;
  initialData?: {
    question: string;
    options: string[];
    settings: PollSettings;
  };
}

interface FormData {
  question: string;
  options: { value: string }[];
  settings: PollSettings;
  ends_at?: string;
}

export function PollForm({ onSubmit, loading = false, initialData }: PollFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      question: initialData?.question || '',
      options: initialData?.options.map(opt => ({ value: opt })) || [{ value: '' }, { value: '' }],
      settings: initialData?.settings || {
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

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        question: initialData.question,
        options: initialData.options.map(opt => ({ value: opt })),
        settings: initialData.settings,
        ends_at: '',
      });
    }
  }, [initialData, reset]);

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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {initialData ? 'Customize Your Poll' : 'Create New Poll'}
              </h2>
              <p className="text-blue-100 text-sm sm:text-base">
                {initialData ? 'Template loaded - customize as needed' : 'Create an engaging poll and get real-time responses'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 sm:p-8 space-y-8">
          {/* Poll Question */}
          <div className="space-y-3">
            <label htmlFor="question" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Poll Question *
            </label>
            <div className="relative">
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
                onFocus={() => setFocusedField('question')}
                onBlur={() => setFocusedField(null)}
                className={`w-full px-4 py-4 border-2 rounded-2xl transition-all duration-300 resize-none text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  focusedField === 'question'
                    ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30 shadow-lg'
                    : errors.question
                    ? 'border-red-300 ring-4 ring-red-100 dark:ring-red-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } focus:outline-none`}
                placeholder="What would you like to ask your audience?"
              />
              <div className={`absolute bottom-3 right-3 text-xs transition-colors duration-200 ${
                focusedField === 'question' ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {watch('question')?.length || 0}/300
              </div>
            </div>
            {errors.question && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center animate-fadeIn">
                <span className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-2">!</span>
                {errors.question.message}
              </p>
            )}
          </div>

          {/* Poll Options */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Answer Options *
            </label>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div 
                  key={field.id} 
                  className="flex items-center space-x-3 group animate-slideIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                    {index + 1}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      {...register(`options.${index}.value`, {
                        required: 'Option cannot be empty',
                        maxLength: {
                          value: 100,
                          message: 'Option must be less than 100 characters',
                        },
                      })}
                      onFocus={() => setFocusedField(`option-${index}`)}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        focusedField === `option-${index}`
                          ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30 shadow-lg'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      } focus:outline-none`}
                      placeholder={`Option ${index + 1}`}
                    />
                    <div className={`absolute bottom-2 right-3 text-xs transition-colors duration-200 ${
                      focusedField === `option-${index}` ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {watchedOptions[index]?.value?.length || 0}/100
                    </div>
                  </div>
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 transform hover:scale-110"
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
                className="w-full flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Another Option
              </button>
            )}
            
            {errors.options && (
              <p className="text-sm text-red-600 dark:text-red-400 animate-fadeIn">All options are required</p>
            )}
          </div>

          {/* Advanced Settings Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <SettingsIcon className={`h-5 w-5 mr-2 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </button>
          </div>

          {/* Advanced Settings */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
            showAdvanced 
              ? 'max-h-96 opacity-100' 
              : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 space-y-6 border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <SettingsIcon className="h-4 w-4 text-white" />
                </div>
                Poll Settings
              </h3>
              
              {/* Settings Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'settings.allow_multiple_selections',
                    label: 'Multiple Selections',
                    description: 'Allow voters to select multiple options'
                  },
                  {
                    name: 'settings.show_results_before_voting',
                    label: 'Show Results Early',
                    description: 'Display results before voting'
                  },
                  {
                    name: 'settings.allow_vote_changes',
                    label: 'Allow Changes',
                    description: 'Let users change their vote'
                  }
                ].map((setting) => (
                  <label key={setting.name} className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-200 cursor-pointer group">
                    <input
                      {...register(setting.name as any)}
                      type="checkbox"
                      className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500 rounded transition-colors duration-200"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {setting.label}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {setting.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="ends_at" className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  Poll End Date (Optional)
                </label>
                <input
                  {...register('ends_at')}
                  type="datetime-local"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-300 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Leave empty for polls that never expire
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-4 px-8 rounded-2xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Creating Your Amazing Poll...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Create Poll
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}