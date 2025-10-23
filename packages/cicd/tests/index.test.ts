/**
 * @ack/cicd - Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  WorkflowGenerator,
  PipelineExecutor,
  DockerBuilder,
  PerformanceMonitor,
  createWorkflowGenerator,
  createPipelineExecutor,
  createDockerBuilder,
  createPerformanceMonitor,
  defaultACKPipeline,
  deploymentPipeline,
  CICDUtils,
  type PipelineConfig,
  type WorkflowResult
} from '../src/index';

describe('CI/CD System', () => {
  describe('Workflow Generator', () => {
    it('should generate GitHub Actions workflow YAML', () => {
      const config: PipelineConfig = {
        name: 'Test Pipeline',
        triggers: [
          { event: 'push', branches: ['main'] }
        ],
        jobs: [
          {
            name: 'test',
            runsOn: 'ubuntu-latest',
            steps: [
              {
                name: 'Checkout',
                uses: 'actions/checkout@v3'
              }
            ]
          }
        ]
      };

      const generator = createWorkflowGenerator(config);
      const yaml = generator.generateGitHubActionsWorkflow();

      expect(yaml).toContain('name: "Test Pipeline"');
      expect(yaml).toContain('on:');
      expect(yaml).toContain('push:');
      expect(yaml).toContain('jobs:');
      expect(yaml).toContain('test:');
      expect(yaml).toContain('ubuntu-latest');
      expect(yaml).toContain('actions/checkout@v3');
    });

    it('should handle multiple triggers', () => {
      const config: PipelineConfig = {
        name: 'Multi-trigger Pipeline',
        triggers: [
          { event: 'push', branches: ['main', 'develop'] },
          { event: 'pull_request', branches: ['main'] },
          { event: 'schedule', cron: '0 0 * * *' }
        ],
        jobs: [
          {
            name: 'test',
            runsOn: 'ubuntu-latest',
            steps: []
          }
        ]
      };

      const generator = createWorkflowGenerator(config);
      const yaml = generator.generateGitHubActionsWorkflow();

      expect(yaml).toContain('push:');
      expect(yaml).toContain('pull_request:');
      expect(yaml).toContain('schedule:');
    });

    it('should handle job dependencies', () => {
      const config: PipelineConfig = {
        name: 'Dependent Jobs Pipeline',
        triggers: [{ event: 'push' }],
        jobs: [
          {
            name: 'build',
            runsOn: 'ubuntu-latest',
            steps: []
          },
          {
            name: 'test',
            runsOn: 'ubuntu-latest',
            needs: ['build'],
            steps: []
          }
        ]
      };

      const generator = createWorkflowGenerator(config);
      const yaml = generator.generateGitHubActionsWorkflow();

      expect(yaml).toContain('needs:');
      expect(yaml).toContain('- "build"');
    });
  });

  describe('Pipeline Executor', () => {
    it('should execute a simple pipeline', async () => {
      const config: PipelineConfig = {
        name: 'Simple Test Pipeline',
        triggers: [{ event: 'push' }],
        jobs: [
          {
            name: 'test-job',
            runsOn: 'ubuntu-latest',
            steps: [
              {
                name: 'Test Step',
                run: 'echo "Hello World"'
              }
            ]
          }
        ]
      };

      const executor = createPipelineExecutor(config);
      const results = await executor.execute();

      expect(results.has('test-job')).toBe(true);
      const result = results.get('test-job')!;
      expect(result.success).toBe(true);
      expect(result.logs).toContain('Starting job: test-job');
      expect(result.logs).toContain('Job completed: test-job');
    });

    it('should handle step failures', async () => {
      const config: PipelineConfig = {
        name: 'Failing Pipeline',
        triggers: [{ event: 'push' }],
        jobs: [
          {
            name: 'test-job',
            runsOn: 'ubuntu-latest',
            steps: [
              {
                name: 'Failing Step',
                run: 'exit 1'
              }
            ]
          }
        ]
      };

      const executor = createPipelineExecutor(config);

      await expect(executor.execute()).rejects.toThrow();
    });

    it('should continue on error when configured', async () => {
      const config: PipelineConfig = {
        name: 'Continue on Error Pipeline',
        triggers: [{ event: 'push' }],
        jobs: [
          {
            name: 'test-job',
            runsOn: 'ubuntu-latest',
            steps: [
              {
                name: 'Failing Step',
                run: 'exit 1',
                continueOnError: true
              },
              {
                name: 'Success Step',
                run: 'echo "This should run"'
              }
            ]
          }
        ]
      };

      const executor = createPipelineExecutor(config);
      const results = await executor.execute();

      expect(results.has('test-job')).toBe(true);
      const result = results.get('test-job')!;
      expect(result.success).toBe(false); // Should fail because one step failed (even with continueOnError)
    });
  });

  describe('Docker Builder', () => {
    it('should generate Dockerfile', () => {
      const builder = createDockerBuilder({
        baseImage: 'node:18-alpine',
        exposePort: 3000
      });

      const dockerfile = builder.generateDockerfile();

      expect(dockerfile).toContain('FROM node:18-alpine');
      expect(dockerfile).toContain('EXPOSE 3000');
      expect(dockerfile).toContain('pnpm install --frozen-lockfile');
      expect(dockerfile).toContain('pnpm build');
    });

    it('should generate Docker Compose', () => {
      const services = [
        {
          name: 'web',
          ports: ['3000:3000'],
          environment: ['NODE_ENV=production'],
          build: '.'
        },
        {
          name: 'db',
          ports: ['5432:5432'],
          environment: ['POSTGRES_PASSWORD=password']
        }
      ];

      const builder = createDockerBuilder({});
      const compose = builder.generateDockerCompose(services);

      expect(compose).toContain('version: "3.8"');
      expect(compose).toContain('services:');
      expect(compose).toContain('web:');
      expect(compose).toContain('db:');
      expect(compose).toContain('3000:3000');
      expect(compose).toContain('5432:5432');
    });
  });

  describe('Performance Monitor', () => {
    it('should record and calculate metrics', () => {
      const monitor = createPerformanceMonitor();

      monitor.recordMetric('build-time', 1500);
      monitor.recordMetric('build-time', 1450);
      monitor.recordMetric('build-time', 1600);

      const average = monitor.getAverageMetric('build-time');
      const stats = monitor.getMetricStats('build-time');

      expect(average).toBeCloseTo(1517, 0);
      expect(stats.count).toBe(3);
      expect(stats.min).toBe(1450);
      expect(stats.max).toBe(1600);
    });

    it('should generate performance report', () => {
      const monitor = createPerformanceMonitor();

      monitor.recordMetric('test-time', 500);
      monitor.recordMetric('test-time', 550);

      const report = monitor.generateReport();

      expect(report).toContain('ACK Performance Monitoring Report');
      expect(report).toContain('test-time');
      expect(report).toContain('Average:');
      expect(report).toContain('Min:');
      expect(report).toContain('Max:');
      expect(report).toContain('Calls:');
    });
  });

  describe('Preset Configurations', () => {
    it('should have default ACK pipeline', () => {
      expect(defaultACKPipeline.name).toBe('ACK Framework CI/CD');
      expect(defaultACKPipeline.triggers).toHaveLength(2);
      expect(defaultACKPipeline.jobs).toHaveLength(3);
      expect(defaultACKPipeline.jobs[0].name).toBe('test');
      expect(defaultACKPipeline.jobs[1].name).toBe('e2e-test');
      expect(defaultACKPipeline.jobs[2].name).toBe('performance-benchmark');
    });

    it('should have deployment pipeline', () => {
      expect(deploymentPipeline.name).toBe('Deploy to Production');
      expect(deploymentPipeline.triggers).toHaveLength(1);
      expect(deploymentPipeline.jobs).toHaveLength(1);
      expect(deploymentPipeline.jobs[0].name).toBe('build-and-deploy');
    });
  });

  describe('CI/CD Utils', () => {
    it('should generate GitHub Actions workflow file', () => {
      const config: PipelineConfig = {
        name: 'Test Pipeline',
        triggers: [{ event: 'push' }],
        jobs: [{
          name: 'test',
          runsOn: 'ubuntu-latest',
          steps: []
        }]
      };

      const workflow = CICDUtils.generateGitHubActionsFile(config);

      expect(workflow).toContain('name: "Test Pipeline"');
      expect(workflow).toContain('on:');
      expect(workflow).toContain('jobs:');
    });

    it('should generate Dockerfile', () => {
      const dockerfile = CICDUtils.generateDockerfile({
        baseImage: 'node:18',
        exposePort: 8080
      });

      expect(dockerfile).toContain('FROM node:18');
      expect(dockerfile).toContain('EXPOSE 8080');
    });

    it('should compare performance metrics', () => {
      const current = { 'build-time': 1500, 'test-time': 300 };
      const baseline = { 'build-time': 1600, 'test-time': 300 };

      const comparison = CICDUtils.comparePerformance(current, baseline);

      expect(comparison.improved).toContain('build-time');
      expect(comparison.unchanged).toContain('test-time');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid pipeline configuration', async () => {
      const invalidConfig: PipelineConfig = {
        name: '',
        triggers: [],
        jobs: []
      };

      const executor = createPipelineExecutor(invalidConfig);

      await expect(executor.execute()).rejects.toThrow('Pipeline name is required');
    });

    it('should handle job execution errors', async () => {
      const config: PipelineConfig = {
        name: 'Error Test Pipeline',
        triggers: [{ event: 'push' }],
        jobs: [
          {
            name: 'error-job',
            runsOn: 'ubuntu-latest',
            steps: [
              {
                name: 'Error Step',
                run: 'throw new Error("Test error")'
              }
            ]
          }
        ]
      };

      const executor = createPipelineExecutor(config);

      await expect(executor.execute()).rejects.toThrow();
    });
  });

  describe('Integration', () => {
    it('should work with complete pipeline', async () => {
      const config = {
        ...defaultACKPipeline,
        name: 'Integration Test Pipeline'
      };

      const executor = createPipelineExecutor(config);
      const results = await executor.execute();

      expect(results.size).toBe(3); // 3 jobs
      expect(results.has('test')).toBe(true);
      expect(results.has('e2e-test')).toBe(true);
      expect(results.has('performance-benchmark')).toBe(true);

      // All jobs should succeed
      results.forEach((result, jobName) => {
        expect(result.success).toBe(true);
        expect(result.duration).toBeGreaterThan(0);
        expect(result.logs.length).toBeGreaterThan(0);
      });
    });
  });
});
