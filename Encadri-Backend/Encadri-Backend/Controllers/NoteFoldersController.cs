using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Models;
using Encadri_Backend.Data;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NoteFoldersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NoteFoldersController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all folders for the current user with optional category filter
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NoteFolder>>> GetAll(
            [FromQuery] string? userEmail = null,
            [FromQuery] string? categoryId = null)
        {
            if (string.IsNullOrEmpty(userEmail))
            {
                return BadRequest("User email is required");
            }

            var folders = _context.NoteFolders
                .Where(f => f.UserEmail == userEmail)
                .AsQueryable();

            if (!string.IsNullOrEmpty(categoryId))
            {
                folders = folders.Where(f => f.CategoryId == categoryId);
            }

            return Ok(await folders.OrderBy(f => f.Name).ToListAsync());
        }

        /// <summary>
        /// Get folder by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<NoteFolder>> GetById(string id)
        {
            var folder = await _context.NoteFolders.FindAsync(id);
            if (folder == null)
            {
                return NotFound();
            }
            return Ok(folder);
        }

        /// <summary>
        /// Create a new folder
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<NoteFolder>> Create([FromBody] NoteFolder folder)
        {
            if (string.IsNullOrEmpty(folder.UserEmail))
            {
                return BadRequest("User email is required");
            }

            folder.Id = Guid.NewGuid().ToString();
            folder.CreatedDate = DateTime.UtcNow;
            folder.UpdatedDate = DateTime.UtcNow;

            _context.NoteFolders.Add(folder);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = folder.Id }, folder);
        }

        /// <summary>
        /// Update an existing folder
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<NoteFolder>> Update(string id, [FromBody] NoteFolder folder)
        {
            if (id != folder.Id)
            {
                return BadRequest("ID mismatch");
            }

            var existingFolder = await _context.NoteFolders.FindAsync(id);
            if (existingFolder == null)
            {
                return NotFound();
            }

            existingFolder.Name = folder.Name;
            existingFolder.CategoryId = folder.CategoryId;
            existingFolder.ParentFolderId = folder.ParentFolderId;
            existingFolder.Color = folder.Color;
            existingFolder.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existingFolder);
        }

        /// <summary>
        /// Delete a folder
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var folder = await _context.NoteFolders.FindAsync(id);
            if (folder == null)
            {
                return NotFound();
            }

            // Optional: Check if folder has notes and prevent deletion or cascade
            var hasNotes = await _context.Notes.AnyAsync(n => n.FolderId == id);
            if (hasNotes)
            {
                return BadRequest("Cannot delete folder that contains notes");
            }

            // Optional: Check if folder has subfolders
            var hasSubfolders = await _context.NoteFolders.AnyAsync(f => f.ParentFolderId == id);
            if (hasSubfolders)
            {
                return BadRequest("Cannot delete folder that contains subfolders");
            }

            _context.NoteFolders.Remove(folder);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
