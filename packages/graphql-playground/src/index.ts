/**
 * @ack/graphql-playground - GraphQL Playground System
 * Türkçe: Interactive query testing and exploration
 */

// ============================================================================
// TYPES
// ============================================================================

export interface GraphQLPlaygroundConfig {
  endpoint: string;
  port?: number;
  subscriptions?: boolean;
  introspection?: boolean;
  playground?: boolean;
  cors?: boolean;
  authentication?: boolean;
  headers?: Record<string, string>;
}

export interface QueryHistory {
  id: string;
  query: string;
  variables?: string;
  operationName?: string;
  timestamp: number;
  results?: any;
  errors?: any[];
}

export interface GraphQLSchemaInfo {
  types: any[];
  queries: any[];
  mutations: any[];
  subscriptions: any[];
  directives: any[];
}

export interface PlaygroundSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  lineNumbers: boolean;
  autoComplete: boolean;
  syntaxHighlighting: boolean;
  queryHistory: boolean;
  schemaExplorer: boolean;
}

// ============================================================================
// GRAPHQL PLAYGROUND SERVER
// ============================================================================

export class GraphQLPlaygroundServer {
  private config: GraphQLPlaygroundConfig;
  private server: any;
  private queryHistory: QueryHistory[] = [];
  private settings: PlaygroundSettings = {
    theme: 'light',
    fontSize: 14,
    lineNumbers: true,
    autoComplete: true,
    syntaxHighlighting: true,
    queryHistory: true,
    schemaExplorer: true
  };

  constructor(config: GraphQLPlaygroundConfig) {
    this.config = {
      port: 4000,
      subscriptions: false,
      introspection: true,
      playground: true,
      cors: true,
      authentication: false,
      ...config
    };
  }

  /**
   * Server'ı başlat
   */
  async start(): Promise<void> {
    const express = require('express');
    const cors = require('cors');
    const bodyParser = require('body-parser');

    const app = express();

    // Middleware
    if (this.config.cors) {
      app.use(cors());
    }

    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));

    // Authentication middleware
    if (this.config.authentication) {
      app.use('/graphql', this.authenticateRequest.bind(this));
    }

    // GraphQL endpoint
    app.use('/graphql', this.createGraphQLHandler());

    // Playground endpoint
    if (this.config.playground) {
      app.use('/playground', this.createPlaygroundHandler());
    }

    // API endpoints
    app.use('/api', this.createAPIHandler());

    // Static files
    app.use(express.static('public'));

    // Start server
    return new Promise((resolve, reject) => {
      this.server = app.listen(this.config.port, (error: any) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🚀 GraphQL Playground running at http://localhost:${this.config.port}`);
          console.log(`📊 GraphQL endpoint: http://localhost:${this.config.port}/graphql`);
          console.log(`🎮 Playground: http://localhost:${this.config.port}/playground`);
          resolve();
        }
      });
    });
  }

  /**
   * Server'ı durdur
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('GraphQL Playground server stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Authentication middleware
   */
  private authenticateRequest(req: any, res: any, next: any): void {
    // Simple token-based authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    // Here you would validate the token
    // For now, just accept any token

    next();
  }

  /**
   * GraphQL handler oluştur
   */
  private createGraphQLHandler(): any {
    const { graphqlHTTP } = require('express-graphql');
    const { buildSchema } = require('graphql');

    // This is a placeholder - in a real implementation,
    // you would load your actual GraphQL schema
    const schema = buildSchema(`
      type Query {
        hello: String
        user(id: ID!): User
        users: [User]
      }

      type User {
        id: ID!
        name: String
        email: String
      }

      type Mutation {
        createUser(name: String!, email: String!): User
        updateUser(id: ID!, name: String, email: String): User
      }

      type Subscription {
        userUpdated(id: ID!): User
      }

      schema {
        query: Query
        mutation: Mutation
        subscription: Subscription
      }
    `);

    const root = {
      hello: () => 'Hello from ACK GraphQL Playground!',
      user: ({ id }: { id: string }) => ({ id, name: 'Test User', email: 'test@example.com' }),
      users: () => [
        { id: '1', name: 'User 1', email: 'user1@example.com' },
        { id: '2', name: 'User 2', email: 'user2@example.com' }
      ],
      createUser: ({ name, email }: { name: string; email: string }) => ({
        id: Date.now().toString(),
        name,
        email
      }),
      updateUser: ({ id, name, email }: { id: string; name?: string; email?: string }) => ({
        id,
        name: name || 'Updated User',
        email: email || 'updated@example.com'
      })
    };

    return graphqlHTTP({
      schema,
      rootValue: root,
      graphiql: false, // We'll use our custom playground
      customFormatErrorFn: (error: any) => ({
        message: error.message,
        locations: error.locations,
        stack: error.stack,
        path: error.path
      })
    });
  }

  /**
   * Playground handler oluştur
   */
  private createPlaygroundHandler(): any {
    const express = require('express');
    const router = express.Router();

    router.get('/', (req: any, res: any) => {
      res.send(this.getPlaygroundHTML());
    });

    router.get('/schema', async (req: any, res: any) => {
      try {
        const schema = await this.getSchemaInfo();
        res.json(schema);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    return router;
  }

  /**
   * API handler oluştur
   */
  private createAPIHandler(): any {
    const express = require('express');
    const router = express.Router();

    // Query history
    router.get('/history', (req: any, res: any) => {
      res.json(this.queryHistory);
    });

    router.post('/history', (req: any, res: any) => {
      const query: QueryHistory = {
        id: Date.now().toString(),
        query: req.body.query,
        variables: req.body.variables,
        operationName: req.body.operationName,
        timestamp: Date.now()
      };

      this.queryHistory.unshift(query);

      // Keep only last 100 queries
      if (this.queryHistory.length > 100) {
        this.queryHistory = this.queryHistory.slice(0, 100);
      }

      res.json(query);
    });

    router.delete('/history/:id', (req: any, res: any) => {
      const id = req.params.id;
      this.queryHistory = this.queryHistory.filter(q => q.id !== id);
      res.json({ success: true });
    });

    // Settings
    router.get('/settings', (req: any, res: any) => {
      res.json(this.settings);
    });

    router.put('/settings', (req: any, res: any) => {
      this.settings = { ...this.settings, ...req.body };
      res.json(this.settings);
    });

    return router;
  }

  /**
   * Schema bilgilerini al
   */
  private async getSchemaInfo(): Promise<GraphQLSchemaInfo> {
    // This would analyze the actual GraphQL schema
    // For now, return a placeholder
    return {
      types: [],
      queries: [],
      mutations: [],
      subscriptions: [],
      directives: []
    };
  }

  /**
   * Playground HTML'ini al
   */
  private getPlaygroundHTML(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ACK GraphQL Playground</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }

          .container {
            display: flex;
            height: 100vh;
          }

          .sidebar {
            width: 300px;
            background: white;
            border-right: 1px solid #e9ecef;
            display: flex;
            flex-direction: column;
          }

          .main {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .editor {
            display: flex;
            flex: 1;
          }

          .query-editor, .variables-editor, .result-viewer {
            padding: 20px;
            border: none;
            outline: none;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.5;
          }

          .query-editor {
            flex: 2;
            background: #2d3748;
            color: #e2e8f0;
          }

          .variables-editor {
            flex: 1;
            background: #f7fafc;
            border-left: 1px solid #e9ecef;
          }

          .result-viewer {
            flex: 2;
            background: white;
            border-top: 1px solid #e9ecef;
            overflow: auto;
          }

          .toolbar {
            background: white;
            border-bottom: 1px solid #e9ecef;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 5px;
          }

          .btn:hover {
            background: #5a67d8;
          }

          .btn:disabled {
            background: #a0aec0;
            cursor: not-allowed;
          }

          .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
            font-weight: bold;
          }

          .schema-explorer {
            flex: 1;
            overflow: auto;
            padding: 20px;
          }

          .history-item {
            padding: 10px 20px;
            border-bottom: 1px solid #e9ecef;
            cursor: pointer;
          }

          .history-item:hover {
            background: #f8f9fa;
          }

          .history-query {
            font-family: monospace;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }

          .tabs {
            display: flex;
            border-bottom: 1px solid #e9ecef;
          }

          .tab {
            padding: 10px 20px;
            border: none;
            background: none;
            cursor: pointer;
            border-bottom: 2px solid transparent;
          }

          .tab.active {
            border-bottom-color: #667eea;
            color: #667eea;
          }

          .tab-content {
            display: none;
          }

          .tab-content.active {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="sidebar">
            <div class="sidebar-header">GraphQL Explorer</div>

            <div class="tabs">
              <button class="tab active" onclick="showTab('schema')">Schema</button>
              <button class="tab" onclick="showTab('history')">History</button>
              <button class="tab" onclick="showTab('settings')">Settings</button>
            </div>

            <div id="schema-tab" class="tab-content active">
              <div class="schema-explorer">
                <h3>Query</h3>
                <div id="query-types"></div>

                <h3>Mutation</h3>
                <div id="mutation-types"></div>

                <h3>Types</h3>
                <div id="type-list"></div>
              </div>
            </div>

            <div id="history-tab" class="tab-content">
              <div id="query-history"></div>
            </div>

            <div id="settings-tab" class="tab-content">
              <div style="padding: 20px;">
                <h3>Settings</h3>
                <label>
                  <input type="checkbox" id="auto-complete" checked> Auto Complete
                </label><br>
                <label>
                  <input type="checkbox" id="syntax-highlighting" checked> Syntax Highlighting
                </label><br>
                <label>
                  <input type="checkbox" id="line-numbers" checked> Line Numbers
                </label>
              </div>
            </div>
          </div>

          <div class="main">
            <div class="toolbar">
              <div>
                <button class="btn" onclick="executeQuery()">Execute</button>
                <button class="btn" onclick="prettifyQuery()">Prettify</button>
                <button class="btn" onclick="clearResult()">Clear</button>
              </div>
              <div>
                <select id="operation-type">
                  <option value="query">Query</option>
                  <option value="mutation">Mutation</option>
                  <option value="subscription">Subscription</option>
                </select>
              </div>
            </div>

            <div class="editor">
              <textarea
                id="query-editor"
                class="query-editor"
                placeholder="Enter your GraphQL query here...

Example:
query {
  users {
    id
    name
    email
  }
}

mutation {
  createUser(name: \"John Doe\", email: \"john@example.com\") {
    id
    name
  }
}"
              ></textarea>

              <textarea
                id="variables-editor"
                class="variables-editor"
                placeholder="Variables (JSON format)

Example:
{
  \"userId\": \"123\"
}"
              ></textarea>
            </div>

            <div class="result-viewer" id="result-viewer">
              <div style="padding: 20px; color: #666;">
                Execute a query to see results here...
              </div>
            </div>
          </div>
        </div>

        <script>
          let currentTab = 'schema';
          let queryHistory = [];

          // Initialize
          loadSchema();
          loadHistory();

          // Event listeners
          document.getElementById('query-editor').addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
              executeQuery();
            }
          });

          function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
              tab.classList.remove('active');
            });

            document.querySelectorAll('.tab').forEach(tab => {
              tab.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            event.target.classList.add('active');

            currentTab = tabName;
          }

          async function executeQuery() {
            const query = document.getElementById('query-editor').value.trim();
            const variablesText = document.getElementById('variables-editor').value.trim();
            const operationType = document.getElementById('operation-type').value;

            if (!query) {
              alert('Please enter a GraphQL query');
              return;
            }

            let variables = {};
            if (variablesText) {
              try {
                variables = JSON.parse(variablesText);
              } catch (e) {
                alert('Invalid JSON in variables field');
                return;
              }
            }

            const payload = {
              query,
              variables,
              operationName: null
            };

            try {
              const response = await fetch('/graphql', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
              });

              const result = await response.json();

              // Display result
              const resultViewer = document.getElementById('result-viewer');
              resultViewer.innerHTML = \`<pre>\${JSON.stringify(result, null, 2)}</pre>\`;

              // Add to history
              if (document.getElementById('query-history').style.display !== 'none') {
                addToHistory(query, variablesText, result);
              }
            } catch (error) {
              document.getElementById('result-viewer').innerHTML =
                \`<div style="color: red; padding: 20px;">Error: \${error.message}</div>\`;
            }
          }

          function prettifyQuery() {
            const query = document.getElementById('query-editor').value;
            // Simple prettify - in real implementation would use a proper GraphQL formatter
            document.getElementById('query-editor').value = query.replace(/\s+/g, ' ').trim();
          }

          function clearResult() {
            document.getElementById('result-viewer').innerHTML =
              '<div style="padding: 20px; color: #666;">Execute a query to see results here...</div>';
          }

          async function loadSchema() {
            try {
              const response = await fetch('/playground/schema');
              const schema = await response.json();

              // Populate schema explorer
              document.getElementById('query-types').innerHTML = 'Loading...';
              document.getElementById('mutation-types').innerHTML = 'Loading...';
              document.getElementById('type-list').innerHTML = 'Loading...';
            } catch (error) {
              console.error('Failed to load schema:', error);
            }
          }

          async function loadHistory() {
            try {
              const response = await fetch('/api/history');
              const history = await response.json();

              queryHistory = history;
              updateHistoryDisplay();
            } catch (error) {
              console.error('Failed to load history:', error);
            }
          }

          function addToHistory(query, variables, result) {
            const historyItem = {
              id: Date.now().toString(),
              query,
              variables,
              timestamp: Date.now(),
              results: result
            };

            queryHistory.unshift(historyItem);

            // Keep only last 20 items
            if (queryHistory.length > 20) {
              queryHistory = queryHistory.slice(0, 20);
            }

            updateHistoryDisplay();

            // Save to server
            fetch('/api/history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query,
                variables,
                operationName: null
              })
            });
          }

          function updateHistoryDisplay() {
            const historyContainer = document.getElementById('query-history');

            if (queryHistory.length === 0) {
              historyContainer.innerHTML = '<div style="padding: 20px; color: #666;">No queries in history</div>';
              return;
            }

            historyContainer.innerHTML = queryHistory.map(item => \`
              <div class="history-item" onclick="loadHistoryItem('\${item.id}')">
                <div>\${new Date(item.timestamp).toLocaleString()}</div>
                <div class="history-query">\${item.query.substring(0, 100)}\${item.query.length > 100 ? '...' : ''}</div>
              </div>
            \`).join('');
          }

          function loadHistoryItem(id) {
            const item = queryHistory.find(h => h.id === id);
            if (item) {
              document.getElementById('query-editor').value = item.query;
              document.getElementById('variables-editor').value = item.variables || '';
            }
          }
        </script>
      </body>
      </html>
    `;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * GraphQL Playground server oluştur
 */
export function createGraphQLPlayground(config: GraphQLPlaygroundConfig): GraphQLPlaygroundServer {
  return new GraphQLPlaygroundServer(config);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * GraphQL query parser
 */
export class GraphQLQueryParser {
  /**
   * Query'yi parse et
   */
  static parseQuery(query: string): {
    operationType: string;
    operationName?: string;
    fields: string[];
    variables: string[];
  } {
    const result = {
      operationType: 'query',
      operationName: undefined,
      fields: [] as string[],
      variables: [] as string[]
    };

    // Simple regex-based parsing
    const operationMatch = query.match(/(query|mutation|subscription)\s*(\w+)?\s*\{/);
    if (operationMatch) {
      result.operationType = operationMatch[1];
      result.operationName = operationMatch[2];
    }

    // Extract fields
    const fieldMatches = query.match(/\{([^}]+)\}/g);
    if (fieldMatches) {
      fieldMatches.forEach(match => {
        const fields = match.replace(/[{}]/g, '').split(/\s+/).filter(f => f.trim());
        result.fields.push(...fields);
      });
    }

    // Extract variables
    const variableMatches = query.match(/\$(\w+)/g);
    if (variableMatches) {
      result.variables = variableMatches.map(v => v.substring(1));
    }

    return result;
  }

  /**
   * Query'yi validate et
   */
  static validateQuery(query: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!query.trim()) {
      errors.push('Query cannot be empty');
    }

    // Check for balanced braces
    const openBraces = (query.match(/\{/g) || []).length;
    const closeBraces = (query.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push('Unbalanced braces');
    }

    // Check for balanced parentheses
    const openParens = (query.match(/\(/g) || []).length;
    const closeParens = (query.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * GraphQL utilities
 */
export const GraphQLUtils = {
  /**
   * Query'yi formatla
   */
  formatQuery(query: string): string {
    // Simple formatting - in real implementation would use a proper formatter
    return query
      .replace(/\s+/g, ' ')
      .replace(/\s*\{\s*/g, ' {\n  ')
      .replace(/\s*\}\s*/g, '\n}\n')
      .replace(/,\s*/g, ',\n  ');
  },

  /**
   * Variables'ı formatla
   */
  formatVariables(variables: string): string {
    try {
      const parsed = JSON.parse(variables);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return variables;
    }
  },

  /**
   * Query hash oluştur
   */
  createQueryHash(query: string, variables?: string): string {
    const content = variables ? `${query}:${variables}` : query;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
};

