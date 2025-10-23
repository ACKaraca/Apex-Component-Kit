/**
 * @ack/api-docs - API Documentation System
 * Türkçe: Swagger/OpenAPI entegrasyonu
 */

// ============================================================================
// TYPES
// ============================================================================

export interface APIDocConfig {
  title: string;
  version: string;
  description: string;
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  securitySchemes?: Record<string, any>;
  tags?: Array<{
    name: string;
    description?: string;
  }>;
  components?: {
    schemas?: Record<string, any>;
    responses?: Record<string, any>;
    parameters?: Record<string, any>;
    requestBodies?: Record<string, any>;
  };
}

export interface EndpointConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie';
    required?: boolean;
    schema: any;
    description?: string;
  }>;
  requestBody?: {
    required?: boolean;
    content: Record<string, any>;
  };
  responses: Record<string, {
    description: string;
    content?: Record<string, any>;
  }>;
  security?: Array<Record<string, string[]>>;
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  security?: Array<Record<string, string[]>>;
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
    responses?: Record<string, any>;
    parameters?: Record<string, any>;
    requestBodies?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  tags?: Array<{
    name: string;
    description?: string;
  }>;
}

// ============================================================================
// API DOCUMENTATION GENERATOR
// ============================================================================

export class APIDocGenerator {
  private config: APIDocConfig;
  private endpoints: EndpointConfig[] = [];

  constructor(config: APIDocConfig) {
    this.config = config;
  }

  /**
   * Endpoint ekle
   */
  addEndpoint(endpoint: EndpointConfig): void {
    this.endpoints.push(endpoint);
  }

  /**
   * OpenAPI specification oluştur
   */
  generateOpenAPISpec(): OpenAPISpec {
    const paths: Record<string, Record<string, any>> = {};

    this.endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        security: endpoint.security
      };
    });

    return {
      openapi: '3.0.3',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description
      },
      servers: this.config.servers,
      security: this.config.securitySchemes ? [
        { [Object.keys(this.config.securitySchemes)[0]]: [] }
      ] : undefined,
      paths,
      components: this.config.components,
      tags: this.config.tags
    };
  }

  /**
   * YAML formatında specification al
   */
  generateYAML(): string {
    const spec = this.generateOpenAPISpec();
    return this.jsonToYAML(spec);
  }

  /**
   * JSON formatında specification al
   */
  generateJSON(): string {
    const spec = this.generateOpenAPISpec();
    return JSON.stringify(spec, null, 2);
  }

  /**
   * JSON to YAML converter
   */
  private jsonToYAML(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);

    if (obj === null || obj === undefined) {
      return 'null';
    }

    if (typeof obj === 'string') {
      return `"${obj}"`;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';

      const items = obj.map(item => `${spaces}- ${this.jsonToYAML(item, indent + 1)}`);
      return items.join('\n');
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';

      const items = entries.map(([key, value]) => {
        const valueStr = this.jsonToYAML(value, indent + 1);
        return `${spaces}${key}: ${valueStr}`;
      });

      return items.join('\n');
    }

    return String(obj);
  }

  /**
   * Endpoint'ları al
   */
  getEndpoints(): EndpointConfig[] {
    return [...this.endpoints];
  }

  /**
   * Endpoint sayısını al
   */
  getEndpointCount(): number {
    return this.endpoints.length;
  }
}

// ============================================================================
// SWAGGER UI INTEGRATION
// ============================================================================

export class SwaggerUIIntegration {
  private config: APIDocConfig;
  private generator: APIDocGenerator;

  constructor(config: APIDocConfig) {
    this.config = config;
    this.generator = new APIDocGenerator(config);
  }

  /**
   * Express middleware oluştur
   */
  createExpressMiddleware(): any {
    const express = require('express');
    const swaggerUi = require('swagger-ui-express');
    const YAML = require('yaml');

    const router = express.Router();

    // Serve Swagger UI
    const spec = YAML.parse(this.generator.generateYAML());
    router.use('/docs', swaggerUi.serve);
    router.get('/docs', swaggerUi.setup(spec));

    // Serve OpenAPI spec as JSON
    router.get('/openapi.json', (req: any, res: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(this.generator.generateOpenAPISpec(), null, 2));
    });

    // Serve OpenAPI spec as YAML
    router.get('/openapi.yaml', (req: any, res: any) => {
      res.setHeader('Content-Type', 'application/yaml');
      res.send(this.generator.generateYAML());
    });

    return router;
  }

  /**
   * Koa middleware oluştur
   */
  createKoaMiddleware(): any {
    const YAML = require('yaml');

    return async (ctx: any, next: any) => {
      if (ctx.path === '/docs') {
        // Serve Swagger UI HTML
        ctx.type = 'text/html';
        ctx.body = this.getSwaggerUIHTML();
      } else if (ctx.path === '/openapi.json') {
        ctx.type = 'application/json';
        ctx.body = JSON.stringify(this.generator.generateOpenAPISpec(), null, 2);
      } else if (ctx.path === '/openapi.yaml') {
        ctx.type = 'application/yaml';
        ctx.body = this.generator.generateYAML();
      } else {
        await next();
      }
    };
  }

  /**
   * Swagger UI HTML al
   */
  private getSwaggerUIHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${this.config.title} - API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
        <style>
          html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
          }
          *, *:before, *:after {
            box-sizing: inherit;
          }
          body {
            margin:0;
            background: #fafafa;
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              url: '/openapi.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout"
            });
          };
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Generator'a erişim
   */
  getGenerator(): APIDocGenerator {
    return this.generator;
  }
}

// ============================================================================
// API ENDPOINT ANALYZER
// ============================================================================

export class APIEndpointAnalyzer {
  private routes: Map<string, any> = new Map();

  /**
   * Route kaydet
   */
  registerRoute(method: string, path: string, handler: any, metadata?: any): void {
    const key = `${method.toUpperCase()} ${path}`;
    this.routes.set(key, {
      method,
      path,
      handler,
      metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Tüm route'ları analiz et
   */
  analyzeRoutes(): Array<{
    method: string;
    path: string;
    summary: string;
    parameters: any[];
    responses: any;
  }> {
    const endpoints: any[] = [];

    this.routes.forEach((route, key) => {
      const [method, path] = key.split(' ');

      endpoints.push({
        method,
        path,
        summary: this.generateSummary(route),
        parameters: this.extractParameters(path, route),
        responses: this.generateResponses(route)
      });
    });

    return endpoints;
  }

  /**
   * Summary oluştur
   */
  private generateSummary(route: any): string {
    if (route.metadata?.summary) {
      return route.metadata.summary;
    }

    // Generate summary based on path and method
    const pathParts = route.path.split('/').filter(Boolean);
    const resource = pathParts[pathParts.length - 1] || 'resource';

    switch (route.method.toLowerCase()) {
      case 'get':
        return `Get ${resource}`;
      case 'post':
        return `Create ${resource}`;
      case 'put':
        return `Update ${resource}`;
      case 'delete':
        return `Delete ${resource}`;
      case 'patch':
        return `Patch ${resource}`;
      default:
        return `Handle ${resource}`;
    }
  }

  /**
   * Parameters çıkar
   */
  private extractParameters(path: string, route: any): any[] {
    const parameters: any[] = [];
    const pathParams = path.match(/:([^/]+)/g);

    if (pathParams) {
      pathParams.forEach(param => {
        const paramName = param.substring(1);
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: `Path parameter: ${paramName}`
        });
      });
    }

    // Add query parameters if metadata exists
    if (route.metadata?.queryParams) {
      route.metadata.queryParams.forEach((param: any) => {
        parameters.push({
          name: param.name,
          in: 'query',
          required: param.required || false,
          schema: param.schema || { type: 'string' },
          description: param.description
        });
      });
    }

    return parameters;
  }

  /**
   * Responses oluştur
   */
  private generateResponses(route: any): any {
    const responses: any = {};

    // Success response
    responses['200'] = {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: route.metadata?.responseSchema || {}
          }
        }
      }
    };

    // Error responses
    responses['400'] = {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    };

    responses['404'] = {
      description: 'Not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    };

    responses['500'] = {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    };

    return responses;
  }

  /**
   * Route'ları al
   */
  getRoutes(): Map<string, any> {
    return new Map(this.routes);
  }

  /**
   * Route sayısını al
   */
  getRouteCount(): number {
    return this.routes.size;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * API documentation generator oluştur
 */
export function createAPIDocGenerator(config: APIDocConfig): APIDocGenerator {
  return new APIDocGenerator(config);
}

/**
 * Swagger UI integration oluştur
 */
export function createSwaggerUIIntegration(config: APIDocConfig): SwaggerUIIntegration {
  return new SwaggerUIIntegration(config);
}

/**
 * API endpoint analyzer oluştur
 */
export function createAPIEndpointAnalyzer(): APIEndpointAnalyzer {
  return new APIEndpointAnalyzer();
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * ACK API için varsayılan configuration
 */
export const defaultACKAPIDoc: APIDocConfig = {
  title: 'ACK Framework API',
  version: '1.0.0',
  description: 'API documentation for ACK Framework applications',
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.example.com',
      description: 'Production server'
    }
  ],
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  },
  tags: [
    {
      name: 'users',
      description: 'User management operations'
    },
    {
      name: 'posts',
      description: 'Post management operations'
    },
    {
      name: 'auth',
      description: 'Authentication operations'
    }
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  }
};

/**
 * Common endpoint patterns
 */
export const commonEndpoints: EndpointConfig[] = [
  // Users
  {
    path: '/users',
    method: 'get',
    summary: 'Get all users',
    description: 'Retrieve a list of all users',
    tags: ['users'],
    parameters: [
      {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1 },
        description: 'Page number'
      },
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100 },
        description: 'Number of items per page'
      }
    ],
    responses: {
      '200': {
        description: 'List of users',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                users: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' }
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  },
  {
    path: '/users/{id}',
    method: 'get',
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID',
    tags: ['users'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'User ID'
      }
    ],
    responses: {
      '200': {
        description: 'User object',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/User' }
          }
        }
      },
      '404': { $ref: '#/components/responses/NotFoundError' }
    }
  },
  {
    path: '/users',
    method: 'post',
    summary: 'Create user',
    description: 'Create a new user',
    tags: ['users'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string', minLength: 1 },
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8 }
            }
          }
        }
      }
    },
    responses: {
      '201': {
        description: 'User created successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/User' }
          }
        }
      },
      '400': {
        description: 'Invalid input',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  },
  // Authentication
  {
    path: '/auth/login',
    method: 'post',
    summary: 'User login',
    description: 'Authenticate user and return token',
    tags: ['auth'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8 }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Login successful',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      },
      '401': { $ref: '#/components/responses/UnauthorizedError' }
    }
  }
];




