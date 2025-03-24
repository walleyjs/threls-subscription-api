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

async function getRevenueMetrics(where:any):Promise<any> {
  const result = await TransactionModel.aggregate([
    {
      $match: where
    },
    {
      $group: {
        _id: '$currency',
        amount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  

  return result
}
getRevenueMetrics({})
export default {
  findOneTransaction,
  createTransaction,
  findAllTransactions,
  getRevenueMetrics
};