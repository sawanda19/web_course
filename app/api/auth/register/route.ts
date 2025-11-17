import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    console.log('=== SIGNUP REQUEST ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    
    let body;
    try {
      body = await req.json();
      console.log('Request body received');
    } catch (e) {
      console.error('❌ Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { username, email, password } = body;
    
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Password length:', password?.length);

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
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    try {
      await dbConnect();
      console.log('✅ Database connected');
    } catch (dbError: any) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 500 }
      );
    }

    // Check if user already exists
    console.log('Checking if user exists...');
    let existingUser;
    try {
      existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
    } catch (findError: any) {
      console.error('❌ Error checking existing user:', findError);
      return NextResponse.json(
        { error: 'Database query error' },
        { status: 500 }
      );
    }

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
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
      console.log('✅ Password hashed');
    } catch (hashError: any) {
      console.error('❌ Password hashing failed:', hashError);
      return NextResponse.json(
        { error: 'Password processing error' },
        { status: 500 }
      );
    }

    // Create user
    console.log('Creating user...');
    let user;
    try {
      user = await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'student', // Default role
      });
      console.log('✅ User created:', user._id);
    } catch (createError: any) {
      console.error('❌ User creation failed:', createError);
      console.error('Error name:', createError.name);
      console.error('Error code:', createError.code);
      
      if (createError.code === 11000) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create user. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Signup successful');
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
    console.error('❌ Unexpected signup error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
