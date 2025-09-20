'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, sendOTP, verifyOTP } from '@/lib/auth';
import { signInWithOAuth, getOAuthProviders } from '@/lib/oauth';
import { useAuth } from '@/contexts/AuthContext';

export default function SignIn() {
  const router = useRouter();
  const { connectWeb3 } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [web3Loading, setWeb3Loading] = useState(false);
  const [error, setError] = useState('');

  const handleOAuthSignIn = async (provider: string) => {
    setOauthLoading(provider);
    setError('');
    
    try {
      const { error: oauthError } = await signInWithOAuth(provider as 'google' | 'github' | 'discord' | 'twitter');
      if (oauthError) throw new Error(oauthError);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to sign in with ${provider}`;
      setError(errorMessage);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleWeb3SignIn = async () => {
    setWeb3Loading(true);
    setError('');
    
    try {
      await connectWeb3();
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      setWeb3Loading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (step === 'credentials') {
        if (authMethod === 'phone' && !formData.password) {
          // Send OTP for phone authentication
          const { error: otpError } = await sendOTP(formData.phone);
          if (otpError) throw otpError;
          setStep('otp');
        } else {
          // Sign in with email/phone and password
          const { data, error: signInError } = await signIn({
            email: authMethod === 'email' ? formData.email : undefined,
            phone: authMethod === 'phone' ? formData.phone : undefined,
            password: formData.password
          });
          
          if (signInError) throw signInError;
          if (data?.user) {
            router.push('/dashboard');
          }
        }
      } else if (step === 'otp') {
        // Verify OTP
        const { data, error: verifyError } = await verifyOTP(formData.phone, formData.otp);
        if (verifyError) throw verifyError;
        if (data?.user) {
          router.push('/dashboard');
        }
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setStep('credentials');
    setFormData({ email: '', phone: '', password: '', otp: '' });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <span className="text-3xl font-bold text-blue-600">JalSuraksha</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'credentials' && (
            <>
              {/* Auth method selector */}
              <div className="flex rounded-md shadow-sm mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
                    authMethod === 'email'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border-l-0 border ${
                    authMethod === 'phone'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Phone
                </button>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {authMethod === 'email' ? (
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {authMethod === 'phone' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Leave empty to sign in with OTP
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-600">{error}</div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 
                     (authMethod === 'phone' && !formData.password) ? 'Send OTP' : 'Sign in'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'otp' && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest"
                  placeholder="000000"
                  value={formData.otp}
                  onChange={handleChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  OTP sent to {formData.phone}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-600">{error}</div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full text-sm text-blue-600 hover:text-blue-500"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          {/* OAuth Authentication */}
          {step === 'credentials' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {getOAuthProviders().slice(0, 2).map((provider) => (
                  <button
                    key={provider.name}
                    onClick={() => handleOAuthSignIn(provider.name)}
                    disabled={oauthLoading === provider.name}
                    className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white ${provider.color} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
                  >
                    {oauthLoading === provider.name ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <span className="mr-2">{provider.icon}</span>
                        {provider.displayName}
                      </>
                    )}
                  </button>
                ))}
              </div>

              {/* Web3 Authentication */}
              <div className="mt-4">
                <button
                  onClick={handleWeb3SignIn}
                  disabled={web3Loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {web3Loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="mr-2">🦊</span>
                      Connect MetaMask
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Demo accounts */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>Email: demo@jalsuraksha.com | Password: demo123</p>
              <p>Phone: +919876543210 | Password: demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}