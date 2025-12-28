import { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { useAuthStore } from '../state/auth_store';
import { authService } from '../app/auth_service';
import { BASE_URL } from '../app/api_client';
import Icon from './ui/Icon';
import { showToast } from '../utils/toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, refreshUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.display_name || '');
      setAvatarPreview('');
      setAvatarFile(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      showToast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP, BMP)');
      return;
    }

    // Validate file size (max 10MB - server will convert to WebP)
    if (file.size > 10 * 1024 * 1024) {
      showToast.error('Kích thước ảnh tối đa 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      showToast.error('Tên hiển thị không được để trống');
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = user.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const uploadResult = await authService.uploadAvatar(avatarFile);
        avatarUrl = uploadResult.avatar_url;
        showToast.success('Tải lên avatar thành công!');
      }

      // Update profile
      const result = await authService.updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
      });

      // Update local state
      refreshUser(result.user);
      showToast.success('Cập nhật hồ sơ thành công!');
      onClose();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể cập nhật hồ sơ');
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarDisplay = () => {
    // Priority 1: Preview (when user selects new image)
    if (avatarPreview) {
      // If it's a data URL (file reader result)
      if (avatarPreview.startsWith('data:')) {
        return avatarPreview;
      }
      // If it's already a full URL
      if (avatarPreview.startsWith('http')) {
        return avatarPreview;
      }
      // If it's a relative path
      return `${BASE_URL}${avatarPreview}`;
    }
    
    // Priority 2: Current user avatar from database
    if (user?.avatar_url) {
      // If it's a full URL
      if (user.avatar_url.startsWith('http')) {
        return user.avatar_url;
      }
      // If it's a relative path (like /uploads/avatars/xxx.webp)
      return `${BASE_URL}${user.avatar_url}`;
    }
    
    return null;
  };

  const avatarSrc = getAvatarDisplay();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--surface-1)] rounded-2xl shadow-2xl border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="user" size="lg" className="text-[var(--primary)]" />
            Chỉnh sửa hồ sơ
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[var(--primary)] to-blue-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-[var(--surface-2)]">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-4xl">${displayName.charAt(0).toUpperCase() || 'U'}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="text-white text-sm font-medium"
                >
                  <Icon name="camera" size="lg" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Icon name="upload" size="sm" className="inline mr-2" />
                Tải ảnh lên
              </button>
              
              {(avatarPreview || user.avatar_url) && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Icon name="trash" size="sm" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <p className="text-xs text-[var(--text-3)] text-center">
              JPG, PNG, GIF, WEBP, BMP tối đa 10MB
              <br />
              <span className="text-[var(--text-2)]">(Tự động chuyển sang WebP)</span>
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tên hiển thị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              placeholder="Nhập tên hiển thị của bạn"
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
              maxLength={100}
            />
            <p className="text-xs text-[var(--text-3)] mt-1">
              Tên này sẽ hiển thị trong ứng dụng
            </p>
          </div>

          {/* Account Info (Read-only) */}
          <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <h4 className="text-sm font-semibold mb-3">Thông tin tài khoản</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-2)]">Username:</span>
                <span className="font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-2)]">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-2)]">Vai trò:</span>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <>
                  <Icon name="spinner" size="sm" className="inline mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Icon name="check" size="sm" className="inline mr-2" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
