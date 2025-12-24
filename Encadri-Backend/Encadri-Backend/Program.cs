using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Data;
using Encadri_Backend.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Configure PostgreSQL Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    // Railway automatically provides DATABASE_URL when PostgreSQL is linked
    // Also check for individual postgres environment variables
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
                   ?? Environment.GetEnvironmentVariable("PGURL")
                   ?? Environment.GetEnvironmentVariable("POSTGRES_URL");

    // For local development
    var configConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    // Debug logging
    Console.WriteLine("=== DATABASE CONNECTION DEBUG ===");
    Console.WriteLine($"DATABASE_URL exists: {!string.IsNullOrEmpty(databaseUrl)}");
    Console.WriteLine($"ConnectionStrings:DefaultConnection exists: {!string.IsNullOrEmpty(configConnectionString)}");

    // Try to build from individual Postgres variables if DATABASE_URL not found
    if (string.IsNullOrEmpty(databaseUrl))
    {
        var pgHost = Environment.GetEnvironmentVariable("PGHOST");
        var pgPort = Environment.GetEnvironmentVariable("PGPORT");
        var pgUser = Environment.GetEnvironmentVariable("PGUSER") ?? Environment.GetEnvironmentVariable("POSTGRES_USER");
        var pgPassword = Environment.GetEnvironmentVariable("PGPASSWORD") ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");
        var pgDatabase = Environment.GetEnvironmentVariable("PGDATABASE") ?? Environment.GetEnvironmentVariable("POSTGRES_DB");

        if (!string.IsNullOrEmpty(pgHost) && !string.IsNullOrEmpty(pgUser) && !string.IsNullOrEmpty(pgPassword))
        {
            pgPort = pgPort ?? "5432";
            pgDatabase = pgDatabase ?? "railway";
            databaseUrl = $"postgresql://{pgUser}:{pgPassword}@{pgHost}:{pgPort}/{pgDatabase}";
            Console.WriteLine("Built connection string from individual POSTGRES variables");
        }
    }

    var connectionString = (databaseUrl ?? configConnectionString)?.Trim();

    if (string.IsNullOrEmpty(connectionString))
    {
        Console.WriteLine("ERROR: No database connection string found!");
        Console.WriteLine("Checked: DATABASE_URL, PGURL, POSTGRES_URL, individual PG* variables, and appsettings.json");
        Console.WriteLine("Available environment variables:");
        foreach (System.Collections.DictionaryEntry env in Environment.GetEnvironmentVariables())
        {
            if (env.Key.ToString().Contains("PG") || env.Key.ToString().Contains("POSTGRES") || env.Key.ToString().Contains("DATABASE"))
            {
                Console.WriteLine($"  {env.Key} = {(env.Key.ToString().Contains("PASSWORD") ? "***" : env.Value)}");
            }
        }
        throw new InvalidOperationException("Database connection string not found. Set DATABASE_URL or ConnectionStrings:DefaultConnection");
    }

    Console.WriteLine($"Using connection string from: {(databaseUrl != null ? "Environment Variable" : "appsettings.json")}");

    // Show sanitized connection string for debugging
    var sanitized = connectionString;
    if (sanitized.Contains("@"))
    {
        var parts = sanitized.Split('@');
        if (parts[0].Contains("://"))
        {
            var authPart = parts[0].Substring(parts[0].IndexOf("://") + 3);
            if (authPart.Contains(":"))
            {
                var user = authPart.Split(':')[0];
                sanitized = sanitized.Replace(authPart, $"{user}:***");
            }
        }
    }
    Console.WriteLine($"Connection string format: {sanitized}");
    Console.WriteLine($"Connection string length: {connectionString.Length}");
    Console.WriteLine($"First 20 chars: {connectionString.Substring(0, Math.Min(20, connectionString.Length))}");

    // Convert postgresql:// URL format to Npgsql connection string format
    if (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://"))
    {
        Console.WriteLine("Converting PostgreSQL URL to Npgsql format...");
        try
        {
            var uri = new Uri(connectionString.Replace("postgres://", "postgresql://"));
            var host = uri.Host;
            var port = uri.Port > 0 ? uri.Port : 5432;
            var database = uri.AbsolutePath.TrimStart('/');
            var userInfo = uri.UserInfo.Split(':');
            var username = userInfo[0];
            var password = userInfo.Length > 1 ? userInfo[1] : "";

            connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password}";
            Console.WriteLine($"Converted to Npgsql format successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to convert URL format: {ex.Message}");
            Console.WriteLine("Attempting to use URL format directly...");
        }
    }

    Console.WriteLine("=== END DEBUG ===");
    options.UseNpgsql(connectionString);
});

// Add SignalR services
builder.Services.AddSignalR();

// Add Notification Helper Service
builder.Services.AddScoped<Encadri_Backend.Services.NotificationHelperService>();

// Add Azure Blob Storage and Document Services
builder.Services.AddSingleton<Encadri_Backend.Services.IAzureBlobStorageService, Encadri_Backend.Services.AzureBlobStorageService>();
builder.Services.AddScoped<Encadri_Backend.Services.IDocumentService, Encadri_Backend.Services.DocumentService>();

// Configure CORS for Angular frontend and Swagger (with SignalR support)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy =>
        {
            policy.SetIsOriginAllowed(_ => true)  // Allow all origins for now
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();  // Required for SignalR
        });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization for Angular frontend (snake_case -> camelCase)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.WriteIndented = false;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Encadri API",
        Version = "v1",
        Description = "API for Encadri project management system - manages students, supervisors, projects, submissions, meetings, and evaluations"
    });
});

var app = builder.Build();

// Apply migrations and seed database
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Apply pending migrations
        Console.WriteLine("Applying database migrations...");
        await context.Database.MigrateAsync();
        Console.WriteLine("Migrations applied successfully!");

        // Seed the database with test data
        Console.WriteLine("Seeding database...");
        await Encadri_Backend.Data.DbSeeder.SeedDatabase(context);
        Console.WriteLine("Database seeding completed!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"ERROR during database setup: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        // Don't crash the app, just log the error
        Console.WriteLine("Continuing without seeding...");
    }
}

// Configure the HTTP request pipeline.
// Enable Swagger in all environments for easy API testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Encadri API V1");
    c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
});

// Enable CORS
app.UseCors("AllowAngularApp");

// Only redirect to HTTPS in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}



app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

// Map SignalR hub endpoints
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

