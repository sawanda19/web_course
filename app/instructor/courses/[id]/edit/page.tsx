'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Lesson {
  _id?: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  isFree: boolean;
}

export default function EditCoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Programming',
    level: 'beginner',
    price: 0,
    thumbnail: '',
    published: false,
  });

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson>({
    title: '',
    description: '',
    videoUrl: '',
    duration: 0,
    order: 1,
    isFree: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated') {
      if (session.user.role !== 'instructor' && session.user.role !== 'admin') {
        router.push('/');
      } else if (courseId) {
        fetchCourse();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, courseId]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();

      if (res.ok) {
        const course = data.course;
        setFormData({
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price,
          thumbnail: course.thumbnail,
          published: course.published || false,
        });
        setLessons(course.lessons || []);
      } else {
        alert('Failed to fetch course');
        router.push('/instructor');
      }
    } catch (error) {
      console.error('Fetch course error:', error);
      alert('Something went wrong');
      router.push('/instructor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);

      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lessons,
          totalDuration,
        }),
      });

      if (res.ok) {
        alert('Course updated successfully!');
        router.push('/instructor');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update course');
      }
    } catch (error) {
      console.error('Update course error:', error);
      alert('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const addLesson = () => {
    if (!currentLesson.title || !currentLesson.videoUrl) {
      alert('Please fill in lesson title and video URL');
      return;
    }

    setLessons([...lessons, { ...currentLesson, order: lessons.length + 1 }]);
    setCurrentLesson({
      title: '',
      description: '',
      videoUrl: '',
      duration: 0,
      order: lessons.length + 2,
      isFree: false,
    });
  };

  const removeLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => router.push('/instructor')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleUpdateCourse} className="space-y-6">
            {/* Course Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Photography">Photography</option>
                    <option value="Music">Music</option>
                    <option value="Language">Language</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail URL *
                  </label>
                  <Input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                      <span className="font-medium">Published</span>
                      <span className="text-gray-500 ml-2">(Students can see and enroll)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Lessons</h3>
              
              {lessons.length > 0 && (
                <div className="mb-4 space-y-2">
                  {lessons.map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{lesson.title}</p>
                        <p className="text-sm text-gray-600">
                          {lesson.duration} min {lesson.isFree && '• Free Preview'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLesson(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      placeholder="Lesson Title"
                      value={currentLesson.title}
                      onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      placeholder="Lesson Description (optional)"
                      value={currentLesson.description}
                      onChange={(e) => setCurrentLesson({ ...currentLesson, description: e.target.value })}
                    />
                  </div>

                  <Input
                    type="url"
                    placeholder="Video URL (YouTube, Vimeo, etc.)"
                    value={currentLesson.videoUrl}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, videoUrl: e.target.value })}
                  />

                  <Input
                    type="number"
                    placeholder="Duration (minutes)"
                    min="0"
                    value={currentLesson.duration}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, duration: parseInt(e.target.value) || 0 })}
                  />

                  <div className="md:col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      id="isFree"
                      checked={currentLesson.isFree}
                      onChange={(e) => setCurrentLesson({ ...currentLesson, isFree: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isFree" className="ml-2 text-sm text-gray-700">
                      Free preview lesson
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <Button type="button" onClick={addLesson} variant="outline" size="sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Lesson
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/instructor')}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}