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
            // Validate that the evaluator exists and is a supervisor
            var evaluator = await _context.Users.FirstOrDefaultAsync(u => u.Email == evaluation.EvaluatorEmail);
            if (evaluator == null)
            {
                return BadRequest(new { message = "Evaluator not found. Please ensure you are logged in." });
            }

            if (evaluator.UserRole.ToLower() != "supervisor")
            {
                return Forbid(); // 403 Forbidden - Only supervisors can create evaluations
            }

            // Validate that the project exists
            var project = await _context.Projects.FindAsync(evaluation.ProjectId);
            if (project == null)
            {
                return NotFound(new { message = "Project not found" });
            }

            // Verify that the supervisor is authorized to evaluate this project
            // Supervisor must be either the project supervisor OR invited to evaluate
            if (project.SupervisorEmail != evaluator.Email)
            {
                // TODO: Check if supervisor is invited to evaluate this project
                // For now, only the project supervisor can evaluate
                return Forbid(); // 403 Forbidden - You are not authorized to evaluate this project
            }

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

            // Validate that the evaluator exists and is a supervisor
            var evaluator = await _context.Users.FirstOrDefaultAsync(u => u.Email == updatedEvaluation.EvaluatorEmail);
            if (evaluator == null)
            {
                return BadRequest(new { message = "Evaluator not found. Please ensure you are logged in." });
            }

            if (evaluator.UserRole.ToLower() != "supervisor")
            {
                return Forbid(); // 403 Forbidden - Only supervisors can update evaluations
            }

            // Only allow the original evaluator to update their own evaluation
            if (evaluation.EvaluatorEmail != updatedEvaluation.EvaluatorEmail)
            {
                return Forbid(); // 403 Forbidden - Cannot update another supervisor's evaluation
            }

            // Verify that the supervisor is authorized to evaluate this project
            var project = await _context.Projects.FindAsync(evaluation.ProjectId);
            if (project != null && project.SupervisorEmail != evaluator.Email)
            {
                // TODO: Check if supervisor is invited to evaluate this project
                return Forbid(); // 403 Forbidden - You are not authorized to evaluate this project
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
