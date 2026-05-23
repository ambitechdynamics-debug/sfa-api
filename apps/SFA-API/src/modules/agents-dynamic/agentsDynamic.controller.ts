import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { runDynamicAgent } from './agentsDynamic.service';

export const agentsDynamicController = {
  runAgent: asyncHandler(async (req: Request, res: Response) => {
    const { agentKey, travailId } = req.params;
    const userId = req.user!.id;

    const result = await runDynamicAgent({
      agentKey,
      travailId,
      userId
    });

    sendSuccess(res, `Agent ${result.agentName} executed successfully`, result);
  })
};
