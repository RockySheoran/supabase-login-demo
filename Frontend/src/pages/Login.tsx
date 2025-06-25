import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import SocialLogin from '../components/Auth/SocialLogin';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen text-black flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <LoginForm />
        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
        <SocialLogin />
      </div>
    </div>
  );
};

export default Login;