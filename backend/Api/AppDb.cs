using Microsoft.EntityFrameworkCore;

namespace ChatbotEvaluator;

public class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<Scenario> Scenarios => Set<Scenario>();
    public DbSet<Run> Runs => Set<Run>();
}
