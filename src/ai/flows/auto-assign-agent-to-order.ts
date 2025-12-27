'use server';
/**
 * @fileOverview Automatically assigns the nearest available agent to a new scrap pickup order.
 *
 * - autoAssignAgentToOrder - A function that handles the agent assignment process.
 * - AutoAssignAgentToOrderInput - The input type for the autoAssignAgentToOrder function.
 * - AutoAssignAgentToOrderOutput - The return type for the autoAssignAgentToOrder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoAssignAgentToOrderInputSchema = z.object({
  orderId: z.string().describe('The ID of the newly created scrap pickup order.'),
  pickupAddress: z.string().describe('The pickup address for the order.'),
});
export type AutoAssignAgentToOrderInput = z.infer<typeof AutoAssignAgentToOrderInputSchema>;

const AutoAssignAgentToOrderOutputSchema = z.object({
  agentId: z.string().describe('The ID of the assigned agent.'),
  reason: z.string().describe('The reason for assigning this particular agent.'),
});
export type AutoAssignAgentToOrderOutput = z.infer<typeof AutoAssignAgentToOrderOutputSchema>;

export async function autoAssignAgentToOrder(input: AutoAssignAgentToOrderInput): Promise<AutoAssignAgentToOrderOutput> {
  return autoAssignAgentToOrderFlow(input);
}

const findNearestAgentTool = ai.defineTool({
  name: 'findNearestAgent',
  description: 'Finds the nearest available agent to a given pickup address.',
  inputSchema: z.object({
    pickupAddress: z.string().describe('The pickup address for the order.'),
  }),
  outputSchema: z.object({
    agentId: z.string().describe('The ID of the nearest available agent.'),
  }),
},
async (input) => {
  // TODO: Implement the logic to find the nearest available agent
  // This is a placeholder implementation
  console.log("Finding the nearest agent for address: " + input.pickupAddress);
  return { agentId: 'agent123' };
});

const prompt = ai.definePrompt({
  name: 'autoAssignAgentPrompt',
  input: {schema: AutoAssignAgentToOrderInputSchema},
  output: {schema: AutoAssignAgentToOrderOutputSchema},
  tools: [findNearestAgentTool],
  prompt: `You are an expert logistics coordinator. A new scrap pickup order has been created and you need to assign the nearest available agent to the order.

  Order ID: {{{orderId}}}
  Pickup Address: {{{pickupAddress}}}

  Use the findNearestAgent tool to find the nearest available agent to the pickup address. Return the agent ID and a brief reason for assigning this agent.
`,
});

const autoAssignAgentToOrderFlow = ai.defineFlow(
  {
    name: 'autoAssignAgentToOrderFlow',
    inputSchema: AutoAssignAgentToOrderInputSchema,
    outputSchema: AutoAssignAgentToOrderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
