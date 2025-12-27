using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Models;
using Encadri_Backend.Data;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NoteCategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NoteCategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all categories for the current user
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NoteCategory>>> GetAll([FromQuery] string? userEmail = null)
        {
            if (string.IsNullOrEmpty(userEmail))
            {
                return BadRequest("User email is required");
            }

            var categories = await _context.NoteCategories
                .Where(c => c.UserEmail == userEmail)
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(categories);
        }

        /// <summary>
        /// Get category by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<NoteCategory>> GetById(string id)
        {
            var category = await _context.NoteCategories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }
            return Ok(category);
        }

        /// <summary>
        /// Create a new category
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<NoteCategory>> Create([FromBody] NoteCategory category)
        {
            if (string.IsNullOrEmpty(category.UserEmail))
            {
                return BadRequest("User email is required");
            }

            category.Id = Guid.NewGuid().ToString();
            category.CreatedDate = DateTime.UtcNow;
            category.UpdatedDate = DateTime.UtcNow;

            _context.NoteCategories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
        }

        /// <summary>
        /// Update an existing category
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<NoteCategory>> Update(string id, [FromBody] NoteCategory category)
        {
            if (id != category.Id)
            {
                return BadRequest("ID mismatch");
            }

            var existingCategory = await _context.NoteCategories.FindAsync(id);
            if (existingCategory == null)
            {
                return NotFound();
            }

            existingCategory.Name = category.Name;
            existingCategory.Description = category.Description;
            existingCategory.Color = category.Color;
            existingCategory.Icon = category.Icon;
            existingCategory.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existingCategory);
        }

        /// <summary>
        /// Delete a category
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var category = await _context.NoteCategories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            // Optional: Check if category has notes and prevent deletion or cascade
            var hasNotes = await _context.Notes.AnyAsync(n => n.CategoryId == id);
            if (hasNotes)
            {
                return BadRequest("Cannot delete category that contains notes");
            }

            _context.NoteCategories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
