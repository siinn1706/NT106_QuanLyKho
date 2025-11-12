using Firebase.Auth;
using Firebase.Auth.Providers;
using Newtonsoft.Json;
using NT106_Nhom12_Pro.Forms;
using NT106_Nhom12_Pro.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

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

        //Đổi mật khẩu cho user đang đăng nhập
        public static async Task ChangePasswordAsync(string currentPassword, string newPassword)
        {
            try
            {
                // Bước 1: Xác thực lại với mật khẩu hiện tại
                var email = Login_Form.CurrentUserEmail;
                if (string.IsNullOrEmpty(email))
                {
                    throw new Exception("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                }

                // Re-authenticate user
                var userCredential = await authClient.SignInWithEmailAndPasswordAsync(email, currentPassword);

                // Bước 2: Đổi mật khẩu qua Firebase REST API
                var success = await UpdatePasswordViaRestAPI(userCredential.User.Credential.IdToken, newPassword);

                if (!success)
                {
                    throw new Exception("Không thể đổi mật khẩu. Vui lòng thử lại.");
                }

                // Bước 3: Cập nhật token mới
                Login_Form.CurrentUserToken = userCredential.User.Credential.IdToken;
            }
            catch (FirebaseAuthException ex)
            {
                if (ex.Reason == AuthErrorReason.WrongPassword)
                {
                    throw new Exception("Mật khẩu hiện tại không đúng.");
                }
                throw new Exception(GetFriendlyErrorMessage(ex));
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        //Cập nhật mật khẩu qua REST API
        private static async Task<bool> UpdatePasswordViaRestAPI(string idToken, string newPassword)
        {
            try
            {
                using (var httpClient = new HttpClient())
                {
                    var url = $"https://identitytoolkit.googleapis.com/v1/accounts:update?key={FirebaseConfig.apiKey}";

                    var requestData = new
                    {
                        idToken = idToken,
                        password = newPassword,
                        returnSecureToken = true
                    };

                    var json = JsonConvert.SerializeObject(requestData);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await httpClient.PostAsync(url, content);

                    return response.IsSuccessStatusCode;
                }
            }
            catch
            {
                return false;
            }
        }

        //Xóa tài khoản user hiện tại
        public static async Task DeleteAccountAsync(string currentPassword)
        {
            try
            {
                var email = Login_Form.CurrentUserEmail;
                if (string.IsNullOrEmpty(email))
                {
                    throw new Exception("Phiên đăng nhập đã hết hạn.");
                }

                // Re-authenticate trước khi xóa
                var userCredential = await authClient.SignInWithEmailAndPasswordAsync(email, currentPassword);

                // Xóa account qua REST API
                using (var httpClient = new HttpClient())
                {
                    var url = $"https://identitytoolkit.googleapis.com/v1/accounts:delete?key={FirebaseConfig.apiKey}";

                    var requestData = new { idToken = userCredential.User.Credential.IdToken };
                    var json = JsonConvert.SerializeObject(requestData);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await httpClient.PostAsync(url, content);

                    if (!response.IsSuccessStatusCode)
                    {
                        throw new Exception("Không thể xóa tài khoản. Vui lòng thử lại.");
                    }
                }
            }
            catch (FirebaseAuthException ex)
            {
                if (ex.Reason == AuthErrorReason.WrongPassword)
                {
                    throw new Exception("Mật khẩu không đúng.");
                }
                throw new Exception(GetFriendlyErrorMessage(ex));
            }
        }

        //Cập nhật thông tin Profile
        public static async Task UpdateProfileAsync(string displayName, string photoUrl = "")
        {
            try
            {
                var idToken = Login_Form.CurrentUserToken;
                if (string.IsNullOrEmpty(idToken))
                {
                    throw new Exception("Phiên đăng nhập đã hết hạn.");
                }

                using (var httpClient = new HttpClient())
                {
                    var url = $"https://identitytoolkit.googleapis.com/v1/accounts:update?key={FirebaseConfig.apiKey}";

                    var requestData = new
                    {
                        idToken = idToken,
                        displayName = displayName,
                        photoUrl = photoUrl,
                        returnSecureToken = false
                    };

                    var json = JsonConvert.SerializeObject(requestData);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await httpClient.PostAsync(url, content);

                    if (!response.IsSuccessStatusCode)
                    {
                        throw new Exception("Không thể cập nhật thông tin. Vui lòng thử lại.");
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
    }
}
