using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;

namespace Encadri_Backend.Services
{
    public class AzureBlobStorageService : IAzureBlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName;
        private readonly ILogger<AzureBlobStorageService> _logger;

        public AzureBlobStorageService(IConfiguration configuration, ILogger<AzureBlobStorageService> logger)
        {
            // Check environment variable first, then fall back to appsettings.json
            var connectionString = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING")
                                ?? configuration["AzureStorage:ConnectionString"];

            _containerName = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONTAINER_NAME")
                          ?? configuration["AzureStorage:ContainerName"]
                          ?? "encadri-documents";

            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogWarning("Azure Storage connection string is not configured. File upload features will not work.");
                _logger.LogWarning("Set AZURE_STORAGE_CONNECTION_STRING environment variable or AzureStorage:ConnectionString in appsettings.json");
                // Don't throw exception - allow app to run without Azure Storage
                return;
            }

            _blobServiceClient = new BlobServiceClient(connectionString);
            _logger = logger;
            _logger.LogInformation($"Azure Blob Storage initialized with container: {_containerName}");

            // Ensure container exists
            EnsureContainerExistsAsync().Wait();
        }

        private async Task EnsureContainerExistsAsync()
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);
                _logger.LogInformation($"Container '{_containerName}' is ready");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error ensuring container exists: {ex.Message}");
                throw;
            }
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);

                // Generate unique blob name
                var blobName = $"{Guid.NewGuid()}_{fileName}";
                var blobClient = containerClient.GetBlobClient(blobName);

                // Upload with content type
                var blobHttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType
                };

                await blobClient.UploadAsync(fileStream, new BlobUploadOptions
                {
                    HttpHeaders = blobHttpHeaders
                });

                _logger.LogInformation($"File uploaded successfully: {blobName}");
                return blobName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading file: {ex.Message}");
                throw;
            }
        }

        public async Task<Stream> DownloadFileAsync(string blobName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(blobName);

                var response = await blobClient.DownloadAsync();
                return response.Value.Content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error downloading file: {ex.Message}");
                throw;
            }
        }

        public async Task DeleteFileAsync(string blobName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(blobName);

                await blobClient.DeleteIfExistsAsync();
                _logger.LogInformation($"File deleted successfully: {blobName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> FileExistsAsync(string blobName)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(blobName);

                return await blobClient.ExistsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking file existence: {ex.Message}");
                return false;
            }
        }

        public async Task<string> GetBlobSasUrlAsync(string blobName, int expiryMinutes = 60)
        {
            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(blobName);

                if (!await blobClient.ExistsAsync())
                {
                    throw new FileNotFoundException($"Blob '{blobName}' not found");
                }

                // Create SAS token
                var sasBuilder = new BlobSasBuilder
                {
                    BlobContainerName = _containerName,
                    BlobName = blobName,
                    Resource = "b",
                    StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
                    ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)
                };

                sasBuilder.SetPermissions(BlobSasPermissions.Read);

                var sasUri = blobClient.GenerateSasUri(sasBuilder);
                return sasUri.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating SAS URL: {ex.Message}");
                throw;
            }
        }
    }
}
