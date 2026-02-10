import { CloudNodeType } from '@/types/diagram';

export interface ComponentReference {
  summary: string;
  keyConcepts: { term: string; description: string }[];
  learnMoreUrl?: string;
}

export const COMPONENT_REFERENCE: Partial<Record<CloudNodeType, ComponentReference>> = {
  loadBalancer: {
    summary:
      'Distributes incoming traffic across multiple servers to improve availability and throughput.',
    keyConcepts: [
      {
        term: 'L4 vs L7',
        description:
          'L4 balancers route by IP/port (fast, protocol-agnostic). L7 balancers inspect HTTP headers, cookies, or URLs to make smarter routing decisions.',
      },
      {
        term: 'Algorithms',
        description:
          'Round Robin cycles through servers evenly. Least Connections sends traffic to the least-busy server. Consistent Hashing pins keys to servers, minimizing re-mapping when servers change.',
      },
      {
        term: 'Health checks',
        description:
          'Periodic probes (TCP, HTTP, or custom) that detect unhealthy backends and remove them from the pool until they recover.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Load_balancing_(computing)',
  },

  database: {
    summary:
      'Persistent data store that supports structured queries, transactions, and durable writes.',
    keyConcepts: [
      {
        term: 'ACID vs BASE',
        description:
          'ACID (Atomicity, Consistency, Isolation, Durability) guarantees strict correctness. BASE (Basically Available, Soft-state, Eventually consistent) trades consistency for availability and partition tolerance.',
      },
      {
        term: 'B-Trees vs LSM Trees',
        description:
          'B-Trees optimize for reads with in-place updates (e.g., PostgreSQL). LSM Trees batch writes into sorted runs for high write throughput (e.g., Cassandra, RocksDB).',
      },
      {
        term: 'Partitioning',
        description:
          'Horizontal partitioning (sharding) splits data across nodes by key range or hash. Vertical partitioning separates columns into different stores.',
      },
      {
        term: 'Write-Ahead Log (WAL)',
        description:
          'Appends every change to a sequential log before applying it, ensuring crash recovery without data loss.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Database',
  },

  cache: {
    summary:
      'In-memory key-value store that reduces latency and load on downstream data stores.',
    keyConcepts: [
      {
        term: 'Write strategies',
        description:
          'Write-through writes to cache and DB simultaneously (consistent but slower). Write-back writes to cache first, flushing to DB later (fast but risks data loss). Write-around skips the cache on writes, only caching on reads.',
      },
      {
        term: 'Eviction policies',
        description:
          'LRU evicts the least recently used entry. LFU evicts the least frequently used. TTL expires entries after a fixed duration.',
      },
      {
        term: 'Cache stampede',
        description:
          'When a popular key expires and many requests simultaneously hit the backend. Mitigated with locking, request coalescing, or staggered TTLs.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Cache_(computing)',
  },

  queue: {
    summary:
      'Buffers messages between producers and consumers, decoupling services and absorbing traffic spikes.',
    keyConcepts: [
      {
        term: 'FIFO vs Priority',
        description:
          'FIFO queues deliver messages in strict order. Priority queues let high-priority messages jump ahead, useful for SLA-differentiated workloads.',
      },
      {
        term: 'Dead letter queue',
        description:
          'A sidecar queue that captures messages that fail processing after a configured number of retries, enabling debugging without blocking the main queue.',
      },
      {
        term: 'Delivery guarantees',
        description:
          'At-most-once may lose messages. At-least-once may deliver duplicates (consumers must be idempotent). Exactly-once requires coordination (e.g., transactional outbox).',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Message_queue',
  },

  eventStream: {
    summary:
      'Ordered, append-only log of events that supports real-time consumption and replay.',
    keyConcepts: [
      {
        term: 'Partitioning',
        description:
          'Events are spread across partitions by key, enabling parallel consumption while preserving per-key ordering.',
      },
      {
        term: 'Consumer groups',
        description:
          'A set of consumers that share partitions so each event is processed by exactly one member, enabling horizontal scaling.',
      },
      {
        term: 'Offset management',
        description:
          'Consumers track their position (offset) in the log. Committing offsets enables resuming from the last processed event after a restart.',
      },
      {
        term: 'Log compaction',
        description:
          'Retains only the latest value per key, turning the stream into a changelog that new consumers can replay without processing every historical event.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Event-driven_architecture',
  },

  service: {
    summary:
      'A deployable unit of business logic that exposes APIs and processes requests.',
    keyConcepts: [
      {
        term: 'Monolith vs Microservices',
        description:
          'A monolith bundles all logic in one deployment (simpler ops, harder to scale independently). Microservices split by domain boundary (independent deployment but more operational complexity).',
      },
      {
        term: 'Stateless design',
        description:
          'Keeping services stateless allows any instance to handle any request, making horizontal scaling and failover straightforward.',
      },
      {
        term: 'Service discovery',
        description:
          'Mechanism for services to find each other dynamically (DNS-based, sidecar proxy, or service registry like Consul or Eureka).',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Microservices',
  },

  serverlessFunction: {
    summary:
      'Event-driven compute that runs code on demand without managing servers, scaling to zero when idle.',
    keyConcepts: [
      {
        term: 'Cold start',
        description:
          'Latency penalty when a new execution environment is provisioned. Mitigated with provisioned concurrency or keeping functions warm.',
      },
      {
        term: 'Execution limits',
        description:
          'Functions have time (e.g., 15 min), memory, and payload size limits. Long-running or stateful work should use other compute models.',
      },
      {
        term: 'Event sources',
        description:
          'Functions are triggered by events: HTTP requests, queue messages, storage changes, schedules, or stream records.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Serverless_computing',
  },

  container: {
    summary:
      'Lightweight, isolated runtime for packaging applications with their dependencies.',
    keyConcepts: [
      {
        term: 'Orchestration',
        description:
          'Platforms like Kubernetes or ECS manage container placement, scaling, health checks, and rolling updates across a cluster.',
      },
      {
        term: 'Images & layers',
        description:
          'Container images are built from layered filesystems. Sharing base layers reduces storage and speeds up pulls.',
      },
      {
        term: 'Sidecar pattern',
        description:
          'Running a helper container alongside the main container (e.g., for logging, proxying, or config injection) without modifying application code.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Containerization_(computing)',
  },

  client: {
    summary:
      'The user-facing entry point that initiates requests to the system.',
    keyConcepts: [
      {
        term: 'Thin vs Thick client',
        description:
          'Thin clients rely on the server for logic and rendering. Thick clients (SPAs, native apps) handle more logic locally, reducing round-trips but increasing update complexity.',
      },
      {
        term: 'Optimistic updates',
        description:
          'Updating the UI immediately before the server confirms, then reconciling. Improves perceived performance but requires rollback handling on failure.',
      },
      {
        term: 'Retry & backoff',
        description:
          'Clients should retry transient failures with exponential backoff and jitter to avoid thundering-herd effects on the backend.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Client%E2%80%93server_model',
  },

  apiGateway: {
    summary:
      'Single entry point that routes, authenticates, and rate-limits API requests before they reach backend services.',
    keyConcepts: [
      {
        term: 'Rate limiting',
        description:
          'Controls request throughput per client or API key using algorithms like token bucket or sliding window to protect backends from overload.',
      },
      {
        term: 'Authentication & authorization',
        description:
          'Centralizes identity verification (JWT, OAuth, API keys) so individual services don\'t each need to implement auth logic.',
      },
      {
        term: 'Request transformation',
        description:
          'Can aggregate multiple backend calls into a single client response (BFF pattern), translate protocols, or version APIs transparently.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/API_management',
  },

  cdn: {
    summary:
      'Geographically distributed edge network that caches and serves content close to users.',
    keyConcepts: [
      {
        term: 'Cache invalidation',
        description:
          'Strategies to expire stale content: TTL-based expiry, purge APIs for on-demand invalidation, or versioned URLs (cache-busting).',
      },
      {
        term: 'Origin shield',
        description:
          'An intermediate cache layer between edge PoPs and the origin server that reduces origin load by consolidating cache fills.',
      },
      {
        term: 'Edge compute',
        description:
          'Running logic at CDN edge nodes (e.g., Cloudflare Workers) for personalization, A/B testing, or auth checks without round-tripping to the origin.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Content_delivery_network',
  },

  blobStorage: {
    summary:
      'Object storage for unstructured data like images, videos, backups, and logs.',
    keyConcepts: [
      {
        term: 'Storage tiers',
        description:
          'Hot storage for frequent access, cool/warm for infrequent, and archive/cold for rarely accessed data. Tiering balances cost against retrieval latency.',
      },
      {
        term: 'Presigned URLs',
        description:
          'Time-limited URLs that grant temporary access to private objects without exposing credentials, commonly used for direct client uploads.',
      },
      {
        term: 'Replication',
        description:
          'Same-region replication guards against hardware failure. Cross-region replication adds disaster recovery but increases cost and introduces replication lag.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Object_storage',
  },

  workflow: {
    summary:
      'Coordinates multi-step processes across services, handling retries, compensation, and long-running operations.',
    keyConcepts: [
      {
        term: 'Orchestration vs Choreography',
        description:
          'Orchestration uses a central coordinator (e.g., Step Functions, Temporal). Choreography lets services react to events independently — simpler per service but harder to trace end-to-end.',
      },
      {
        term: 'Saga pattern',
        description:
          'A sequence of local transactions with compensating actions. If step N fails, steps N-1 through 1 are rolled back via compensation, achieving eventual consistency without distributed locks.',
      },
      {
        term: 'Idempotency',
        description:
          'Ensuring that re-executing a workflow step produces the same result, critical for safe retries after partial failures.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Workflow',
  },

  scheduler: {
    summary:
      'Triggers jobs at specified times or intervals using cron expressions or delay-based scheduling.',
    keyConcepts: [
      {
        term: 'Cron expressions',
        description:
          'Compact syntax (minute, hour, day, month, weekday) for defining recurring schedules. Supports ranges, lists, and step values.',
      },
      {
        term: 'At-most-once vs at-least-once',
        description:
          'Single-node schedulers risk missed executions on failure. Distributed schedulers (with leader election or DB locking) ensure at-least-once execution.',
      },
      {
        term: 'Backpressure',
        description:
          'When scheduled jobs produce work faster than downstream can consume, a queue or rate limiter between the scheduler and workers prevents overload.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Job_scheduler',
  },

  notification: {
    summary:
      'Delivers alerts and messages to users across channels like push, email, SMS, and webhooks.',
    keyConcepts: [
      {
        term: 'Fan-out',
        description:
          'A single event may trigger notifications to millions of recipients. Fan-out strategies (on-write vs on-read) trade storage for delivery latency.',
      },
      {
        term: 'Delivery tracking',
        description:
          'Tracking sent, delivered, opened, and clicked states per message enables analytics and retry logic for failed deliveries.',
      },
      {
        term: 'Channel preferences',
        description:
          'Users opt into channels and quiet hours. A preference service routes each notification to the right channel(s) and suppresses duplicates.',
      },
    ],
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Push_technology',
  },
};
