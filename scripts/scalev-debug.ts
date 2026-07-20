const apiKey = process.env.SCALEV_API_KEY!;

async function main() {
  const listRes = await fetch("https://api.scalev.id/v2/products?limit=100", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const listJson = await listRes.json() as any;
  const results: any[] = listJson.data?.results ?? [];
  console.log(`Total: ${results.length}`);
  for (const p of results) {
    console.log(`  id=${p.id}  slug=${p.slug}  name="${p.name}"`);
  }
}

main().catch(console.error);
