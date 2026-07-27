// ---------------------------------------------------------------------------
// OpenAPI 3.0 specification — statically defined so it is fully type-checked
// and does not require JSDoc scanning at startup.
// Served at GET /api-docs by swagger-ui-express (mounted in app.ts).
// ---------------------------------------------------------------------------
import { OpenAPIV3 } from 'openapi-types';

// ---------------------------------------------------------------------------
// Reusable schema components
// ---------------------------------------------------------------------------
const components: OpenAPIV3.ComponentsObject = {
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT access token obtained from POST /api/v1/auth/login',
    },
  },
  schemas: {
    // ── Shared primitives ──────────────────────────────────────────────────
    MonetaryAmount: {
      type: 'string',
      description: 'Decimal amount as string to preserve precision (e.g. "100.50")',
      example: '100.50',
    },
    Timestamp: {
      type: 'string',
      format: 'date-time',
      example: '2024-01-15T10:30:00.000Z',
    },
    UuidV4: {
      type: 'string',
      format: 'uuid',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    },
    PayflowId: {
      type: 'string',
      description: 'Unique PayFlow identifier in the form <handle>@payflow',
      example: 'alice1234@payflow',
    },

    // ── Error envelope ─────────────────────────────────────────────────────
    ErrorResponse: {
      type: 'object',
      required: ['status', 'message'],
      properties: {
        status: { type: 'integer', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
      },
    },

    // ── Auth ───────────────────────────────────────────────────────────────
    RegisterRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'alice@example.com' },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 128,
          example: 'S3cr3tP@ss!',
        },
      },
    },
    RegisterResponse: {
      type: 'object',
      required: ['id', 'email', 'payflowId', 'createdAt'],
      properties: {
        id: { $ref: '#/components/schemas/UuidV4' },
        email: { type: 'string', format: 'email', example: 'alice@example.com' },
        payflowId: { $ref: '#/components/schemas/PayflowId' },
        createdAt: { $ref: '#/components/schemas/Timestamp' },
      },
    },
    LoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'alice@example.com' },
        password: { type: 'string', example: 'S3cr3tP@ss!' },
      },
    },
    TokenPair: {
      type: 'object',
      required: ['accessToken', 'refreshToken'],
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGci...' },
        refreshToken: { type: 'string', example: 'eyJhbGci...' },
      },
    },
    RefreshRequest: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string', example: 'eyJhbGci...' },
      },
    },
    LogoutRequest: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { $ref: '#/components/schemas/UuidV4' },
      },
    },
    ForgotPasswordRequest: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email', example: 'alice@example.com' },
      },
    },
    ResetPasswordRequest: {
      type: 'object',
      required: ['token', 'password'],
      properties: {
        token: {
          type: 'string',
          description: 'Raw 64-character hex reset token from the email link',
          example: 'a3f1c8...64hex...chars',
        },
        password: {
          type: 'string',
          minLength: 8,
          maxLength: 128,
          description: 'New password (min 8 characters)',
          example: 'NewP@ssw0rd!',
        },
      },
    },
    GenericMessageResponse: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', example: 'Operation completed successfully.' },
      },
    },

    // ── Wallet ────────────────────────────────────────────────────────────
    WalletResponse: {
      type: 'object',
      required: ['id', 'userId', 'balance', 'createdAt', 'updatedAt'],
      properties: {
        id: { $ref: '#/components/schemas/UuidV4' },
        userId: { $ref: '#/components/schemas/UuidV4' },
        balance: { $ref: '#/components/schemas/MonetaryAmount' },
        createdAt: { $ref: '#/components/schemas/Timestamp' },
        updatedAt: { $ref: '#/components/schemas/Timestamp' },
      },
    },
    AmountRequest: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: {
          type: 'number',
          multipleOf: 0.01,
          minimum: 0.01,
          example: 50.00,
          description: 'Positive monetary amount with at most 2 decimal places',
        },
      },
    },

    // ── Transactions ──────────────────────────────────────────────────────
    TransferRequest: {
      type: 'object',
      required: ['receiverPayflowId', 'amount'],
      properties: {
        receiverPayflowId: { $ref: '#/components/schemas/PayflowId' },
        amount: {
          type: 'number',
          multipleOf: 0.01,
          minimum: 0.01,
          example: 25.00,
        },
        note: {
          type: 'string',
          description: 'Optional memo / description',
          example: 'Splitting the bill',
        },
      },
    },
    TransferResponse: {
      type: 'object',
      required: ['transactionId', 'senderBalance', 'receiverBalance', 'receiverName', 'receiverPayflowId'],
      properties: {
        transactionId: { $ref: '#/components/schemas/UuidV4' },
        senderBalance: { $ref: '#/components/schemas/MonetaryAmount' },
        receiverBalance: { $ref: '#/components/schemas/MonetaryAmount' },
        receiverName: { type: 'string', example: 'bob5678@payflow' },
        receiverPayflowId: { $ref: '#/components/schemas/PayflowId' },
      },
    },
    TransactionHistoryItem: {
      type: 'object',
      required: ['id', 'amount', 'status', 'createdAt', 'senderPayflowId', 'receiverPayflowId', 'senderEmail', 'receiverEmail'],
      properties: {
        id: { $ref: '#/components/schemas/UuidV4' },
        amount: { $ref: '#/components/schemas/MonetaryAmount' },
        status: { type: 'string', enum: ['COMPLETED', 'FAILED'], example: 'COMPLETED' },
        note: { type: 'string', nullable: true, example: 'Rent payment' },
        createdAt: { $ref: '#/components/schemas/Timestamp' },
        senderPayflowId: { $ref: '#/components/schemas/PayflowId' },
        receiverPayflowId: { $ref: '#/components/schemas/PayflowId' },
        senderEmail: { type: 'string', format: 'email', example: 'alice@example.com' },
        receiverEmail: { type: 'string', format: 'email', example: 'bob@example.com' },
      },
    },
    DashboardResponse: {
      type: 'object',
      required: [
        'balance', 'totalSent', 'totalReceived', 'recentTransactions',
        'monthlySpending', 'moneyReceivedThisMonth', 'moneySentToday',
        'largestTransaction', 'transactionCount',
      ],
      properties: {
        balance: { $ref: '#/components/schemas/MonetaryAmount' },
        totalSent: { $ref: '#/components/schemas/MonetaryAmount' },
        totalReceived: { $ref: '#/components/schemas/MonetaryAmount' },
        recentTransactions: {
          type: 'array',
          items: { $ref: '#/components/schemas/TransactionHistoryItem' },
        },
        monthlySpending: { $ref: '#/components/schemas/MonetaryAmount' },
        moneyReceivedThisMonth: { $ref: '#/components/schemas/MonetaryAmount' },
        moneySentToday: { $ref: '#/components/schemas/MonetaryAmount' },
        largestTransaction: {
          nullable: true,
          allOf: [{ $ref: '#/components/schemas/TransactionHistoryItem' }],
        },
        transactionCount: { type: 'integer', example: 42 },
      },
    },

    // ── Users / discovery ─────────────────────────────────────────────────
    PublicProfile: {
      type: 'object',
      required: ['displayName', 'payflowId', 'avatar'],
      properties: {
        displayName: { type: 'string', example: 'alice1234' },
        payflowId: { $ref: '#/components/schemas/PayflowId' },
        avatar: { type: 'string', nullable: true, example: null },
      },
    },
    RecipientProfile: {
      type: 'object',
      required: ['displayName', 'payflowId', 'avatar', 'walletExists'],
      properties: {
        displayName: { type: 'string', example: 'bob5678' },
        payflowId: { $ref: '#/components/schemas/PayflowId' },
        avatar: { type: 'string', nullable: true, example: null },
        walletExists: { type: 'boolean', example: true },
      },
    },
    RecentContact: {
      type: 'object',
      required: ['displayName', 'payflowId', 'avatar', 'lastInteractionAt', 'transactionCount'],
      properties: {
        displayName: { type: 'string', example: 'charlie9012' },
        payflowId: { $ref: '#/components/schemas/PayflowId' },
        avatar: { type: 'string', nullable: true, example: null },
        lastInteractionAt: { $ref: '#/components/schemas/Timestamp' },
        transactionCount: { type: 'integer', example: 3 },
      },
    },

    // ── Health ────────────────────────────────────────────────────────────
    HealthResponse: {
      type: 'object',
      required: ['probe', 'status', 'service', 'timestamp'],
      properties: {
        probe: { type: 'string', enum: ['liveness'], example: 'liveness' },
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'auth-service' },
        timestamp: { $ref: '#/components/schemas/Timestamp' },
      },
    },
    ReadinessResponse: {
      type: 'object',
      required: ['probe', 'status', 'service', 'timestamp', 'checks'],
      properties: {
        probe: { type: 'string', enum: ['readiness'], example: 'readiness' },
        status: { type: 'string', example: 'ready' },
        service: { type: 'string', example: 'auth-service' },
        timestamp: { $ref: '#/components/schemas/Timestamp' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'boolean', example: false },
            redis: { type: 'boolean', example: false },
            rabbitmq: { type: 'boolean', example: false },
          },
        },
      },
    },
  },
  responses: {
    Unauthorized: {
      description: 'Missing or invalid JWT token',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
    Forbidden: {
      description: 'Authenticated but not permitted to access this resource',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
    NotFound: {
      description: 'Resource not found',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
    BadRequest: {
      description: 'Validation failure',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
    Conflict: {
      description: 'Resource already exists',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
    UnprocessableEntity: {
      description: 'Business rule violation (e.g. insufficient balance)',
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Path definitions
// ---------------------------------------------------------------------------
const paths: OpenAPIV3.PathsObject = {
  // ── Health ────────────────────────────────────────────────────────────────
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Liveness probe',
      description: 'Returns 200 while the process is running. No dependency checks.',
      responses: {
        '200': {
          description: 'Service is alive',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
        },
      },
    },
  },
  '/ready': {
    get: {
      tags: ['Health'],
      summary: 'Readiness probe',
      description: 'Returns dependency check results. Currently all checks return false until infrastructure clients are wired.',
      responses: {
        '200': {
          description: 'Readiness status',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ReadinessResponse' } } },
        },
      },
    },
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  '/api/v1/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description: 'Creates a new user account and returns the user profile. A unique PayFlow ID is generated automatically.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
      },
      responses: {
        '201': {
          description: 'User created successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterResponse' } } },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/api/v1/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      description: 'Authenticates credentials and returns a JWT access token and refresh token.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
      },
      responses: {
        '200': {
          description: 'Login successful',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenPair' } } },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Refresh tokens',
      description: 'Exchanges a valid refresh token for a new access token and refresh token pair.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } },
      },
      responses: {
        '200': {
          description: 'Tokens refreshed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenPair' } } },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout',
      description: 'Invalidates the current refresh token. The user must supply their userId in the request body.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LogoutRequest' } } },
      },
      responses: {
        '204': { description: 'Logged out successfully' },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Request password reset',
      description:
        'Accepts an email address and, if an account exists, sends a password-reset link to that address. ' +
        'Always returns the same generic 200 response to prevent email enumeration. ' +
        'The reset token is a cryptographically secure random value (crypto.randomBytes(32)); ' +
        'only its SHA-256 hash is stored. Tokens expire after 15 minutes.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } },
      },
      responses: {
        '200': {
          description: 'Generic success — same body whether or not the email exists',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericMessageResponse' } } },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
      },
    },
  },
  '/api/v1/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset password',
      description:
        'Verifies the one-time reset token (raw hex value from the email link), ' +
        'hashes the new password with bcrypt, updates the stored hash, ' +
        'clears the reset token so it cannot be reused, and invalidates all active ' +
        'refresh tokens (session invalidation).',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } },
      },
      responses: {
        '200': {
          description: 'Password updated successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GenericMessageResponse' } } },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
      },
    },
  },

  // ── Wallets ───────────────────────────────────────────────────────────────
  '/api/v1/wallets': {
    post: {
      tags: ['Wallets'],
      summary: 'Create wallet',
      description: 'Creates a wallet for the authenticated user. Each user may have at most one wallet.',
      security: [{ BearerAuth: [] }],
      responses: {
        '201': {
          description: 'Wallet created',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WalletResponse' } } },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/api/v1/wallets/balance': {
    get: {
      tags: ['Wallets'],
      summary: 'Get wallet balance',
      description: "Returns the authenticated user's wallet including the current balance.",
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Wallet details',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WalletResponse' } } },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/api/v1/wallets/credit': {
    post: {
      tags: ['Wallets'],
      summary: 'Credit wallet',
      description: "Adds funds to the authenticated user's wallet.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AmountRequest' } } },
      },
      responses: {
        '200': {
          description: 'Wallet after credit',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WalletResponse' } } },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/api/v1/wallets/debit': {
    post: {
      tags: ['Wallets'],
      summary: 'Debit wallet',
      description: "Deducts funds from the authenticated user's wallet.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AmountRequest' } } },
      },
      responses: {
        '200': {
          description: 'Wallet after debit',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WalletResponse' } } },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
        '422': { $ref: '#/components/responses/UnprocessableEntity' },
      },
    },
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  '/api/v1/transactions/transfer': {
    post: {
      tags: ['Transactions'],
      summary: 'Transfer money',
      description: 'Atomically debits the sender and credits the receiver. Both parties must have wallets.',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/TransferRequest' } } },
      },
      responses: {
        '200': {
          description: 'Transfer completed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TransferResponse' } } },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
        '409': { $ref: '#/components/responses/Conflict' },
        '422': { $ref: '#/components/responses/UnprocessableEntity' },
      },
    },
  },
  '/api/v1/transactions/history': {
    get: {
      tags: ['Transactions'],
      summary: 'Transaction history',
      description: 'Returns all transactions (sent and received) for the authenticated user, newest first.',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Transaction list',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/TransactionHistoryItem' } },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/transactions/dashboard': {
    get: {
      tags: ['Transactions'],
      summary: 'Dashboard summary',
      description: 'Returns wallet balance, spending totals, monthly/daily stats, and 5 recent transactions.',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Dashboard data',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardResponse' } } },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/api/v1/transactions/{id}': {
    get: {
      tags: ['Transactions'],
      summary: 'Get transaction by ID',
      description: 'Returns a single transaction. Only the sender or receiver may access it.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UuidV4' },
          description: 'Transaction UUID',
        },
      ],
      responses: {
        '200': {
          description: 'Transaction detail',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TransactionHistoryItem' } } },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },

  // ── Users / Discovery ─────────────────────────────────────────────────────
  '/api/v1/users/search': {
    get: {
      tags: ['Users'],
      summary: 'Search users',
      description: 'Case-insensitive partial search on PayFlow ID. Returns up to 10 results. The authenticated user is excluded from results.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string', minLength: 1, example: 'alice' },
          description: 'Search query (min 1 character)',
        },
      ],
      responses: {
        '200': {
          description: 'Matching user profiles',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/PublicProfile' } },
            },
          },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/users/recent': {
    get: {
      tags: ['Users'],
      summary: 'Recent contacts',
      description: 'Returns up to 10 users the authenticated user has recently transacted with, ordered by most recent interaction.',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Recent contacts',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/RecentContact' } },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/users/favourites': {
    get: {
      tags: ['Users'],
      summary: 'List favourite contacts',
      description: "Returns the authenticated user's favourite contacts, ordered by when they were added.",
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Favourite contacts',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/PublicProfile' } },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/users/favourites/{contactUserId}': {
    post: {
      tags: ['Users'],
      summary: 'Add favourite',
      description: 'Adds a user to the authenticated user\'s favourites list.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'contactUserId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UuidV4' },
          description: 'Internal UUID of the user to favourite',
        },
      ],
      responses: {
        '204': { description: 'Added to favourites' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Remove favourite',
      description: 'Removes a user from the authenticated user\'s favourites list. Idempotent — succeeds even if the contact was not favourited.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'contactUserId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UuidV4' },
          description: 'Internal UUID of the user to unfavourite',
        },
      ],
      responses: {
        '204': { description: 'Removed from favourites' },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/users/payflow/{payflowId}': {
    get: {
      tags: ['Users'],
      summary: 'Lookup recipient by PayFlow ID',
      description: 'Finds a user by their exact PayFlow ID. Used before initiating a transfer to confirm the recipient exists.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'payflowId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/PayflowId' },
          description: 'Exact PayFlow ID of the recipient',
        },
      ],
      responses: {
        '200': {
          description: 'Recipient profile',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RecipientProfile' } } },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Full OpenAPI document
// ---------------------------------------------------------------------------
export const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'PayFlow Auth Service API',
    version: '1.0.0',
    description:
      'Backend APIs for authentication, wallet management, money transfers, ' +
      'transaction history, dashboard, and user discovery.',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local development' },
  ],
  tags: [
    { name: 'Health',       description: 'Liveness and readiness probes' },
    { name: 'Auth',         description: 'Register, login, token refresh, logout' },
    { name: 'Wallets',      description: 'Wallet creation and balance management' },
    { name: 'Transactions', description: 'Money transfers, history, and dashboard' },
    { name: 'Users',        description: 'User discovery, search, recent contacts, and favourites' },
  ],
  paths,
  components,
};
