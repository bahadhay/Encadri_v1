using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Encadri_Backend.Data;
using Encadri_Backend.Models;
using Encadri_Backend.Helpers;

namespace Encadri_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EvaluationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EvaluationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all evaluations
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Evaluation>>> GetAll([FromQuery] string? projectId = null)
        {
            var evaluations = _context.Evaluations.AsQueryable();

            if (!string.IsNullOrEmpty(projectId))
            {
                evaluations = evaluations.Where(e => e.ProjectId == projectId);
            }

            return Ok(await evaluations.ToListAsync());
        }

        /// <summary>
        /// Get evaluation by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Evaluation>> GetById(string id)
        {
            var evaluation = await _context.Evaluations.FindAsync(id);
            if (evaluation == null)
            {
                return NotFound();
            }
            return Ok(evaluation);
        }

        /// <summary>
        /// Create a new evaluation
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Evaluation>> Create([FromBody] Evaluation evaluation)
        {
            evaluation.Id = Guid.NewGuid().ToString();
            evaluation.CreatedDate = DateTime.UtcNow;
            evaluation.UpdatedDate = DateTime.UtcNow;
            evaluation.DefenseDate = DateTimeHelper.EnsureUtc(evaluation.DefenseDate);
            _context.Evaluations.Add(evaluation);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = evaluation.Id }, evaluation);
        }

        /// <summary>
        /// Update an existing evaluation
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Evaluation>> Update(string id, [FromBody] Evaluation updatedEvaluation)
        {
            var evaluation = await _context.Evaluations.FindAsync(id);
            if (evaluation == null)
            {
                return NotFound();
            }

            evaluation.EvaluatorEmail = updatedEvaluation.EvaluatorEmail;
            evaluation.EvaluatorName = updatedEvaluation.EvaluatorName;
            evaluation.ReportQualityScore = updatedEvaluation.ReportQualityScore;
            evaluation.TechnicalImplementationScore = updatedEvaluation.TechnicalImplementationScore;
            evaluation.PresentationScore = updatedEvaluation.PresentationScore;
            evaluation.ProfessionalConductScore = updatedEvaluation.ProfessionalConductScore;
            evaluation.FinalGrade = updatedEvaluation.FinalGrade;
            evaluation.Comments = updatedEvaluation.Comments;
            evaluation.DefenseDate = DateTimeHelper.EnsureUtc(updatedEvaluation.DefenseDate);
            evaluation.UpdatedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(evaluation);
        }

        /// <summary>
        /// Delete an evaluation
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var evaluation = await _context.Evaluations.FindAsync(id);
            if (evaluation == null)
            {
                return NotFound();
            }

            _context.Evaluations.Remove(evaluation);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
