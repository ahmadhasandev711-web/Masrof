import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { TransferModel } from "@/models/transfer";
import { AccountModel } from "@/models/account";
import { adjustAccountBalance } from "@/features/accounts/data";
import { toMinorUnits } from "@/lib/money";
import type { CreateTransferInput } from "@/features/transfers/schemas";
import type { TransferListItem } from "@/features/transfers/types";

export class InvalidTransferError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "InvalidTransferError";
  }
}

async function assertAccountsInWorkspace(
  workspaceId: string,
  fromAccountId: string,
  toAccountId: string,
  session: mongoose.ClientSession,
) {
  // MongoDB sessions are not concurrent — one operation at a time per session.
  const fromAccount = await AccountModel.findOne({
    _id: fromAccountId,
    workspaceId,
    isArchived: false,
  }).session(session);

  const toAccount = await AccountModel.findOne({
    _id: toAccountId,
    workspaceId,
    isArchived: false,
  }).session(session);

  if (!fromAccount) {
    throw new InvalidTransferError("sourceAccountNotFound");
  }
  if (!toAccount) {
    throw new InvalidTransferError("destinationAccountNotFound");
  }

  const fromCurrency = fromAccount.currency ?? null;
  const toCurrency = toAccount.currency ?? null;
  if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
    throw new InvalidTransferError("transferSameCurrencyOnly");
  }

  return { fromAccount, toAccount };
}

export async function createTransfer(input: CreateTransferInput, userId: string) {
  const mongooseInstance = await connectToDatabase();
  const session = await mongooseInstance.startSession();

  try {
    let createdId: string | undefined;

    await session.withTransaction(async () => {
      const { fromAccount } = await assertAccountsInWorkspace(
        input.workspaceId,
        input.fromAccountId,
        input.toAccountId,
        session,
      );

      const amountMinor = toMinorUnits(input.amount);

      if (fromAccount.cachedBalance < amountMinor) {
        throw new InvalidTransferError("insufficientBalance");
      }

      const [transfer] = await TransferModel.create(
        [
          {
            workspaceId: input.workspaceId,
            fromAccountId: input.fromAccountId,
            toAccountId: input.toAccountId,
            amount: amountMinor,
            transferDate: input.transferDate,
            description: input.description,
            notes: input.notes,
            createdBy: userId,
          },
        ],
        { session },
      );

      await adjustAccountBalance(input.fromAccountId, -amountMinor, session);
      await adjustAccountBalance(input.toAccountId, amountMinor, session);

      createdId = transfer._id.toString();
    });

    return createdId!;
  } finally {
    await session.endSession();
  }
}

export async function archiveTransfer(transferId: string, workspaceId: string) {
  const mongooseInstance = await connectToDatabase();
  const session = await mongooseInstance.startSession();

  try {
    await session.withTransaction(async () => {
      const existing = await TransferModel.findOne({
        _id: transferId,
        workspaceId,
        isArchived: false,
      }).session(session);

      if (!existing) {
        throw new InvalidTransferError("transferNotFound");
      }

      await adjustAccountBalance(String(existing.fromAccountId), existing.amount, session);
      await adjustAccountBalance(String(existing.toAccountId), -existing.amount, session);

      existing.isArchived = true;
      await existing.save({ session });
    });
  } finally {
    await session.endSession();
  }
}

export async function listTransfersForWorkspace(workspaceId: string, limit = 20) {
  await connectToDatabase();

  const transfers = await TransferModel.find({ workspaceId, isArchived: false })
    .sort({ transferDate: -1, createdAt: -1 })
    .limit(limit)
    .populate("fromAccountId", "name")
    .populate("toAccountId", "name")
    .lean();

  return toPlain(
    transfers.map((transfer): TransferListItem => {
      const from = transfer.fromAccountId as { _id?: unknown; name?: string } | null;
      const to = transfer.toAccountId as { _id?: unknown; name?: string } | null;

      return {
        _id: String(transfer._id),
        amount: transfer.amount,
        transferDate: new Date(transfer.transferDate).toISOString(),
        description: transfer.description ?? "",
        fromAccountName: from?.name ?? "—",
        toAccountName: to?.name ?? "—",
      };
    }),
  );
}
