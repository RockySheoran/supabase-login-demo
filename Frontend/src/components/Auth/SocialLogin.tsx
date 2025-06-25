import React from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { loginWithProvider } from '../../services/auth';

const SocialLogin: React.FC = () => {
  const handleProviderLogin = async (provider: 'google' | 'github') => {
    try {
      console.log("Logging in with provider:", provider);
      const { success, url } = await loginWithProvider(provider);
      console.log("success", success, "url", url);
      if (success && url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Error during provider login:', err);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => handleProviderLogin('google')}
        className="w-full flex items-center justify-center gap-2 bg-red-500 text-white p-2 rounded hover:bg-red-600"
      >
        <FaGoogle /> Login with Google
      </button>
      <button
        onClick={() => handleProviderLogin('github')}
        className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white p-2 rounded hover:bg-gray-900"
      >
        <FaGithub /> Login with GitHub
      </button>
    </div>
  );
};

export default SocialLogin;