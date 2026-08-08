import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';
import { useTheme } from '../lib/theme-context';
import { useLanguage, LANGUAGES } from '../lib/language-context';
import { usersApi } from '../lib/api';
import { Avatar } from '../components/Avatar';

export function SettingsPage() {
  const { user, token, refreshMe } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setBio(user.bio ?? '');
    }
  }, [user]);

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white dark:placeholder:text-gray-500';
  const cardClass =
    'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard';
  const buttonClass =
    'rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100';

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await usersApi.updateProfile(token, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        bio,
      });
      await refreshMe();
      setProfileMessage(t('settings.saved'));
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingPhoto(true);
    setProfileMessage(null);
    try {
      await usersApi.uploadPhoto(token, file);
      await refreshMe();
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      await usersApi.changePassword(token, currentPassword, newPassword);
      setPasswordMessage(t('settings.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-xl">
      <p className="text-sm text-gray-400 dark:text-gray-500">{t('nav.settings')}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {t('nav.settings')}
      </h1>

      <div className={`mt-8 ${cardClass}`}>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.profile')}</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{user?.email}</p>

        <div className="mt-4 flex items-center gap-4">
          <Avatar firstName={user?.firstName} lastName={user?.lastName} imageUrl={user?.profileImageUrl} size={64} />
          <div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhotoSelected} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {uploadingPhoto ? '…' : t('settings.changePhoto')}
            </button>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t('settings.photoHint')}</p>
          </div>
        </div>

        <form onSubmit={onSaveProfile} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder={t('common.firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
            <input
              placeholder={t('common.lastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
          <textarea
            placeholder={t('settings.bioPlaceholder')}
            value={bio}
            maxLength={500}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className={inputClass}
          />
          <p className="text-right text-xs text-gray-400">{bio.length}/500</p>
          <button type="submit" disabled={savingProfile} className={buttonClass}>
            {savingProfile ? '…' : t('common.save')}
          </button>
          {profileMessage && <p className="text-sm text-gray-500 dark:text-gray-400">{profileMessage}</p>}
        </form>
      </div>

      <div className={`mt-6 ${cardClass}`}>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.changePassword')}</p>
        <form onSubmit={onChangePassword} className="mt-4 space-y-3">
          <input
            type="password"
            required
            placeholder={t('settings.currentPassword')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder={t('resetPassword.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
          <button type="submit" disabled={savingPassword} className={buttonClass}>
            {savingPassword ? '…' : t('common.save')}
          </button>
          {passwordMessage && <p className="text-sm text-gray-500 dark:text-gray-400">{passwordMessage}</p>}
        </form>
      </div>

      <div className={`mt-6 ${cardClass}`}>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.theme')}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {t('settings.light')}
          </button>
          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {t('settings.dark')}
          </button>
        </div>
      </div>

      <div className={`mt-6 ${cardClass}`}>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('settings.language')}</p>
        <div className="mt-3 flex gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                language === lang.code
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400'
                  : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
