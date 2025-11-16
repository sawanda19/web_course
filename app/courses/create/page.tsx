'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function CreateCoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Development',
    level: 'beginner',
    price: 0,
    thumbnail: '',
    whatYouWillLearn: [''],
    lessons: [{ title: '', description: '', videoUrl: '', duration: 0, order: 1, isFree: false }],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'instructor') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleWhatYouWillLearnChange = (index: number, value: string) => {
    const updated = [...formData.whatYouWillLearn];
    updated[index] = value;
    setFormData(prev => ({ ...prev, whatYouWillLearn: updated }));
  };

  const addWhatYouWillLearn = () => {
    setFormData(prev => ({
      ...prev,
      whatYouWillLearn: [...prev.whatYouWillLearn, '']
    }));
  };

  const removeWhatYouWillLearn = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== index)
    }));
  };

  const handleLessonChange = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...formData.lessons];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, lessons: updated }));
  };

  const addLesson = () => {
    setFormData(prev => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        { 
          title: '', 
          description: '', 
          videoUrl: '', 
          duration: 0, 
          order: prev.lessons.length + 1, 
          isFree: false 
        }
      ]
    }));
  };

  const removeLesson = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        alert('Course created successfully!');
        router.push(`/courses/${data.course._id}`);
      } else {
        const error = await res.json();
        alert(`Failed to create course: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      alert('Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Course</h1>
          <p className="text-gray-600">Fill in the details to create your course</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Complete Web Development Bootcamp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what students will learn in this course"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Development">Development</option>
                    <option value="Business">Business</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="IT & Software">IT & Software</option>
                    <option value="Personal Development">Personal Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level *
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail URL *
                </label>
                <input
                  type="url"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* What You'll Learn */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What You&apos;ll Learn</h2>
            
            <div className="space-y-3">
              {formData.whatYouWillLearn.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleWhatYouWillLearnChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Build responsive websites"
                  />
                  {formData.whatYouWillLearn.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWhatYouWillLearn(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addWhatYouWillLearn}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add Learning Outcome
            </button>
          </div>

          {/* Lessons */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lessons</h2>
            
            <div className="space-y-6">
              {formData.lessons.map((lesson, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Lesson {index + 1}</h3>
                    {formData.lessons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLesson(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Lesson
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Lesson title"
                      required
                    />

                    <textarea
                      value={lesson.description}
                      onChange={(e) => handleLessonChange(index, 'description', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Lesson description (optional)"
                      rows={2}
                    />

                    <input
                      type="url"
                      value={lesson.videoUrl}
                      onChange={(e) => handleLessonChange(index, 'videoUrl', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="YouTube video URL"
                    />

                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={lesson.duration}
                        onChange={(e) => handleLessonChange(index, 'duration', parseInt(e.target.value) || 0)}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Duration (min)"
                        min="0"
                      />

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={lesson.isFree}
                          onChange={(e) => handleLessonChange(index, 'isFree', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Free preview</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLesson}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add Lesson
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Create Course
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}