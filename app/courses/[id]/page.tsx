/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function CourseDetailsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

   
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, session]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();

      if (res.ok) {
        setCourse(data.course);
        
        // Check if user is enrolled
        if (session?.user) {
          const enrollRes = await fetch(`/api/enrollments/check?courseId=${courseId}`);
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            setIsEnrolled(enrollData.isEnrolled);
          }
        }
      } else {
        console.error('Course not found');
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = () => {
    if (!session) {
      router.push('/signin');
      return;
    }

    if (course.price > 0) {
      router.push(`/checkout/${courseId}`);
    } else {
      // Free course - enroll directly
      enrollInCourse();
    }
  };

  const enrollInCourse = async () => {
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      if (res.ok) {
        alert('Successfully enrolled!');
        router.push('/dashboard');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Enroll error:', error);
      alert('Something went wrong');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
          <Button onClick={() => router.push('/courses')}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center text-white/80 hover:text-white mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Courses
          </button>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {course.category}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
                  {course.level}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-white/90 mb-6">{course.description}</p>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold">{course.rating.toFixed(1)}</span>
                  <span className="text-white/80 ml-1">({course.reviews} reviews)</span>
                </div>

                <div className="flex items-center text-white/90">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {course.enrollmentCount} students
                </div>

                <div className="flex items-center text-white/90">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.totalDuration || 0} minutes
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">
                  {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                </div>
                
                {isEnrolled ? (
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    Go to Course
                  </Button>
                ) : (
                  <Button 
                    onClick={handleEnroll}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    {course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                  </Button>
                )}
              </div>
            </div>

            <div className="relative h-80 rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* What You'll Learn */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What you&apos;ll learn</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {course.lessons?.slice(0, 6).map((lesson: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{lesson.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Content / Lessons */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Course Content
              </h2>
              <div className="space-y-2">
                {course.lessons?.map((lesson: any, index: number) => (
                  <div 
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                          {lesson.description && (
                            <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        {lesson.isFree && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium text-xs">
                            Free
                          </span>
                        )}
                        <span>{lesson.duration} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                </div>
                
                {isEnrolled ? (
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    size="lg"
                    className="w-full"
                  >
                    Continue Learning
                  </Button>
                ) : (
                  <Button 
                    onClick={handleEnroll}
                    size="lg"
                    className="w-full"
                  >
                    {course.price === 0 ? 'Enroll for Free' : 'Buy Now'}
                  </Button>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Instructor</span>
                  <span className="font-semibold text-gray-900">
                    {course.instructor?.username || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">{course.totalDuration || 0} min</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Lessons</span>
                  <span className="font-semibold text-gray-900">{course.lessons?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Level</span>
                  <span className="font-semibold text-gray-900 capitalize">{course.level}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Enrolled</span>
                  <span className="font-semibold text-gray-900">{course.enrollmentCount} students</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}