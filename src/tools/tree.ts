/**
 * MCP tool definition for Tree Structure.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TreeStructureResource } from '../resources/tree-structure.js';
import { GetTreeStructureSchema } from '../schemas/tree.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerTreeTools(
  server: McpServer,
  resource: TreeStructureResource,
): void {
  server.tool(
    'rtm_get_tree_structure',
    'Fetch the folder tree structure for a project (or all projects).',
    GetTreeStructureSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.get(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_get_tree_structure');
      }
    },
  );
}
