using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Firebase.Auth;
using System.Threading.Tasks;
using NT106_Nhom12_Pro.Utils;
using Firebase.Auth.Providers;

namespace NT106_Nhom12_Pro.Helpers
{
    public static class FirebaseAuthHelper
    {
        private static readonly FirebaseAuthClient authClient;

        static FirebaseAuthHelper()
        {
            var config = new FirebaseAuthConfig
            {
                ApiKey = FirebaseConfig.apiKey,
                AuthDomain = FirebaseConfig.authDomain,
                Providers = new FirebaseAuthProvider[]
                {
                new EmailProvider()
                }
            };

            authClient = new FirebaseAuthClient(config);
        }

        // Hàm đăng nhập
        public static async Task<UserCredential> LoginAsync(string email, string password)
        {
            try
            {
                var userCredential = await authClient.SignInWithEmailAndPasswordAsync(email, password);
                return userCredential;
            }
            catch (FirebaseAuthException ex)
            {
                throw new Exception(GetFriendlyErrorMessage(ex));
            }
        }

        // Hàm đăng ký
        public static async Task<UserCredential> RegisterAsync(string email, string password)
        {
            try
            {
                var userCredential = await authClient.CreateUserWithEmailAndPasswordAsync(email, password);
                return userCredential;
            }
            catch (FirebaseAuthException ex)
            {
                throw new Exception(GetFriendlyErrorMessage(ex));
            }
        }

        // Hàm quên mật khẩu
        public static async Task ForgotPasswordAsync(string email)
        {
            try
            {
                await authClient.ResetEmailPasswordAsync(email);
            }
            catch (FirebaseAuthException ex)
            {
                throw new Exception(GetFriendlyErrorMessage(ex));
            }
        }

        // Hàm chuyển đổi mã lỗi Firebase sang thông báo thân thiện
        private static string GetFriendlyErrorMessage(FirebaseAuthException ex)
        {
            switch (ex.Reason)
            {
                case AuthErrorReason.EmailExists:
                    return "Email này đã được sử dụng.";
                case AuthErrorReason.InvalidEmailAddress:
                    return "Email không hợp lệ.";
                case AuthErrorReason.WeakPassword:
                    return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn (ít nhất 6 ký tự).";
                case AuthErrorReason.WrongPassword:
                    return "Email hoặc mật khẩu không chính xác.";
                case AuthErrorReason.UnknownEmailAddress:
                    return "Email không tồn tại trong hệ thống.";
                case AuthErrorReason.UserDisabled:
                    return "Tài khoản đã bị vô hiệu hóa.";
                case AuthErrorReason.TooManyAttemptsTryLater:
                    return "Quá nhiều lần thử. Vui lòng thử lại sau.";
                default:
                    return $"Đã xảy ra lỗi: {ex.Reason}. Vui lòng thử lại.";
            }
        }
    }
}
