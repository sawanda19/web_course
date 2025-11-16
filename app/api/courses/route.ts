import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Course from '@/models/Course';

// GET /api/courses - Get all courses (with filters)
export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const published = searchParams.get('published');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    // Filter by published status (default: only published courses for public)
    if (published !== 'all') {
      query.published = true;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (level && level !== 'all') {
      query.level = level;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(query)
      .populate('instructor', 'username email avatar')
      .sort({ createdAt: -1 });

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create new course (instructor only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized. Only instructors can create courses.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { title, description, category, level, price, thumbnail, lessons } = body;

    // Validation
    if (!title || !description || !category || !price || !thumbnail) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Calculate total duration
    let totalDuration = 0;
    if (lessons && lessons.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalDuration = lessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0);
    }

    const course = await Course.create({
      title,
      description,
      instructor: session.user.id,
      category,
      level: level || 'beginner',
      price,
      thumbnail,
      lessons: lessons || [],
      totalDuration,
      published: false, // Default to unpublished
    });

    await course.populate('instructor', 'username email avatar');

    return NextResponse.json(
      { message: 'Course created successfully', course },
      { status: 201 }
    );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Create course error:', error);

    if (error.name === 'ValidationError') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}