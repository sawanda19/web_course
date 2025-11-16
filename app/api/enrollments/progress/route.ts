import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';

export async function PUT(req: Request) {
  try {
    console.log('=== UPDATE PROGRESS API ===');
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);
    
    const { courseId, lessonId, completed } = body;

    if (!courseId || !lessonId) {
      console.log('❌ Missing courseId or lessonId');
      return NextResponse.json(
        { error: 'Course ID and Lesson ID are required' },
        { status: 400 }
      );
    }

    await dbConnect();
    console.log('✅ DB Connected');

    // Find user by email to get correct _id
    const user = await User.findOne({ email: session.user.email }).lean();
    
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    console.log('✅ User found:', userId);
    console.log('Course:', courseId);
    console.log('Lesson:', lessonId);
    console.log('Completed:', completed);

    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (!enrollment) {
      console.log('❌ Enrollment not found');
      console.log('Looking for student:', userId, 'course:', courseId);
      
      // Debug: show all enrollments for this user
      const allEnrollments = await Enrollment.find({ student: userId }).lean();
      console.log('User has', allEnrollments.length, 'enrollments');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allEnrollments.forEach((e: any) => {
        console.log('- Enrollment course:', e.course.toString());
      });
      
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    console.log('✅ Enrollment found:', enrollment._id);
    console.log('Current progress:', enrollment.progress);

    // Update or add lesson progress
    const lessonProgressIndex = enrollment.progress.findIndex(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.lessonId === lessonId || p.lessonId.toString() === lessonId
    );

    if (lessonProgressIndex >= 0) {
      console.log('Updating existing progress at index', lessonProgressIndex);
      enrollment.progress[lessonProgressIndex].completed = completed;
      if (completed) {
        enrollment.progress[lessonProgressIndex].completedAt = new Date();
      }
    } else {
      console.log('Adding new progress entry');
      enrollment.progress.push({
        lessonId,
        completed,
        completedAt: completed ? new Date() : undefined,
      });
    }

    // Calculate completion percentage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completedCount = enrollment.progress.filter((p: any) => p.completed).length;
    enrollment.completedLessons = completedCount;
    enrollment.completionPercentage = enrollment.totalLessons > 0
      ? (completedCount / enrollment.totalLessons) * 100
      : 0;

    console.log('Completed lessons:', completedCount, '/', enrollment.totalLessons);
    console.log('Completion %:', enrollment.completionPercentage);

    // Check if course is fully completed
    if (enrollment.completionPercentage === 100 && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      console.log('🎉 Course completed!');
    }

    await enrollment.save();
    console.log('✅ Progress saved');

    return NextResponse.json(
      { message: 'Progress updated successfully', enrollment },
      { status: 200 }
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('❌ Update progress error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}