import Transaction, {TransactionModel} from "../model/Transaction";

async function findOneTransaction(where: any): Promise<Transaction | null> {
  return TransactionModel.findOne(where).lean().exec();
}

async function createTransaction(params: any): Promise<Transaction> {
  return TransactionModel.create({ ...params });
}

async function findAllTransactions(where: any): Promise<Transaction[] | [] | null> {
  return TransactionModel.find(where).sort({ isDefault: -1, createdAt: -1 }).lean().exec();
}

export default {
  findOneTransaction,
  createTransaction,
  findAllTransactions
};