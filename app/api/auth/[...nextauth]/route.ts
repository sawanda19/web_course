import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter email and password');
        }

        await dbConnect();

        // Find user and explicitly select password field
        const user = await User.findOne({ email: credentials.email }).select('+password');

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check password
        const isPasswordValid = await user.comparePassword(credentials.password);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // 'user' can be an AdapterUser which doesn't have 'role', so narrow/cast before assigning
        const u = user as { id?: string | number; role?: string } | Record<string, unknown>;
        if (u.id !== undefined) {
          token.id = typeof u.id === 'string' ? u.id : String(u.id);
        }
        if (u.role !== undefined) {
          const roleStr = String(u.role);
          if (['student', 'instructor', 'admin'].includes(roleStr)) {
            token.role = roleStr as 'student' | 'instructor' | 'admin';
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as { id?: string; role?: string } & Record<string, unknown>;
        user.id = token.id as string;
        user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
