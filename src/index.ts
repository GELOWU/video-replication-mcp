#!/usr/bin/env node
/**
 * Video Replication MCP Server
 *
 * 为 AI 助手提供视频复刻能力的 MCP 服务器
 *
 * 功能：
 * - replicate_video: 创建视频复刻任务
 * - get_generation_status: 查询任务状态
 * - get_credits_balance: 查询积分余额
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// ============================================================================
// 配置
// ============================================================================

const API_BASE_URL = process.env.VIDEO_API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.VIDEO_API_KEY || '';

// ============================================================================
// Schema 定义
// ============================================================================

const ReplicateVideoSchema = z.object({
  imageUrl: z.string().url().describe('产品图片 URL'),
  videoUrl: z.string().url().describe('参考视频 URL'),
  language: z.string().default('中文').describe('生成脚本的语言，默认中文'),
  webhookUrl: z.string().url().optional().describe('可选的 Webhook 回调 URL'),
});

const GetGenerationStatusSchema = z.object({
  generationId: z.string().describe('任务 ID'),
});

// ============================================================================
// API 调用函数
// ============================================================================

async function callApi(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
): Promise<unknown> {
  if (!API_KEY) {
    throw new Error(
      '未配置 API Key，请设置环境变量 VIDEO_API_KEY'
    );
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as { error?: { message?: string; code?: string } };
    throw new Error(
      error.error?.message || `API 错误: ${response.status}`
    );
  }

  return data;
}

// ============================================================================
// 工具实现
// ============================================================================

async function replicateVideo(params: z.infer<typeof ReplicateVideoSchema>) {
  const result = await callApi('POST', '/api/v1/replicate-video', {
    imageUrl: params.imageUrl,
    videoUrl: params.videoUrl,
    language: params.language,
    webhookUrl: params.webhookUrl,
  });

  return result;
}

async function getGenerationStatus(
  params: z.infer<typeof GetGenerationStatusSchema>
) {
  const result = await callApi(
    'GET',
    `/api/v1/generations/${params.generationId}`
  );
  return result;
}

async function getCreditsBalance() {
  const result = await callApi('GET', '/api/v1/credits/balance');
  return result;
}

// ============================================================================
// MCP Server
// ============================================================================

const server = new Server(
  {
    name: 'video-replication-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 列出可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'replicate_video',
        description:
          '创建视频复刻任务。根据产品图片和参考视频，AI 会分析内容并生成新的营销视频。消耗 150 积分，处理时间约 2-5 分钟。',
        inputSchema: {
          type: 'object',
          properties: {
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: '产品图片 URL（支持 jpg/png/webp）',
            },
            videoUrl: {
              type: 'string',
              format: 'uri',
              description: '参考视频 URL（支持 mp4）',
            },
            language: {
              type: 'string',
              description: '生成脚本的语言，如：中文、English',
              default: '中文',
            },
            webhookUrl: {
              type: 'string',
              format: 'uri',
              description: '可选：任务完成后的回调 URL',
            },
          },
          required: ['imageUrl', 'videoUrl'],
        },
      },
      {
        name: 'get_generation_status',
        description:
          '查询视频生成任务的状态。返回任务进度、状态和结果 URL（如果已完成）。',
        inputSchema: {
          type: 'object',
          properties: {
            generationId: {
              type: 'string',
              description: '任务 ID（由 replicate_video 返回）',
            },
          },
          required: ['generationId'],
        },
      },
      {
        name: 'get_credits_balance',
        description: '查询当前账户的积分余额。',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'replicate_video': {
        const params = ReplicateVideoSchema.parse(args);
        result = await replicateVideo(params);
        break;
      }
      case 'get_generation_status': {
        const params = GetGenerationStatusSchema.parse(args);
        result = await getGenerationStatus(params);
        break;
      }
      case 'get_credits_balance': {
        result = await getCreditsBalance();
        break;
      }
      default:
        throw new Error(`未知工具: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return {
      content: [
        {
          type: 'text',
          text: `错误: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// 启动服务器
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Video Replication MCP Server 已启动');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});
