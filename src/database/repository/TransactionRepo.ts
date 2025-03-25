import Transaction, {TransactionModel} from "../model/Transaction";

async function findOneTransaction(where: any): Promise<Transaction | null> {
  return TransactionModel.findOne(where).populate([{path:'userId'}, {path:'planId'},  {path:'subscriptionId', populate: { path: 'planId', }}]).lean().exec();
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

async function findAllTransactionsAdmin(filter:any,sortOptions:any, skip:any, limitNum:any):Promise<Transaction[] | [] | null> {
  const transactions = await TransactionModel.find(filter)
  .sort(sortOptions)
  .skip(skip)
  .limit(limitNum)
  .populate([{path:'userId'}, {path:'planId'}]);

  return transactions;
}

async function transactionCount (filter:any):Promise<any>{
return TransactionModel.countDocuments(filter)
}

getRevenueMetrics({})
export default {
  findOneTransaction,
  createTransaction,
  findAllTransactions,
  getRevenueMetrics,
  findAllTransactionsAdmin,
  transactionCount
};