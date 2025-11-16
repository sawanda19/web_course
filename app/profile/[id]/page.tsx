'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/dashboard');
      } else {
        fetchUserProfile();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, userId]);

  const fetchUserProfile = async () => {
    try {
      const [userRes, enrollmentsRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`),
        fetch(`/api/admin/users/${userId}/enrollments`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        setEnrollments(enrollmentsData.enrollments);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setUser((prev: any) => ({ ...prev, role: newRole }));
        alert('Role updated successfully');
      } else {
        alert('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error updating role');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('User deleted successfully');
        router.push('/admin');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
          <Button onClick={() => router.push('/admin')}>Back to Admin</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin
          </button>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl mx-auto mb-4">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{user.username}</h2>
                <p className="text-gray-600 text-sm mb-3">{user.email}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  user.role === 'admin' ? 'bg-red-100 text-red-700' :
                  user.role === 'instructor' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {user.role}
                </span>
              </div>

              <div className="space-y-3 text-sm border-t border-gray-200 pt-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono text-gray-900 text-xs">{user._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Joined:</span>
                  <span className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Enrollments:</span>
                  <span className="font-semibold text-gray-900">{enrollments.length}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Change Role</h3>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <Button
                  onClick={handleDeleteUser}
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                >
                  Delete User
                </Button>
              </div>
            </div>
          </div>

          {/* Enrollments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Enrolled Courses</h2>

              {enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-gray-500">No course enrollments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => {
                    const course = enrollment.course;
                    if (!course) return null;

                    return (
                      <div key={enrollment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">
                              by {course.instructor?.username || 'Unknown'}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span>
                                {enrollment.completedLessons} / {enrollment.totalLessons} lessons
                              </span>
                              <span className="font-semibold text-blue-600">
                                {enrollment.completionPercentage.toFixed(0)}%
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                              <div
                                className={`h-2 rounded-full ${
                                  enrollment.completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${enrollment.completionPercentage}%` }}
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                enrollment.completionPercentage === 0 ? 'bg-gray-100 text-gray-700' :
                                enrollment.completionPercentage === 100 ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {enrollment.completionPercentage === 0 ? 'Not Started' :
                                 enrollment.completionPercentage === 100 ? 'Completed' :
                                 'In Progress'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/courses/${course._id}`)}
                          >
                            View Course
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}