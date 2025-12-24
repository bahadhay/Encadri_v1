using System.Security.Cryptography;
using System.Text;

namespace Encadri_Backend.Services
{
    /// <summary>
    /// Password Hashing Service using PBKDF2
    /// Provides secure password hashing and verification
    /// </summary>
    public static class PasswordHasher
    {
        private const int SaltSize = 16; // 128 bit
        private const int KeySize = 32; // 256 bit
        private const int Iterations = 10000;
        private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

        /// <summary>
        /// Hash a password using PBKDF2
        /// </summary>
        /// <param name="password">Plain text password</param>
        /// <returns>Base64 encoded hash with salt</returns>
        public static string HashPassword(string password)
        {
            // Generate a random salt
            byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);

            // Hash the password
            byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                Iterations,
                Algorithm,
                KeySize
            );

            // Combine salt and hash
            byte[] hashBytes = new byte[SaltSize + KeySize];
            Array.Copy(salt, 0, hashBytes, 0, SaltSize);
            Array.Copy(hash, 0, hashBytes, SaltSize, KeySize);

            // Convert to base64 for storage
            return Convert.ToBase64String(hashBytes);
        }

        /// <summary>
        /// Verify a password against a hash
        /// </summary>
        /// <param name="password">Plain text password to verify</param>
        /// <param name="hash">Stored hash to verify against</param>
        /// <returns>True if password matches</returns>
        public static bool VerifyPassword(string password, string hash)
        {
            try
            {
                // Decode the hash
                byte[] hashBytes = Convert.FromBase64String(hash);

                // Extract the salt
                byte[] salt = new byte[SaltSize];
                Array.Copy(hashBytes, 0, salt, 0, SaltSize);

                // Extract the hash
                byte[] storedHash = new byte[KeySize];
                Array.Copy(hashBytes, SaltSize, storedHash, 0, KeySize);

                // Hash the input password with the same salt
                byte[] computedHash = Rfc2898DeriveBytes.Pbkdf2(
                    Encoding.UTF8.GetBytes(password),
                    salt,
                    Iterations,
                    Algorithm,
                    KeySize
                );

                // Compare the hashes
                return CryptographicOperations.FixedTimeEquals(computedHash, storedHash);
            }
            catch
            {
                return false;
            }
        }
    }
}
