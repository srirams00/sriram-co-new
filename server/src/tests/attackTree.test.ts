import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NodeType,
  Difficulty,
  Cost,
  DetectionRisk,
  AttackNode,
  AttackTree,
  AttackTreeBuilder,
  AttackPathAnalyzer,
  MermaidExporter,
  buildSriramCoAttackTree,
} from '../utils/attackTree.js';

describe('Attack Tree Construction Framework Suite', () => {
  describe('AttackNode & Quantitative Attribution Calculations', () => {
    it('calculates path difficulty and cost correctly for LEAF, OR, and AND nodes', () => {
      const leaf1 = new AttackNode({
        id: 'L1',
        name: 'Trivial Attack',
        nodeType: NodeType.LEAF,
        attributes: { difficulty: Difficulty.TRIVIAL, cost: Cost.FREE },
      });
      const leaf2 = new AttackNode({
        id: 'L2',
        name: 'High Attack',
        nodeType: NodeType.LEAF,
        attributes: { difficulty: Difficulty.HIGH, cost: Cost.HIGH },
      });

      // OR node: minimum difficulty and cost among children
      const orNode = new AttackNode({
        id: 'OR1',
        name: 'OR Subgoal',
        nodeType: NodeType.OR,
      });
      orNode.addChild(leaf1);
      orNode.addChild(leaf2);

      assert.equal(orNode.calculatePathDifficulty(), Difficulty.TRIVIAL);
      assert.equal(orNode.calculatePathCost(), Cost.FREE);

      // AND node: maximum difficulty and sum of costs
      const andNode = new AttackNode({
        id: 'AND1',
        name: 'AND Subgoal',
        nodeType: NodeType.AND,
      });
      andNode.addChild(leaf1);
      andNode.addChild(leaf2);

      assert.equal(andNode.calculatePathDifficulty(), Difficulty.HIGH);
      assert.equal(andNode.calculatePathCost(), Cost.FREE + Cost.HIGH);
    });

    it('serializes node to JSON with string representation of enums', () => {
      const leaf = new AttackNode({
        id: 'L1',
        name: 'Test Leaf',
        nodeType: NodeType.LEAF,
        attributes: {
          difficulty: Difficulty.MEDIUM,
          cost: Cost.LOW,
          detectionRisk: DetectionRisk.HIGH,
          timeHours: 4,
        },
        mitigations: ['WAF Rule'],
      });

      const json = leaf.toJSON() as any;
      assert.equal(json.id, 'L1');
      assert.equal(json.type, 'leaf');
      assert.equal(json.attributes.difficulty, 'MEDIUM');
      assert.equal(json.attributes.cost, 'LOW');
      assert.equal(json.attributes.detectionRisk, 'HIGH');
      assert.deepEqual(json.mitigations, ['WAF Rule']);
    });
  });

  describe('AttackTreeBuilder Fluent API', () => {
    it('constructs a nested attack tree hierarchy with OR and AND branches', () => {
      const tree = new AttackTreeBuilder('Test Tree', 'Test Description')
        .goal('G1', 'Compromise System')
          .orNode('S1', 'Gain Access')
            .attack('A1', 'Phishing', { difficulty: Difficulty.LOW }, ['Training'])
            .attack('A2', 'Brute Force', { difficulty: Difficulty.MEDIUM }, ['Rate Limit'])
          .end()
          .andNode('S2', 'Multi-Stage Infiltration')
            .attack('A3', 'Recon', { difficulty: Difficulty.TRIVIAL }, ['Obfuscation'])
            .attack('A4', 'Exploit', { difficulty: Difficulty.HIGH }, ['Patching'])
          .end()
        .build();

      assert.equal(tree.name, 'Test Tree');
      assert.equal(tree.root.children.length, 2);
      assert.equal(tree.getAllLeafAttacks().length, 4);
      assert.equal(tree.getUnmitigatedAttacks().length, 0);
    });

    it('throws error when building without root goal', () => {
      const builder = new AttackTreeBuilder('Empty');
      assert.throws(() => builder.build(), /No root goal defined/);
    });
  });

  describe('AttackPathAnalyzer & Metrics Traversal', () => {
    it('calculates all paths correctly through OR and AND nodes', () => {
      const tree = new AttackTreeBuilder('Path Test')
        .goal('ROOT', 'Root Goal')
          .orNode('OR_BRANCH', 'Alternative paths')
            .attack('A1', 'Attack 1', { difficulty: Difficulty.LOW })
            .attack('A2', 'Attack 2', { difficulty: Difficulty.HIGH })
          .end()
          .andNode('AND_BRANCH', 'Required combo')
            .attack('B1', 'Step 1', { difficulty: Difficulty.TRIVIAL })
            .attack('B2', 'Step 2', { difficulty: Difficulty.MEDIUM })
          .end()
        .build();

      const analyzer = new AttackPathAnalyzer(tree);
      const allPaths = analyzer.getAllPaths();

      // OR branch has 2 paths (A1, A2)
      // AND branch has 1 path requiring both (B1 + B2)
      // Total paths = 2 + 1 = 3 paths
      assert.equal(allPaths.length, 3);
    });

    it('evaluates mitigation coverage and detects open paths', () => {
      const tree = new AttackTreeBuilder('Coverage Test')
        .goal('ROOT', 'Root Goal')
          .orNode('OR_BRANCH', 'Sub branch')
            .attack('A1', 'Attack 1', {}, ['Mitigation 1'])
            .attack('A2', 'Attack 2', {})
          .end()
        .build();

      const analyzer = new AttackPathAnalyzer(tree);

      // Only A1 is mitigated
      const partialCoverage = analyzer.coverageAnalysis(new Set(['A1']));
      assert.equal(partialCoverage.totalPaths, 2);
      assert.equal(partialCoverage.blockedPaths, 1);
      assert.equal(partialCoverage.openPaths, 1);
      assert.equal(partialCoverage.coveragePercentage, 50);
      assert.equal(partialCoverage.openPathDetails.length, 1);

      // Both A1 and A2 mitigated
      const fullCoverage = analyzer.coverageAnalysis(new Set(['A1', 'A2']));
      assert.equal(fullCoverage.blockedPaths, 2);
      assert.equal(fullCoverage.openPaths, 0);
      assert.equal(fullCoverage.coveragePercentage, 100);
    });

    it('computes path metrics with difficulty, cost, and time', () => {
      const tree = new AttackTreeBuilder('Metrics Test')
        .goal('ROOT', 'Root')
          .attack('A1', 'Step 1', {
            difficulty: Difficulty.LOW,
            cost: Cost.FREE,
            detectionRisk: DetectionRisk.LOW,
            timeHours: 2,
          })
        .build();

      const analyzer = new AttackPathAnalyzer(tree);
      const paths = analyzer.getAllPaths();
      const metrics = analyzer.calculatePathMetrics(paths[0]);

      assert.equal(metrics.steps, 1);
      assert.equal(metrics.totalDifficulty, Difficulty.LOW);
      assert.equal(metrics.totalCost, Cost.FREE);
      assert.equal(metrics.totalTimeHours, 2);
    });
  });

  describe('MermaidExporter Syntax & Styling', () => {
    it('exports attack tree to valid Mermaid flowchart format with styling', () => {
      const tree = new AttackTreeBuilder('Export Test')
        .goal('ROOT', 'Root Goal')
          .attack('A1', 'Attack 1', { difficulty: Difficulty.TRIVIAL })
        .build();

      const exporter = new MermaidExporter(tree);
      const mermaid = exporter.export();

      assert.match(mermaid, /flowchart TD/);
      assert.match(mermaid, /Root Goal/);
      assert.match(mermaid, /Attack 1/);
      assert.match(mermaid, /fill:#ff6b6b/); // Trivial difficulty red color
    });
  });

  describe('Sriram & Co Production Attack Tree (buildSriramCoAttackTree)', () => {
    const tree = buildSriramCoAttackTree();
    const analyzer = new AttackPathAnalyzer(tree);

    it('builds canonical Sriram & Co attack tree with 15 critical attack vectors', () => {
      const leaves = tree.getAllLeafAttacks();
      assert.equal(leaves.length, 15);

      // Verify all leaf attacks have at least one documented mitigation
      const unmitigated = tree.getUnmitigatedAttacks();
      assert.equal(unmitigated.length, 0);
    });

    it('verifies 100% mitigation coverage against known threat paths', () => {
      const leafIds = tree.getAllLeafAttacks().map((l) => l.id);
      const activeMitigations = new Set(leafIds);

      const coverage = analyzer.coverageAnalysis(activeMitigations);
      assert.equal(coverage.totalPaths, 15);
      assert.equal(coverage.blockedPaths, 15);
      assert.equal(coverage.openPaths, 0);
      assert.equal(coverage.coveragePercentage, 100);
    });

    it('exports a valid JSON representation with complete tree metadata', () => {
      const jsonStr = tree.exportJSON();
      const parsed = JSON.parse(jsonStr);

      assert.equal(parsed.name, 'Sriram & Co E-Commerce Threat Model');
      assert.equal(parsed.root.children.length, 3);
    });
  });
});
