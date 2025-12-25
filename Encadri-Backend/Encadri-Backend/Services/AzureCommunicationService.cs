using Azure.Communication.Identity;
using Azure;

namespace Encadri_Backend.Services
{
    /// <summary>
    /// Service for Azure Communication Services (Video calls, chat, etc.)
    /// </summary>
    public interface IAzureCommunicationService
    {
        Task<string> CreateUserAndGetToken();
        Task<string> GetTokenForUser(string userId);
    }

    public class AzureCommunicationService : IAzureCommunicationService
    {
        private readonly CommunicationIdentityClient _client;

        public AzureCommunicationService(IConfiguration configuration)
        {
            var connectionString = configuration["AzureCommunication:ConnectionString"]
                ?? Environment.GetEnvironmentVariable("AZURE_COMMUNICATION_CONNECTION_STRING");

            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException(
                    "Azure Communication Services connection string not found. " +
                    "Set AzureCommunication:ConnectionString in appsettings.json or " +
                    "AZURE_COMMUNICATION_CONNECTION_STRING environment variable."
                );
            }

            _client = new CommunicationIdentityClient(connectionString);
        }

        /// <summary>
        /// Create a new ACS user and generate an access token for video calling
        /// </summary>
        public async Task<string> CreateUserAndGetToken()
        {
            try
            {
                // Create a new user
                var userResponse = await _client.CreateUserAsync();
                var user = userResponse.Value;

                // Generate token with VoIP scope (for video/audio calls)
                var tokenResponse = await _client.GetTokenAsync(
                    user,
                    scopes: new[] { CommunicationTokenScope.VoIP }
                );

                // Return token (frontend will use this to join calls)
                return tokenResponse.Value.Token;
            }
            catch (RequestFailedException ex)
            {
                throw new Exception($"Failed to create ACS user: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get a new token for an existing ACS user
        /// </summary>
        public async Task<string> GetTokenForUser(string userId)
        {
            try
            {
                var user = new CommunicationUserIdentifier(userId);
                var tokenResponse = await _client.GetTokenAsync(
                    user,
                    scopes: new[] { CommunicationTokenScope.VoIP }
                );

                return tokenResponse.Value.Token;
            }
            catch (RequestFailedException ex)
            {
                throw new Exception($"Failed to get token for user {userId}: {ex.Message}", ex);
            }
        }
    }
}
