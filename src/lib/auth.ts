import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { User } from '@/types';
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Extend the built-in User type with our custom properties
declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

// Mock user database (in a real app, this would be a real database)
const users: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', // password: admin123
    role: 'admin'
  },
  {
    id: '2',
    name: 'Researcher User',
    email: 'researcher@example.com',
    password: '$2a$10$8K1p/a0dhrxiowP.dnkgNORTWgdEDHn5L2/xjpEWuC.QQv4rKO9jO', // password: admin123
    role: 'researcher'
  }
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = users.find(u => u.email === credentials.email);
        
        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});