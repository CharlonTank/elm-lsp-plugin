#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { z } from 'zod';

// Helper function to find Elm project root
function findElmProjectRoot(startPath = process.cwd()) {
  let currentPath = resolve(startPath);
  
  while (currentPath !== dirname(currentPath)) {
    if (existsSync(resolve(currentPath, 'elm.json'))) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }
  
  return null;
}

// Helper function to find project root for a specific file
function findProjectRootForFile(filePath) {
  const fileDir = dirname(resolve(filePath));
  return findElmProjectRoot(fileDir);
}

class ElmLSPClient extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
    this.buffer = '';
    this.isInitialized = false;
    this.openDocuments = new Set();
    this.currentProjectRoot = null;
  }

  async start() {
    return Promise.resolve();
  }

  async ensureProjectInitialized(filePath) {
    console.error(`🔍 ensureProjectInitialized called with: ${filePath}`);
    const projectRoot = findProjectRootForFile(filePath);
    console.error(`🔍 Found project root: ${projectRoot}`);
    
    if (!projectRoot) {
      const error = `No Elm project found for file: ${filePath}`;
      console.error(`❌ ${error}`);
      throw new Error(error);
    }

    if (this.isInitialized && this.currentProjectRoot === projectRoot) {
      console.error(`✅ Already initialized for project: ${projectRoot}`);
      return;
    }

    if (this.process) {
      console.error(`🔄 Switching from project ${this.currentProjectRoot} to ${projectRoot}`);
      this.cleanup();
    }

    console.error(`🚀 Initializing LSP for project: ${projectRoot}`);
    await this.startLSPProcess(projectRoot);
  }

  async startLSPProcess(projectRoot) {
    return new Promise((resolve, reject) => {
      this.process = spawn('elm-language-server', ['--stdio'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: projectRoot
      });

      if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
        reject(new Error('Failed to create LSP process streams'));
        return;
      }

      this.process.stdout.on('data', (data) => {
        this.handleData(data);
      });

      this.process.stderr.on('data', (data) => {
        console.error('LSP stderr:', data.toString());
      });

      this.process.on('error', (error) => {
        console.error('LSP process error:', error);
        reject(error);
      });

      this.process.on('exit', (code) => {
        console.error('LSP process exited with code:', code);
        this.cleanup();
      });

      this.initialize(projectRoot).then(() => {
        this.isInitialized = true;
        this.currentProjectRoot = projectRoot;
        console.error(`LSP initialized for project: ${projectRoot}`);
        resolve();
      }).catch(reject);
    });
  }

  async initialize(projectRoot) {
    console.error(`Detected Elm project root: ${projectRoot}`);
    
    const initParams = {
      processId: process.pid,
      clientInfo: {
        name: 'elm-lsp-mcp',
        version: '1.0.0'
      },
      rootUri: `file://${projectRoot}`,
      capabilities: {
        textDocument: {
          completion: {
            completionItem: {
              snippetSupport: true,
              documentationFormat: ['markdown', 'plaintext']
            }
          },
          hover: {
            contentFormat: ['markdown', 'plaintext']
          },
          definition: {
            linkSupport: true
          },
          references: {},
          documentSymbol: {
            symbolKind: {
              valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
            }
          },
          formatting: {},
          rename: {
            prepareSupport: true
          }
        },
        workspace: {
          didChangeConfiguration: {
            dynamicRegistration: true
          }
        }
      }
    };

    await this.sendRequest('initialize', initParams);
    await this.sendNotification('initialized', {});
  }

  handleData(data) {
    this.buffer += data.toString();
    
    while (true) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const headers = this.buffer.substring(0, headerEnd);
      const contentLengthMatch = headers.match(/Content-Length: (\d+)/);
      
      if (!contentLengthMatch) {
        console.error('No Content-Length header found');
        this.buffer = this.buffer.substring(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1]);
      const messageStart = headerEnd + 4;
      
      if (this.buffer.length < messageStart + contentLength) {
        break;
      }

      const messageContent = this.buffer.substring(messageStart, messageStart + contentLength);
      this.buffer = this.buffer.substring(messageStart + contentLength);

      try {
        const message = JSON.parse(messageContent);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse LSP message:', error);
      }
    }
  }

  handleMessage(message) {
    if (message.id !== undefined && this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id);
      clearTimeout(request.timeout);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        request.reject(new Error(message.error.message || 'LSP request failed'));
      } else {
        request.resolve(message.result);
      }
    } else if (message.method) {
      this.emit('notification', message.method, message.params);
    }
  }

  sendMessage(message) {
    if (!this.process || !this.process.stdin) {
      throw new Error('LSP process not available');
    }

    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content, 'utf8')}\r\n\r\n`;
    this.process.stdin.write(header + content);
  }

  sendRequest(method, params, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`LSP request timeout: ${method}`));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timeout: timeoutHandle });

      this.sendMessage({
        jsonrpc: '2.0',
        id,
        method,
        params
      });
    });
  }

  sendNotification(method, params) {
    this.sendMessage({
      jsonrpc: '2.0',
      method,
      params
    });
  }

  async ensureDocumentOpen(filePath) {
    const uri = `file://${filePath}`;
    if (this.openDocuments.has(uri)) {
      return;
    }

    try {
      const { readFile } = await import('fs/promises');
      const content = await readFile(filePath, 'utf8');
      
      this.sendNotification('textDocument/didOpen', {
        textDocument: {
          uri,
          languageId: 'elm',
          version: 1,
          text: content
        }
      });

      this.openDocuments.add(uri);
    } catch (error) {
      throw new Error(`Failed to open document: ${error}`);
    }
  }

  async completion(filePath, line, character) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);
    
    return this.sendRequest('textDocument/completion', {
      textDocument: { uri: `file://${filePath}` },
      position: { line, character }
    });
  }

  async hover(filePath, line, character) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);
    
    return this.sendRequest('textDocument/hover', {
      textDocument: { uri: `file://${filePath}` },
      position: { line, character }
    });
  }

  async definition(filePath, line, character) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);
    
    return this.sendRequest('textDocument/definition', {
      textDocument: { uri: `file://${filePath}` },
      position: { line, character }
    });
  }

  async references(filePath, line, character) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);
    
    return this.sendRequest('textDocument/references', {
      textDocument: { uri: `file://${filePath}` },
      position: { line, character },
      context: { includeDeclaration: true }
    });
  }

  async documentSymbol(filePath) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);

    return this.sendRequest('textDocument/documentSymbol', {
      textDocument: { uri: `file://${filePath}` }
    });
  }

  async codeAction(filePath, startLine, startChar, endLine, endChar, diagnostics = []) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);

    return this.sendRequest('textDocument/codeAction', {
      textDocument: { uri: `file://${filePath}` },
      range: {
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar }
      },
      context: { diagnostics }
    });
  }

  async formatting(filePath) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);
    
    return this.sendRequest('textDocument/formatting', {
      textDocument: { uri: `file://${filePath}` },
      options: {
        tabSize: 4,
        insertSpaces: true
      }
    });
  }

  async prepareRename(filePath, line, character) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);
    
    return this.sendRequest('textDocument/prepareRename', {
      textDocument: { uri: `file://${filePath}` },
      position: { line, character }
    });
  }

  async rename(filePath, line, character, newName) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);
    
    return this.sendRequest('textDocument/rename', {
      textDocument: { uri: `file://${filePath}` },
      position: { line, character },
      newName
    });
  }

  async getDiagnostics(filePath) {
    await this.ensureProjectInitialized(filePath);
    await this.ensureDocumentOpen(filePath);
    
    this.sendNotification('textDocument/didSave', {
      textDocument: { uri: `file://${filePath}` }
    });

    return new Promise((resolve) => {
      const handler = (method, params) => {
        if (method === 'textDocument/publishDiagnostics' && 
            params.uri === `file://${filePath}`) {
          this.removeListener('notification', handler);
          resolve(params.diagnostics);
        }
      };
      this.on('notification', handler);
      
      setTimeout(() => {
        this.removeListener('notification', handler);
        resolve([]);
      }, 5000);
    });
  }

  cleanup() {
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('LSP client shutting down'));
    });
    this.pendingRequests.clear();
    this.openDocuments.clear();
    this.isInitialized = false;
    this.currentProjectRoot = null;
    
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

// Créer le serveur MCP avec la classe de haut niveau
const server = new McpServer({
  name: 'elm-lsp-mcp',
  version: '1.0.0'
});

const lspClient = new ElmLSPClient();

// Ajouter les outils MCP
server.tool('elm_completion', {
  file_path: z.string(),
  line: z.number(),
  character: z.number()
}, async ({ file_path, line, character }) => {
  console.error(`📝 Calling completion for ${file_path}:${line}:${character}`);
  const result = await lspClient.completion(file_path, line, character);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.tool('elm_hover', {
  file_path: z.string(),
  line: z.number(),
  character: z.number()
}, async ({ file_path, line, character }) => {
  console.error(`🔍 Calling hover for ${file_path}:${line}:${character}`);
  const result = await lspClient.hover(file_path, line, character);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.tool('elm_definition', {
  file_path: z.string(),
  line: z.number(),
  character: z.number()
}, async ({ file_path, line, character }) => {
  console.error(`🎯 Calling definition for ${file_path}:${line}:${character}`);
  const result = await lspClient.definition(file_path, line, character);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.tool('elm_references', {
  file_path: z.string(),
  line: z.number(),
  character: z.number()
}, async ({ file_path, line, character }) => {
  console.error(`📚 Calling references for ${file_path}:${line}:${character}`);
  const result = await lspClient.references(file_path, line, character);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.tool('elm_symbols', {
  file_path: z.string(),
  limit: z.number().optional().describe('Maximum number of symbols to return (default: 50)'),
  offset: z.number().optional().describe('Number of symbols to skip (default: 0)')
}, async ({ file_path, limit = 50, offset = 0 }) => {
  console.error(`🏷️ Calling documentSymbol for ${file_path} (limit: ${limit}, offset: ${offset})`);
  const result = await lspClient.documentSymbol(file_path);
  const symbols = result || [];
  const paginated = symbols.slice(offset, offset + limit);
  const total = symbols.length;
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        symbols: paginated,
        pagination: { total, offset, limit, hasMore: offset + limit < total }
      }, null, 2)
    }]
  };
});

server.tool('elm_format', {
  file_path: z.string()
}, async ({ file_path }) => {
  console.error(`✨ Calling formatting for ${file_path}`);
  const result = await lspClient.formatting(file_path);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.tool('elm_diagnostics', {
  file_path: z.string()
}, async ({ file_path }) => {
  console.error(`🔧 Calling getDiagnostics for ${file_path}`);
  const result = await lspClient.getDiagnostics(file_path);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.tool('elm_code_actions', {
  file_path: z.string(),
  start_line: z.number().describe('Start line (0-indexed)'),
  start_char: z.number().describe('Start character (0-indexed)'),
  end_line: z.number().describe('End line (0-indexed)'),
  end_char: z.number().describe('End character (0-indexed)')
}, async ({ file_path, start_line, start_char, end_line, end_char }) => {
  console.error(`🔨 Calling codeAction for ${file_path}:${start_line}:${start_char}-${end_line}:${end_char}`);

  // First, get diagnostics for the file
  const allDiagnostics = await lspClient.getDiagnostics(file_path);

  // Filter diagnostics that overlap with the requested range
  const relevantDiagnostics = allDiagnostics.filter(d => {
    const dStart = d.range.start;
    const dEnd = d.range.end;
    // Check if diagnostic range overlaps with requested range
    const overlaps = !(dEnd.line < start_line ||
                       (dEnd.line === start_line && dEnd.character < start_char) ||
                       dStart.line > end_line ||
                       (dStart.line === end_line && dStart.character > end_char));
    return overlaps;
  });

  console.error(`📋 Found ${relevantDiagnostics.length} relevant diagnostics out of ${allDiagnostics.length} total`);

  const result = await lspClient.codeAction(file_path, start_line, start_char, end_line, end_char, relevantDiagnostics);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

server.tool('elm_apply_code_action', {
  file_path: z.string(),
  start_line: z.number(),
  start_char: z.number(),
  end_line: z.number(),
  end_char: z.number(),
  action_title: z.string().describe('Title of the code action to apply')
}, async ({ file_path, start_line, start_char, end_line, end_char, action_title }) => {
  console.error(`🔨 Applying code action "${action_title}" for ${file_path}`);

  // First, get diagnostics for the file
  const allDiagnostics = await lspClient.getDiagnostics(file_path);

  // Filter diagnostics that overlap with the requested range
  const relevantDiagnostics = allDiagnostics.filter(d => {
    const dStart = d.range.start;
    const dEnd = d.range.end;
    const overlaps = !(dEnd.line < start_line ||
                       (dEnd.line === start_line && dEnd.character < start_char) ||
                       dStart.line > end_line ||
                       (dStart.line === end_line && dStart.character > end_char));
    return overlaps;
  });

  const actions = await lspClient.codeAction(file_path, start_line, start_char, end_line, end_char, relevantDiagnostics);

  const action = actions?.find(a => a.title === action_title);
  if (!action) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Action "${action_title}" not found`, available: actions?.map(a => a.title) }, null, 2) }]
    };
  }

  if (action.edit) {
    const applied = applyWorkspaceEdit(action.edit);
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true, action: action_title, filesModified: applied }, null, 2) }]
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Action has no edit', action }, null, 2) }]
  };
});

server.tool('elm_prepare_rename', {
  file_path: z.string(),
  line: z.number(),
  character: z.number()
}, async ({ file_path, line, character }) => {
  console.error(`🏷️ Calling prepareRename for ${file_path}:${line}:${character}`);
  const result = await lspClient.prepareRename(file_path, line, character);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
});

// Helper function to apply workspace edits from LSP
function applyWorkspaceEdit(edit) {
  const changes = edit.changes || {};
  const documentChanges = edit.documentChanges || [];
  const appliedFiles = new Set();
  const results = [];

  // Helper to apply edits to a single file
  function applyEditsToFile(filePath, edits) {
    if (appliedFiles.has(filePath)) return; // Avoid double-applying
    appliedFiles.add(filePath);

    let content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Sort edits in reverse order (bottom to top) to preserve positions
    const sortedEdits = [...edits].sort((a, b) => {
      if (b.range.start.line !== a.range.start.line) {
        return b.range.start.line - a.range.start.line;
      }
      return b.range.start.character - a.range.start.character;
    });

    for (const edit of sortedEdits) {
      const { range, newText } = edit;
      const startLine = range.start.line;
      const endLine = range.end.line;
      const startChar = range.start.character;
      const endChar = range.end.character;

      if (startLine === endLine) {
        const line = lines[startLine];
        lines[startLine] = line.substring(0, startChar) + newText + line.substring(endChar);
      } else {
        const startLineText = lines[startLine].substring(0, startChar);
        const endLineText = lines[endLine].substring(endChar);
        const newLines = (startLineText + newText + endLineText).split('\n');
        lines.splice(startLine, endLine - startLine + 1, ...newLines);
      }
    }

    writeFileSync(filePath, lines.join('\n'));
    results.push({ file: filePath, edits: edits.length });
  }

  // Handle documentChanges format (preferred)
  for (const docChange of documentChanges) {
    if (docChange.textDocument && docChange.edits) {
      const filePath = docChange.textDocument.uri.replace('file://', '');
      applyEditsToFile(filePath, docChange.edits);
    }
  }

  // Handle changes format (fallback)
  for (const [uri, edits] of Object.entries(changes)) {
    const filePath = uri.replace('file://', '');
    applyEditsToFile(filePath, edits);
  }

  return results;
}

server.tool('elm_rename', {
  file_path: z.string(),
  line: z.number(),
  character: z.number(),
  newName: z.string()
}, async ({ file_path, line, character, newName }) => {
  console.error(`✏️ Calling rename for ${file_path}:${line}:${character} -> ${newName}`);
  const result = await lspClient.rename(file_path, line, character, newName);

  if (result && (result.changes || result.documentChanges)) {
    const applied = applyWorkspaceEdit(result);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Renamed to "${newName}"`,
          filesModified: applied
        }, null, 2)
      }]
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ success: false, result }, null, 2) }]
  };
});

// Démarrer le serveur
async function main() {
  console.error('Starting Elm LSP MCP server...');
  await lspClient.start();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server started successfully');
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down...');
  lspClient.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down...');
  lspClient.cleanup();
  process.exit(0);
});

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 