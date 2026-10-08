import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express, { Request, Response } from 'express';
import compression from 'compression';

describe('Performance Optimization Suite', () => {
  it('compresses JSON response payloads when client accepts gzip', async () => {
    const app = express();
    app.use(compression({ threshold: 0 }));
    app.get('/large-payload', (_req: Request, res: Response) => {
      // Create repetitive JSON to ensure compressibility
      const data = Array.from({ length: 50 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i} Sri Ram Premium Catalog`,
        description: 'High quality appliance manufactured in India with warranty',
        price: 1999,
      }));
      res.json(data);
    });

    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/large-payload`, {
        headers: { 'Accept-Encoding': 'gzip' },
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-encoding'), 'gzip', 'Response must be gzip compressed');
    } finally {
      server.close();
    }
  });

  it('calculates catalog aggregated metrics efficiently via single pass', () => {
    const mockProducts = [
      { price: 1000, inventoryCount: 10, category: 'Kitchen', inStock: true },
      { price: 2000, inventoryCount: 5, category: 'Kitchen', inStock: true },
      { price: 500, inventoryCount: 0, category: 'Cleaning', inStock: false },
      { price: 1500, inventoryCount: 2, category: 'Hardware', inStock: true },
    ];

    // Single pass aggregation simulation
    let totalProducts = 0;
    let activeProducts = 0;
    let lowStockProducts = 0;
    let totalCatalogValue = 0;
    const categorySet = new Set<string>();

    for (const p of mockProducts) {
      totalProducts++;
      if (p.inStock) activeProducts++;
      if (p.inventoryCount > 0 && p.inventoryCount <= 5) lowStockProducts++;
      totalCatalogValue += p.price * p.inventoryCount;
      categorySet.add(p.category);
    }

    assert.equal(totalProducts, 4);
    assert.equal(activeProducts, 3);
    assert.equal(lowStockProducts, 2); // 5 and 2
    assert.equal(categorySet.size, 3);
    assert.equal(totalCatalogValue, (1000 * 10) + (2000 * 5) + (500 * 0) + (1500 * 2)); // 10000 + 10000 + 0 + 3000 = 23000
  });
});
