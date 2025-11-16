import Link from 'next/link';
import Image from 'next/image';

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    level: string;
    category: string;
    instructor: {
      username: string;
      avatar?: string;
    };
    rating: number;
    enrollmentCount: number;
    totalDuration?: number;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const levelColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Link href={`/courses/${course._id}`}>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[course.level as keyof typeof levelColors]}`}>
              {course.level}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Category */}
          <div className="text-xs text-blue-600 font-semibold mb-2 uppercase">
            {course.category}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
            {course.description}
          </p>

          {/* Instructor */}
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
              {course.instructor.avatar ? (
                <Image
                  src={course.instructor.avatar}
                  alt={course.instructor.username}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                course.instructor.username.charAt(0).toUpperCase()
              )}
            </div>
            <span className="ml-2 text-sm text-gray-700">{course.instructor.username}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{course.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{course.enrollmentCount}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDuration(course.totalDuration)}</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <span className="text-2xl font-bold text-gray-900">
              ${course.price === 0 ? 'Free' : course.price.toFixed(2)}
            </span>
            <span className="text-sm text-blue-600 font-semibold group-hover:underline">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}