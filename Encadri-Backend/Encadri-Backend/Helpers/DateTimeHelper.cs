namespace Encadri_Backend.Helpers
{
    public static class DateTimeHelper
    {
        /// <summary>
        /// Ensures a DateTime value is in UTC format for PostgreSQL compatibility
        /// </summary>
        public static DateTime? EnsureUtc(DateTime? dateTime)
        {
            if (!dateTime.HasValue)
                return null;

            if (dateTime.Value.Kind == DateTimeKind.Unspecified)
                return DateTime.SpecifyKind(dateTime.Value, DateTimeKind.Utc);

            if (dateTime.Value.Kind == DateTimeKind.Local)
                return dateTime.Value.ToUniversalTime();

            return dateTime.Value;
        }

        /// <summary>
        /// Ensures a DateTime value is in UTC format for PostgreSQL compatibility
        /// </summary>
        public static DateTime EnsureUtc(DateTime dateTime)
        {
            if (dateTime.Kind == DateTimeKind.Unspecified)
                return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);

            if (dateTime.Kind == DateTimeKind.Local)
                return dateTime.ToUniversalTime();

            return dateTime;
        }
    }
}
