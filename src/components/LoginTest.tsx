import { useState } from 'react';
import api from '@/lib/api';

const LoginTest = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpass123');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...');
    
    try {
      console.log('🔍 Testing login with:', { email, password });
      console.log('🔍 API base URL:', api.defaults.baseURL);
      
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      console.log('✅ Login response:', response.data);
      
      setResult(`✅ Login successful! 
Token: ${response.data.access_token.substring(0, 20)}...
User: ${response.data.user.full_name} (${response.data.user.email})`);
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      if (error.response) {
        setResult(`❌ Login failed: ${error.response.data?.detail || error.response.statusText} (${error.response.status})`);
      } else if (error.request) {
        setResult(`❌ Network error: No response from server`);
      } else {
        setResult(`❌ Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setLoading(true);
    setResult('Testing direct fetch...');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Direct fetch successful! 
Token: ${data.access_token.substring(0, 20)}...
User: ${data.user.full_name} (${data.user.email})`);
      } else {
        setResult(`❌ Direct fetch failed: ${data.detail}`);
      }
    } catch (error: any) {
      setResult(`❌ Direct fetch error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Login Test Component</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="space-y-2">
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test with Axios (api.ts)'}
          </button>
          
          <button
            onClick={testDirectFetch}
            disabled={loading}
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test with Direct Fetch'}
          </button>
        </div>
        
        {result && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginTest;