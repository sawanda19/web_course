'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const categories = [
  'Programming',
  'Design',
  'Business',
  'Marketing',
  'Photography',
  'Music',
  'Language',
  'Other',
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Programming',
    level: 'beginner',
    price: 0,
    thumbnail: '',
  });

  const [lessons, setLessons] = useState([
    { title: '', description: '', videoUrl: '', duration: 0, order: 1, isFree: false },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLessonChange = (index: number, field: string, value: any) => {
    const newLessons = [...lessons];
    newLessons[index] = { ...newLessons[index], [field]: value };
    setLessons(newLessons);
  };

  const addLesson = () => {
    setLessons([
      ...lessons,
      { title: '', description: '', videoUrl: '', duration: 0, order: lessons.length + 1, isFree: false },
    ]);
  };

  const removeLesson = (index: number) => {
    const newLessons = lessons.filter((_, i) => i !== index);
    // Update order numbers
    newLessons.forEach((lesson, i) => {
      lesson.order = i + 1;
    });
    setLessons(newLessons);
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title || !formData.description || !formData.thumbnail) {
      setError('Please fill in all required fields');
      return;
    }

    if (lessons.length === 0 || !lessons[0].title) {
      setError('Please add at least one lesson');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          lessons: lessons.filter((l) => l.title), // Only include lessons with titles
          published: publish,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create course');
        return;
      }

      router.push('/instructor');
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
            <p className="text-gray-600">Fill in the details to create your course</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form className="space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <Input
                  label="Course Title *"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Complete Web Development Bootcamp"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Describe what students will learn in this course..."
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Level *
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Price (USD) *"
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />

                  <Input
                    label="Thumbnail URL *"
                    type="url"
                    name="thumbnail"
                    value={formData.thumbnail}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Lessons</h2>
                <Button type="button" onClick={addLesson} variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Lesson
                </Button>
              </div>

              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Lesson {index + 1}</h3>
                      {lessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLesson(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Input
                        label="Lesson Title"
                        type="text"
                        value={lesson.title}
                        onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                        placeholder="e.g., Introduction to JavaScript"
                      />

                      <Input
                        label="Description (optional)"
                        type="text"
                        value={lesson.description}
                        onChange={(e) => handleLessonChange(index, 'description', e.target.value)}
                        placeholder="Brief description of the lesson"
                      />

                      <div className="grid md:grid-cols-2 gap-3">
                        <Input
                          label="Video URL (optional)"
                          type="url"
                          value={lesson.videoUrl}
                          onChange={(e) => handleLessonChange(index, 'videoUrl', e.target.value)}
                          placeholder="https://youtube.com/..."
                        />

                        <Input
                          label="Duration (minutes)"
                          type="number"
                          value={lesson.duration}
                          onChange={(e) => handleLessonChange(index, 'duration', Number(e.target.value))}
                          min="0"
                          placeholder="0"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`free-${index}`}
                          checked={lesson.isFree}
                          onChange={(e) => handleLessonChange(index, 'isFree', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor={`free-${index}`} className="ml-2 text-sm text-gray-700">
                          Make this lesson free preview
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => router.push('/instructor')}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                isLoading={isLoading}
                variant="secondary"
                className="flex-1"
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                isLoading={isLoading}
                variant="primary"
                className="flex-1"
              >
                Publish Course
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}