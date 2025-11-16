/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function CourseLearnPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [course, setCourse] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [enrollment, setEnrollment] = useState<any>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && courseId) {
      fetchCourseAndEnrollment();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, courseId]);

  const fetchCourseAndEnrollment = async () => {
    try {
      // Fetch course
      const courseRes = await fetch(`/api/courses/${courseId}`);
      
      if (!courseRes.ok) {
        router.push('/dashboard');
        return;
      }
      
      const courseData = await courseRes.json();
      setCourse(courseData.course);

      // Fetch enrollment
      const enrollRes = await fetch(`/api/enrollments?courseId=${courseId}`);
      
      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        setEnrollment(enrollData.enrollment);
      } else {
        router.push(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      console.log('Marking lesson complete:', lessonId);
      
      const res = await fetch('/api/enrollments/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          lessonId,
          completed: true,
        }),
      });

      console.log('Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Progress updated:', data);
        // Refresh enrollment data
        await fetchCourseAndEnrollment();
      } else {
        const error = await res.text();
        console.error('Failed to update progress:', error);
        alert('Failed to mark lesson as complete');
      }
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
      alert('Error updating progress');
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    if (!enrollment?.progress) return false;
    const lessonProgress = enrollment.progress.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.lessonId === lessonId
    );
    return lessonProgress?.completed || false;
  };

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Already embed format
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    const standardMatch = url.match(/[?&]v=([^&]+)/);
    if (standardMatch) {
      return `https://www.youtube.com/embed/${standardMatch[1]}`;
    }
    
    // Short YouTube URL: https://youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    
    // Return original if not YouTube
    return url;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found or not enrolled</h2>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Check if course has lessons
  if (!course.lessons || course.lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No lessons available</h2>
          <p className="text-gray-600 mb-4">This course doesn&apos;t have any lessons yet.</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const currentLesson = course.lessons[currentLessonIndex];
  const progress = enrollment.completionPercentage || 0;
  const embedUrl = currentLesson ? getEmbedUrl(currentLesson.videoUrl) : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">
                  Lesson {currentLessonIndex + 1} of {course.lessons.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Progress: <span className="font-semibold text-blue-600">{progress.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {embedUrl ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentLesson.title}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg">No video available</p>
                    <p className="text-sm text-gray-400 mt-2">Video URL: {currentLesson.videoUrl || 'None'}</p>
                  </div>
                </div>
              )}

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {currentLesson.title}
                </h2>
                {currentLesson.description && (
                  <p className="text-gray-700 mb-4">{currentLesson.description}</p>
                )}

                <div className="flex items-center gap-4">
                  {!isLessonCompleted(currentLesson._id) ? (
                    <Button
                      onClick={() => markLessonComplete(currentLesson._id)}
                      variant="primary"
                    >
                      Mark as Complete
                    </Button>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Completed
                    </div>
                  )}

                  {currentLessonIndex < course.lessons.length - 1 && (
                    <Button
                      onClick={() => setCurrentLessonIndex(currentLessonIndex + 1)}
                      variant="outline"
                    >
                      Next Lesson →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lessons Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Course Content</h3>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {course.lessons.map((lesson: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentLessonIndex(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentLessonIndex === index
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex-shrink-0 ${
                        isLessonCompleted(lesson._id)
                          ? 'text-green-600'
                          : currentLessonIndex === index
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}>
                        {isLessonCompleted(lesson._id) ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-current" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-500">
                            Lesson {index + 1}
                          </span>
                          {lesson.duration > 0 && (
                            <span className="text-xs text-gray-500">
                              {lesson.duration} min
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-medium ${
                          currentLessonIndex === index
                            ? 'text-blue-900'
                            : 'text-gray-900'
                        }`}>
                          {lesson.title}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Course Completion */}
              {progress === 100 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <svg className="w-12 h-12 text-green-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-bold text-green-900 mb-1">Congratulations!</h3>
                  <p className="text-sm text-green-700">You completed this course!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}