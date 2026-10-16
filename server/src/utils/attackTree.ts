export enum NodeType {
  OR = 'or',
  AND = 'and',
  LEAF = 'leaf',
}

export enum Difficulty {
  TRIVIAL = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  EXPERT = 5,
}

export enum Cost {
  FREE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  VERY_HIGH = 4,
}

export enum DetectionRisk {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CERTAIN = 4,
}

export interface AttackAttributes {
  difficulty: Difficulty;
  cost: Cost;
  detectionRisk: DetectionRisk;
  timeHours: number;
  requiresInsider?: boolean;
  requiresPhysical?: boolean;
}

export interface AttackNodeConfig {
  id: string;
  name: string;
  description?: string;
  nodeType: NodeType;
  attributes?: Partial<AttackAttributes>;
  mitigations?: string[];
  cveRefs?: string[];
}

export class AttackNode {
  public id: string;
  public name: string;
  public description: string;
  public nodeType: NodeType;
  public attributes: AttackAttributes;
  public children: AttackNode[] = [];
  public mitigations: string[];
  public cveRefs: string[];

  constructor(config: AttackNodeConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description || '';
    this.nodeType = config.nodeType;
    this.mitigations = config.mitigations || [];
    this.cveRefs = config.cveRefs || [];

    this.attributes = {
      difficulty: config.attributes?.difficulty ?? Difficulty.MEDIUM,
      cost: config.attributes?.cost ?? Cost.MEDIUM,
      detectionRisk: config.attributes?.detectionRisk ?? DetectionRisk.MEDIUM,
      timeHours: config.attributes?.timeHours ?? 8.0,
      requiresInsider: config.attributes?.requiresInsider ?? false,
      requiresPhysical: config.attributes?.requiresPhysical ?? false,
    };
  }

  addChild(child: AttackNode): void {
    this.children.push(child);
  }

  calculatePathDifficulty(): number {
    if (this.nodeType === NodeType.LEAF) {
      return this.attributes.difficulty;
    }
    if (this.children.length === 0) return 0;

    const childDifficulties = this.children.map((c) => c.calculatePathDifficulty());
    if (this.nodeType === NodeType.OR) {
      return Math.min(...childDifficulties);
    }
    return Math.max(...childDifficulties);
  }

  calculatePathCost(): number {
    if (this.nodeType === NodeType.LEAF) {
      return this.attributes.cost;
    }
    if (this.children.length === 0) return 0;

    const childCosts = this.children.map((c) => c.calculatePathCost());
    if (this.nodeType === NodeType.OR) {
      return Math.min(...childCosts);
    }
    return childCosts.reduce((a, b) => a + b, 0);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.nodeType,
      attributes: {
        difficulty: Difficulty[this.attributes.difficulty],
        cost: Cost[this.attributes.cost],
        detectionRisk: DetectionRisk[this.attributes.detectionRisk],
        timeHours: this.attributes.timeHours,
      },
      mitigations: this.mitigations,
      children: this.children.map((c) => c.toJSON()),
    };
  }
}

export class AttackTree {
  public name: string;
  public description: string;
  public root: AttackNode;
  public version: string;

  constructor(name: string, description: string, root: AttackNode, version = '1.0') {
    this.name = name;
    this.description = description;
    this.root = root;
    this.version = version;
  }

  getAllLeafAttacks(): AttackNode[] {
    const leaves: AttackNode[] = [];
    const collect = (node: AttackNode) => {
      if (node.nodeType === NodeType.LEAF) {
        leaves.push(node);
      }
      for (const child of node.children) {
        collect(child);
      }
    };
    collect(this.root);
    return leaves;
  }

  getUnmitigatedAttacks(): AttackNode[] {
    return this.getAllLeafAttacks().filter((node) => node.mitigations.length === 0);
  }

  exportJSON(): string {
    return JSON.stringify(
      {
        name: this.name,
        description: this.description,
        version: this.version,
        root: this.root.toJSON(),
      },
      null,
      2
    );
  }
}

export class AttackTreeBuilder {
  private name: string;
  private description: string;
  private nodeStack: AttackNode[] = [];
  private root: AttackNode | null = null;

  constructor(name: string, description = '') {
    this.name = name;
    this.description = description;
  }

  goal(id: string, name: string, description = ''): this {
    this.root = new AttackNode({
      id,
      name,
      description,
      nodeType: NodeType.OR,
    });
    this.nodeStack = [this.root];
    return this;
  }

  orNode(id: string, name: string, description = ''): this {
    const node = new AttackNode({
      id,
      name,
      description,
      nodeType: NodeType.OR,
    });
    this.current().addChild(node);
    this.nodeStack.push(node);
    return this;
  }

  andNode(id: string, name: string, description = ''): this {
    const node = new AttackNode({
      id,
      name,
      description,
      nodeType: NodeType.AND,
    });
    this.current().addChild(node);
    this.nodeStack.push(node);
    return this;
  }

  attack(
    id: string,
    name: string,
    attributes?: Partial<AttackAttributes>,
    mitigations?: string[],
    description = ''
  ): this {
    const node = new AttackNode({
      id,
      name,
      description,
      nodeType: NodeType.LEAF,
      attributes,
      mitigations,
    });
    this.current().addChild(node);
    return this;
  }

  end(): this {
    if (this.nodeStack.length > 1) {
      this.nodeStack.pop();
    }
    return this;
  }

  build(): AttackTree {
    if (!this.root) {
      throw new Error('No root goal defined in AttackTreeBuilder');
    }
    return new AttackTree(this.name, this.description, this.root);
  }

  private current(): AttackNode {
    if (this.nodeStack.length === 0) {
      throw new Error('No active node on builder stack');
    }
    return this.nodeStack[this.nodeStack.length - 1];
  }
}

export interface PathMetrics {
  steps: number;
  totalDifficulty: number;
  avgDifficulty: number;
  totalCost: number;
  totalTimeHours: number;
  maxDetectionRisk: number;
  requiresInsider: boolean;
  requiresPhysical: boolean;
}

export interface CoverageReport {
  totalPaths: number;
  blockedPaths: number;
  openPaths: number;
  coveragePercentage: number;
  openPathDetails: Array<{ path: string[]; metrics: PathMetrics }>;
}

export class AttackPathAnalyzer {
  private tree: AttackTree;

  constructor(tree: AttackTree) {
    this.tree = tree;
  }

  getAllPaths(): AttackNode[][] {
    const paths: AttackNode[][] = [];
    this.collectPaths(this.tree.root, [], paths);
    return paths;
  }

  private collectPaths(
    node: AttackNode,
    currentPath: AttackNode[],
    allPaths: AttackNode[][]
  ): void {
    const nextPath = [...currentPath, node];

    if (node.nodeType === NodeType.LEAF || node.children.length === 0) {
      allPaths.push(nextPath);
      return;
    }

    if (node.nodeType === NodeType.OR) {
      for (const child of node.children) {
        this.collectPaths(child, nextPath, allPaths);
      }
    } else {
      // AND Node: Cartesian product of all children paths
      const childPathsGroups: AttackNode[][][] = [];
      for (const child of node.children) {
        const subPaths: AttackNode[][] = [];
        this.collectPaths(child, [], subPaths);
        childPathsGroups.push(subPaths);
      }

      const combined = this.combineAndPaths(childPathsGroups);
      for (const combo of combined) {
        allPaths.push([...nextPath, ...combo]);
      }
    }
  }

  private combineAndPaths(childPathsGroups: AttackNode[][][]): AttackNode[][] {
    if (childPathsGroups.length === 0) return [[]];
    if (childPathsGroups.length === 1) return childPathsGroups[0];

    let result: AttackNode[][] = [[]];
    for (const group of childPathsGroups) {
      const nextResult: AttackNode[][] = [];
      for (const existing of result) {
        for (const path of group) {
          nextResult.push([...existing, ...path]);
        }
      }
      result = nextResult;
    }
    return result;
  }

  calculatePathMetrics(path: AttackNode[]): PathMetrics {
    const leaves = path.filter((n) => n.nodeType === NodeType.LEAF);
    const totalDifficulty = leaves.reduce((sum, n) => sum + n.attributes.difficulty, 0);
    const totalCost = leaves.reduce((sum, n) => sum + n.attributes.cost, 0);
    const totalTimeHours = leaves.reduce((sum, n) => sum + n.attributes.timeHours, 0);
    const maxDetectionRisk = leaves.reduce(
      (max, n) => Math.max(max, n.attributes.detectionRisk),
      0
    );

    return {
      steps: leaves.length,
      totalDifficulty,
      avgDifficulty: leaves.length > 0 ? totalDifficulty / leaves.length : 0,
      totalCost,
      totalTimeHours,
      maxDetectionRisk,
      requiresInsider: leaves.some((n) => n.attributes.requiresInsider),
      requiresPhysical: leaves.some((n) => n.attributes.requiresPhysical),
    };
  }

  coverageAnalysis(mitigatedAttackIds: Set<string>): CoverageReport {
    const allPaths = this.getAllPaths();
    const blockedPaths: AttackNode[][] = [];
    const openPaths: AttackNode[][] = [];

    for (const path of allPaths) {
      const leafIds = path.filter((n) => n.nodeType === NodeType.LEAF).map((n) => n.id);
      const isBlocked = leafIds.some((id) => mitigatedAttackIds.has(id));
      if (isBlocked) {
        blockedPaths.push(path);
      } else {
        openPaths.push(path);
      }
    }

    const total = allPaths.length;
    const coveragePercentage = total > 0 ? (blockedPaths.length / total) * 100 : 100;

    return {
      totalPaths: total,
      blockedPaths: blockedPaths.length,
      openPaths: openPaths.length,
      coveragePercentage,
      openPathDetails: openPaths.slice(0, 5).map((p) => ({
        path: p.map((n) => n.name),
        metrics: this.calculatePathMetrics(p),
      })),
    };
  }
}

export class MermaidExporter {
  private tree: AttackTree;
  private lines: string[] = [];
  private nodeCounter = 0;

  constructor(tree: AttackTree) {
    this.tree = tree;
  }

  export(): string {
    this.lines = ['flowchart TD'];
    this.exportNode(this.tree.root, null);
    return this.lines.join('\n');
  }

  private exportNode(node: AttackNode, parentId: string | null): string {
    const nodeId = `N${this.nodeCounter++}`;
    const cleanName = node.name.replace(/["\(\)\[\]\{\}]/g, '');

    let shape = '';
    if (node.nodeType === NodeType.OR) {
      shape = `${nodeId}(("${cleanName}"))`;
    } else if (node.nodeType === NodeType.AND) {
      shape = `${nodeId}["${cleanName}"]`;
    } else {
      shape = `${nodeId}[/"${cleanName}"/]`;
      const color = this.getLeafStyle(node);
      this.lines.push(`    style ${nodeId} ${color}`);
    }

    this.lines.push(`    ${shape}`);

    if (parentId) {
      const connector = node.nodeType === NodeType.AND ? '==>' : '-->';
      this.lines.push(`    ${parentId} ${connector} ${nodeId}`);
    }

    for (const child of node.children) {
      this.exportNode(child, nodeId);
    }

    return nodeId;
  }

  private getLeafStyle(node: AttackNode): string {
    const styles: Record<Difficulty, string> = {
      [Difficulty.TRIVIAL]: 'fill:#ff6b6b,color:#fff',
      [Difficulty.LOW]: 'fill:#ffa06b,color:#000',
      [Difficulty.MEDIUM]: 'fill:#ffd93d,color:#000',
      [Difficulty.HIGH]: 'fill:#6bcb77,color:#000',
      [Difficulty.EXPERT]: 'fill:#4d96ff,color:#fff',
    };
    return styles[node.attributes.difficulty] || 'fill:#cccccc';
  }
}

/**
 * Builds the canonical Sriram & Co E-Commerce Attack Tree
 */
export function buildSriramCoAttackTree(): AttackTree {
  return new AttackTreeBuilder(
    'Sriram & Co E-Commerce Threat Model',
    'Comprehensive threat vectors and attack tree analysis across all payment, admin, auth, and data endpoints'
  )
    .goal('ROOT', 'Compromise Sriram & Co Platform')
    // Sub-Tree 1: Financial Fraud
    .orNode('G1', 'Procure Products Without Full Legitimate Payment')
      .orNode('S1.1', 'Manipulate Order Pricing')
        .attack(
          'A1.1',
          'Tamper Cart Price in Client Browser',
          { difficulty: Difficulty.TRIVIAL, cost: Cost.FREE, detectionRisk: DetectionRisk.HIGH },
          ['Server-side DB price recalculation in orderRoutes.ts']
        )
        .attack(
          'A1.2',
          'Inject Zero / Negative Order Total',
          { difficulty: Difficulty.LOW, cost: Cost.FREE, detectionRisk: DetectionRisk.CERTAIN },
          ['Zod validation rejects total <= 0 with 400 Bad Request']
        )
        .attack(
          'A1.3',
          'Purchase Out-of-Stock Product',
          { difficulty: Difficulty.LOW, cost: Cost.FREE, detectionRisk: DetectionRisk.CERTAIN },
          ['Catalog stock state validation in orderRoutes.ts']
        )
      .end()
      .orNode('S1.2', 'Forge Razorpay Payment Verification')
        .attack(
          'A1.4',
          'Fabricate Fake Razorpay HMAC Signature',
          { difficulty: Difficulty.EXPERT, cost: Cost.HIGH, detectionRisk: DetectionRisk.CERTAIN },
          ['crypto.timingSafeEqual comparison with server secret']
        )
        .attack(
          'A1.5',
          'Swap Legitimate Payment ID from Cheap Order',
          { difficulty: Difficulty.MEDIUM, cost: Cost.LOW, detectionRisk: DetectionRisk.CERTAIN },
          ['Order ID binding verification against Razorpay response']
        )
        .attack(
          'A1.6',
          'Concurrent Race Condition on Verify Endpoint',
          { difficulty: Difficulty.HIGH, cost: Cost.FREE, detectionRisk: DetectionRisk.HIGH },
          ['Atomic payment status guard prevents duplicate state change']
        )
      .end()
    .end()
    // Sub-Tree 2: Administrative Account Takeover
    .orNode('G2', 'Administrative Account Takeover')
      .orNode('S2.1', 'Exploit OAuth Authentication Flow')
        .attack(
          'B2.1',
          'Spoof Google OAuth with Raw Admin Email',
          { difficulty: Difficulty.TRIVIAL, cost: Cost.FREE, detectionRisk: DetectionRisk.CERTAIN },
          ['Google Identity Toolkit cryptographically verifies ID token']
        )
        .attack(
          'B2.2',
          'Present Expired / Fabricated Google Token',
          { difficulty: Difficulty.MEDIUM, cost: Cost.FREE, detectionRisk: DetectionRisk.CERTAIN },
          ['Google API rejects invalid tokens with 401 INVALID_OAUTH_TOKEN']
        )
      .end()
      .orNode('S2.2', 'Brute Force & Privilege Escalation')
        .attack(
          'B2.3',
          'High-Velocity Admin Password Brute Force',
          { difficulty: Difficulty.LOW, cost: Cost.LOW, detectionRisk: DetectionRisk.HIGH },
          ['express-rate-limit caps at 10 requests / 15 mins']
        )
        .attack(
          'B2.4',
          'Pass role: admin in Registration Payload',
          { difficulty: Difficulty.TRIVIAL, cost: Cost.FREE, detectionRisk: DetectionRisk.HIGH },
          ['Server hardcodes role: customer on customer registration']
        )
        .attack(
          'B2.5',
          'Access Admin Routes with Customer Token',
          { difficulty: Difficulty.LOW, cost: Cost.FREE, detectionRisk: DetectionRisk.HIGH },
          ['adminOnly middleware rejects non-admins with 403 Forbidden']
        )
      .end()
    .end()
    // Sub-Tree 3: Customer PII Exfiltration
    .orNode('G3', 'Bulk Customer PII Harvesting')
      .orNode('S3.1', 'Harvest via Order Tracking')
        .attack(
          'C3.1',
          'Enumerate Sequential Order Numbers',
          { difficulty: Difficulty.TRIVIAL, cost: Cost.FREE, detectionRisk: DetectionRisk.HIGH },
          ['Replaced sequential IDs with random hex entropy SRC-XXXXXXXX']
        )
        .attack(
          'C3.2',
          'Scrape PII from Public Guest Tracking',
          { difficulty: Difficulty.LOW, cost: Cost.FREE, detectionRisk: DetectionRisk.MEDIUM },
          ['Mask phone number and omit delivery street address for unauthenticated queries']
        )
      .end()
      .orNode('S3.2', 'Cross-Origin Scraping & Denial of Service')
        .attack(
          'C3.3',
          'ReDoS Catastrophic Backtracking on Search',
          { difficulty: Difficulty.MEDIUM, cost: Cost.FREE, detectionRisk: DetectionRisk.HIGH },
          ['Regex metacharacter escaping + 50-character query limit']
        )
        .attack(
          'C3.4',
          'Cross-Origin API Scraping',
          { difficulty: Difficulty.LOW, cost: Cost.FREE, detectionRisk: DetectionRisk.HIGH },
          ['Strict regex CORS allowlist rejects unapproved origins']
        )
      .end()
    .end()
    .build();
}
