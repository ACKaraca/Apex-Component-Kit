/**
 * @ack/compiler - Public API
 * English: This file exports all public APIs of the compiler.
 */

// Parser exports
export { TokenLexer, Token } from './parser/tokenLexer';
export { BlockParser, ParsedBlocks } from './parser/blockParser';
export {
  TemplateParser,
  TemplateAST,
  TemplateNode,
  TemplateAttribute,
  EventBinding,
} from './parser/templateParser';
export {
  StyleParser,
  ParsedStyle,
  StyleRule,
  CSSProperty,
} from './parser/styleParser';
export { ComponentParser } from './parser/componentParser';

// Analyzer exports
export { ReactivityAnalyzer, VariableReference } from './analyzer/reactivityAnalyzer';
export { DependencyGraph } from './analyzer/dependencyGraph';

// CodeGen exports
export { ESMGenerator } from './codegen/esmGenerator';
export { CJSGenerator } from './codegen/cjsGenerator';
export {
  DOMUpdateCodeGen,
  DOMUpdateInstruction,
} from './codegen/domUpdateCodeGen';
export { HydrationCodeGen, HydrationData } from './codegen/hydrationCodeGen';

// Type exports
export type {
  ComponentModel,
  ScriptBlock,
  TemplateBlock,
  StyleBlock,
  ReactiveVariable,
  ImportStatement,
  ImportSpecifier,
  DependencyGraph as DependencyGraphType,
  DependencyNode,
  CodegenOptions,
  CompileResult,
  CompileError,
  CompileWarning,
} from './types/index';

// Internal imports for the compile function
import { ComponentParser } from './parser/componentParser';
import { ReactivityAnalyzer } from './analyzer/reactivityAnalyzer';
import { DependencyGraph } from './analyzer/dependencyGraph';
import { ESMGenerator } from './codegen/esmGenerator';
import { CJSGenerator } from './codegen/cjsGenerator';
import { HydrationCodeGen } from './codegen/hydrationCodeGen';
import type { CompileResult } from './types/index';

/**
 * Main compiler function - .ack dosyasını derle
 */
export function compile(
  source: string,
  options: {
    filePath?: string;
    format?: 'esm' | 'cjs' | 'both';
    minify?: boolean;
    sourceMap?: boolean;
    ssr?: boolean;
  } = {}
): CompileResult {
  try {
    // Parse component
    const parser = new ComponentParser(
      source,
      options.filePath || 'unknown.ack'
    );
    const component = parser.parse();

    // Analyze reactivity
    const analyzer = new ReactivityAnalyzer(component.scriptBlock.content);
    const analyzedVariables = analyzer.analyze(
      component.scriptBlock.reactiveVariables
    );
    component.scriptBlock.reactiveVariables = analyzedVariables;

    // Build dependency graph
    const depGraph = new DependencyGraph();
    depGraph.buildFromVariables(analyzedVariables);

    // Check for circular dependencies
    const analyzer2 = new ReactivityAnalyzer(component.scriptBlock.content);
    if (analyzer2.hasCircularDependency()) {
      return {
        code: '',
        errors: [
          {
            message: 'Circular dependency detected in component',
            line: 0,
            column: 0,
            source: source,
          },
        ],
        warnings: [],
      };
    }

    // Generate code
    let code = '';

    if (options.format === 'esm' || options.format === 'both') {
      const esmGen = new ESMGenerator(component, {
        format: 'esm',
        minify: options.minify || false,
        sourceMap: options.sourceMap || false,
        ssr: options.ssr || false,
        componentName: component.name,
      });
      code += esmGen.generate();

      if (component.styleBlock.content) {
        code += '\n// Styles\n';
        code += `const styles = \`${esmGen.generateStyles()}\`;\n`;
      }
    }

    if (options.format === 'cjs' || options.format === 'both') {
      const cjsGen = new CJSGenerator(component, {
        format: 'cjs',
        minify: options.minify || false,
        sourceMap: options.sourceMap || false,
        ssr: options.ssr || false,
        componentName: component.name,
      });
      code += '\n\n// CommonJS version\n';
      code += cjsGen.generate();
    }

    if (options.ssr) {
      const hydrationGen = new HydrationCodeGen(component);
      code += '\n\n// SSR Hydration\n';
      code += hydrationGen.generate('');
    }

    return {
      code,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    return {
      code: '',
      errors: [
        {
          message: error instanceof Error ? error.message : 'Unknown error',
          line: 0,
          column: 0,
          source: source,
        },
      ],
      warnings: [],
    };
  }
}

// Re-export key types - already exported above from './types/index'
// Removed duplicate CompileResult export
