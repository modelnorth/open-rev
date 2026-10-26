/**
 * OpenRev Sovereign Grammar & Tool Definition Compiler
 * 
 * Compiles versioned OpenRev CapabilityContracts and tool definitions
 * into structured JSON schemas and regex-constrained BNF grammars
 * for the Sovereign ultra-compact tool-calling engine.
 */

export interface SovereignToolParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  enum?: string[];
  pattern?: string;
}

export interface SovereignToolDefinition {
  name: string;
  description: string;
  parameters: SovereignToolParam[];
}

export interface CompiledSovereignGrammar {
  toolName: string;
  jsonSchema: Record<string, any>;
  regexConstraint: string;
}

export class SovereignGrammarCompiler {
  /**
   * Compiles an array of OpenRev tool specifications into Sovereign tool calling definitions.
   */
  public static compileTools(tools: SovereignToolDefinition[]): CompiledSovereignGrammar[] {
    return tools.map((tool) => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const param of tool.parameters) {
        properties[param.name] = {
          type: param.type,
          description: param.description
        };
        if (param.enum) {
          properties[param.name].enum = param.enum;
        }
        if (param.pattern) {
          properties[param.name].pattern = param.pattern;
        }
        if (param.required) {
          required.push(param.name);
        }
      }

      const jsonSchema = {
        type: 'object',
        properties: {
          tool: { const: tool.name },
          parameters: {
            type: 'object',
            properties,
            required
          }
        },
        required: ['tool', 'parameters']
      };

      // Construct constrained JSON regex matching rule for token decoding
      const regexConstraint = `\\{\\s*"tool"\\s*:\\s*"${tool.name}"\\s*,\\s*"parameters"\\s*:\\s*\\{.*?\\}\\s*\\}`;

      return {
        toolName: tool.name,
        jsonSchema,
        regexConstraint
      };
    });
  }

  /**
   * Standard OpenRev Core Capability Tools for Sovereign routing
   */
  public static getStandardOpenRevTools(): SovereignToolDefinition[] {
    return [
      {
        name: 'analyze_target',
        description: 'Analyzes an APK binary, extracts manifest, activities, permissions, and builds knowledge graph',
        parameters: [
          { name: 'targetPath', type: 'string', description: 'Path to target APK file', required: true }
        ]
      },
      {
        name: 'search_artifacts',
        description: 'Searches the indexed workspace artifacts using keyword or regular expression',
        parameters: [
          { name: 'query', type: 'string', description: 'Search term or regex pattern', required: true },
          { name: 'regex', type: 'boolean', description: 'Whether query is a regex pattern' }
        ]
      },
      {
        name: 'query_graph',
        description: 'Queries knowledge graph nodes by type or exported status',
        parameters: [
          { name: 'nodeType', type: 'string', description: 'Filter by type (Activity, Service, Permission, JniBridge)', required: true },
          { name: 'exportedOnly', type: 'boolean', description: 'Filter for exported components only' }
        ]
      },
      {
        name: 'generate_report',
        description: 'Generates an executive analysis markdown report for the current workspace',
        parameters: [
          { name: 'format', type: 'string', description: 'Report format', enum: ['markdown', 'json'] }
        ]
      },
      {
        name: 'detect_framework',
        description: 'Detects mobile framework (Flutter, React Native, Unity, Native ART)',
        parameters: [
          { name: 'targetPath', type: 'string', description: 'Path to APK', required: true }
        ]
      }
    ];
  }
}
