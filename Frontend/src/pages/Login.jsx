import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { loginUser } = useContext(AuthContext);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setServerError('');
    const result = await loginUser(data.email, data.password);
    if (result.success) {
      // Bounce straight to your fresh dashboard workspace on success!
      navigate('/dashboard');
    } else {
      setServerError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
        <h2 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h2>
        <p className="text-sm text-center text-slate-400 mb-6">Login to your WealthWatch account</p>

        {serverError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              {...register("email", { 
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
              })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              placeholder="name@example.com"
            />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              {...register("password", { required: "Password is required" })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md shadow-sky-600/20 transition-all duration-200"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;