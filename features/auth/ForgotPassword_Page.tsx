import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiForgotPassword } from '../../app/api_client';

export default function ForgotPassword_Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await apiForgotPassword(email);
      setMessage({ 
        type: 'success', 
        text: 'Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.' 
      });
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.message || 'Có lỗi xảy ra. Vui lòng thử lại.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <span className="text-3xl font-bold text-white">N3T</span>
            </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quên mật khẩu</h1>
          <p className="text-zinc-400">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        <div className="bg-zinc-800/50 backdrop-blur-xl rounded-2xl border border-zinc-700/50 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {message.text && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                message.type === 'error' 
                  ? 'bg-danger/10 border border-danger/20 text-danger' 
                  : 'bg-success/10 border border-success/20 text-success'
              }`}>
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-zinc-400 hover:text-white text-sm transition-colors"
            >
              ← Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}