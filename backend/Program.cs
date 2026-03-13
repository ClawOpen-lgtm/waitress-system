using Microsoft.EntityFrameworkCore;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<WaitressContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
    options.AddPolicy("AllowAngular", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

app.UseCors("AllowAngular");
app.UseSwagger();
app.UseSwaggerUI();

// Endpoints
app.MapGet("/products", async (WaitressContext db) => await db.Products.ToListAsync());
app.MapGet("/tables/{tableId}", async (int tableId, WaitressContext db) =>
    await db.Orders.Where(o => o.TableId == tableId).Include(o => o.Product).ToListAsync());
app.MapPost("/orders", async (Order order, WaitressContext db) =>
{
    order.OrderedAt = DateTime.UtcNow;
    db.Orders.Add(order);
    await db.SaveChangesAsync();
    return Results.Created($"/orders/{order.Id}", order);
});
app.MapGet("/summary/{tableId}", async (int tableId, WaitressContext db) =>
{
    var orders = await db.Orders.Where(o => o.TableId == tableId).Include(o => o.Product).ToListAsync();
    var total = orders.Sum(o => o.Product.Price);
    return Results.Ok(new { TableId = tableId, Total = total, Items = orders.Count });
});

// Seed products from mounted config if present
var productsPath = Path.Combine(AppContext.BaseDirectory, "products.json");
if (File.Exists(productsPath))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<WaitressContext>();
    db.Database.EnsureCreated();
    if (!db.Products.Any())
    {
        var json = await File.ReadAllTextAsync(productsPath);
        var products = JsonSerializer.Deserialize<List<Product>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (products != null && products.Count > 0)
        {
            await db.Products.AddRangeAsync(products);
            await db.SaveChangesAsync();
        }
    }
}

app.Run();

public class Product { public int Id { get; set; }; public string Name { get; set; } = ""; public decimal Price { get; set; } }
public class Order { public int Id { get; set; }; public int TableId { get; set; }; public int ProductId { get; set; }; public Product? Product { get; set; }; public DateTime OrderedAt { get; set; } }
public class WaitressContext : DbContext 
{ 
    public WaitressContext(DbContextOptions<WaitressContext> options) : base(options) { }
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
}
