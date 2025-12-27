using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Models;
using Encadri_Backend.Data;
using Encadri_Backend.Helpers;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all notes for the current user with optional filters
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Note>>> GetAll(
            [FromQuery] string? userEmail = null,
            [FromQuery] string? categoryId = null,
            [FromQuery] string? folderId = null,
            [FromQuery] bool? isPinned = null,
            [FromQuery] string? searchTerm = null)
        {
            if (string.IsNullOrEmpty(userEmail))
            {
                return BadRequest("User email is required");
            }

            var notes = _context.Notes
                .Where(n => n.UserEmail == userEmail)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(categoryId))
            {
                notes = notes.Where(n => n.CategoryId == categoryId);
            }

            if (!string.IsNullOrEmpty(folderId))
            {
                notes = notes.Where(n => n.FolderId == folderId);
            }

            if (isPinned.HasValue)
            {
                notes = notes.Where(n => n.IsPinned == isPinned.Value);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                notes = notes.Where(n =>
                    n.Title.ToLower().Contains(searchTerm.ToLower()) ||
                    n.Content.ToLower().Contains(searchTerm.ToLower()));
            }

            return Ok(await notes
                .OrderByDescending(n => n.IsPinned)
                .ThenByDescending(n => n.UpdatedDate)
                .ToListAsync());
        }

        /// <summary>
        /// Get note by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Note>> GetById(string id)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null)
            {
                return NotFound();
            }
            return Ok(note);
        }

        /// <summary>
        /// Create a new note
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Note>> Create([FromBody] Note note)
        {
            if (string.IsNullOrEmpty(note.UserEmail))
            {
                return BadRequest("User email is required");
            }

            note.Id = Guid.NewGuid().ToString();
            note.CreatedDate = DateTime.UtcNow;
            note.UpdatedDate = DateTime.UtcNow;

            _context.Notes.Add(note);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = note.Id }, note);
        }

        /// <summary>
        /// Update an existing note
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Note>> Update(string id, [FromBody] Note note)
        {
            if (id != note.Id)
            {
                return BadRequest("ID mismatch");
            }

            var existingNote = await _context.Notes.FindAsync(id);
            if (existingNote == null)
            {
                return NotFound();
            }

            // Update properties
            existingNote.Title = note.Title;
            existingNote.Content = note.Content;
            existingNote.CategoryId = note.CategoryId;
            existingNote.FolderId = note.FolderId;
            existingNote.Color = note.Color;
            existingNote.IsPinned = note.IsPinned;
            existingNote.Tags = note.Tags;
            existingNote.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existingNote);
        }

        /// <summary>
        /// Delete a note
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null)
            {
                return NotFound();
            }

            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Toggle pin status of a note
        /// </summary>
        [HttpPatch("{id}/pin")]
        public async Task<ActionResult<Note>> TogglePin(string id, [FromBody] PinRequest request)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null)
            {
                return NotFound();
            }

            note.IsPinned = request.IsPinned;
            note.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(note);
        }
    }

    public class PinRequest
    {
        public bool IsPinned { get; set; }
    }
}
