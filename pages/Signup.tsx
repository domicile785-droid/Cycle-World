
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, UserPlus } from 'lucide-react';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Create Auth User
    // Fix: Using standard signUp method for Supabase v2
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    
    if (authError) {
      alert(authError.message);
    } else if (authData.user) {
      // 2. Create entry in our 'users' table
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: 'user'
      });
      
      if (dbError) {
        alert('Account created but failed to save profile info: ' + dbError.message);
      } else {
        alert('Signup successful! You can now log in.');
        navigate('/login');
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl">
        <h1 className="text-3xl font-black mb-2 text-center text-gray-900">Join CycleHub</h1>
        <p className="text-gray-500 text-center mb-10">Ready for your new journey?</p>
        
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                required 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating Account...' : <><UserPlus className="w-5 h-5" /> Sign Up</>}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 font-medium">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
