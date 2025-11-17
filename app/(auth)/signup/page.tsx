import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    console.log('=== SIGNUP REQUEST ===');
    
    const { username, email, password } = await req.json();
    
    console.log('Username:', username);
    console.log('Email:', email);

    // Validate input
    if (!username || !email || !password) {
      console.log('❌ Missing fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Connect to database
    console.log('Connecting to database...');
    await dbConnect();
    console.log('✅ Database connected');

    // Check if user already exists
    console.log('Checking if user exists...');
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      console.log('❌ User already exists');
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Create user
    console.log('Creating user...');
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'student', // Default role
    });
    console.log('✅ User created:', user._id);

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // More specific error messages
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json(
        { error: 'Database connection error. Please try again.' },
        { status: 500 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
